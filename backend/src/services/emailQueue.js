/**
 * Motor de Cola Asíncrona de Correos Transaccionales "Punto Fino"
 * - Manejo con reintentos y retroceso exponencial (Exponential Backoff)
 * - Terna de correos al agendar: Cliente (.ics), Barbero (WhatsApp) y Admin (Ocupación)
 * - Notificaciones de reprogramación y cancelación por token
 * - Registro auditable permanente en tabla EmailAuditLog (Prisma)
 */

const prisma = require('../config/prisma');
const { sendEmail } = require('./emailService');
const { generateICS } = require('./calendarService');
const {
  buildClientConfirmationEmail,
  buildBarberNotificationEmail,
  buildAdminNotificationEmail,
} = require('./emailTemplates');

class EmailQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxAttempts = 3;
    this.delays = [1000, 3000, 7000]; // ms entre intentos
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  /**
   * Encolar un trabajo de correo
   */
  enqueue(job) {
    this.queue.push(job);
    this.processQueue();
  }

  /**
   * Procesador de la cola
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      const result = await sendEmail({
        to: job.to,
        subject: job.subject,
        html: job.html,
        text: job.text,
        attachments: job.attachments || [],
      });

      // Actualizar estado a SENT en base de datos
      await prisma.emailAuditLog.update({
        where: { id: job.logId },
        data: {
          status: 'SENT',
          providerId: result.providerId,
          sentAt: new Date(),
          attempts: job.attempts,
        },
      });

      if (this.io) {
        this.io.emit('email:status_update', {
          logId: job.logId,
          appointmentId: job.appointmentId,
          recipientType: job.recipientType,
          status: 'SENT',
          providerId: result.providerId,
        });
      }
    } catch (error) {
      console.error(`[EmailQueue Error] Falló intento ${job.attempts}/${this.maxAttempts} para ${job.to}:`, error.message);

      if (job.attempts < this.maxAttempts) {
        const nextAttempt = job.attempts + 1;
        const delay = this.delays[job.attempts - 1] || 5000;

        await prisma.emailAuditLog.update({
          where: { id: job.logId },
          data: {
            attempts: nextAttempt,
            lastError: error.message,
          },
        });

        setTimeout(() => {
          this.enqueue({ ...job, attempts: nextAttempt });
        }, delay);
      } else {
        // Marcado como FAILED tras agotar reintentos
        await prisma.emailAuditLog.update({
          where: { id: job.logId },
          data: {
            status: 'FAILED',
            lastError: error.message,
            attempts: job.attempts,
          },
        });

        if (this.io) {
          this.io.emit('email:status_update', {
            logId: job.logId,
            appointmentId: job.appointmentId,
            recipientType: job.recipientType,
            status: 'FAILED',
            lastError: error.message,
          });
        }
      }
    } finally {
      this.isProcessing = false;
      // Continuar con los siguientes trabajos en la cola
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Disparar la terna de correos al confirmar una cita:
   * 1. Al Cliente (con .ics adjunto)
   * 2. Al Barbero (con link directo de WhatsApp)
   * 3. Al Administrador (con métricas de ocupación del día)
   */
  async enqueueBookingEmails(appointmentId) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          barber: {
            include: { user: true },
          },
          items: {
            include: { service: true },
          },
        },
      });

      if (!appointment) {
        console.warn(`[EmailQueue] Cita ${appointmentId} no encontrada.`);
        return;
      }

      const client = appointment.client;
      const barber = {
        name: appointment.barber?.user?.name || 'Barbero Punto Fino',
        nickname: appointment.barber?.nickname || 'Barbero',
        email: appointment.barber?.user?.email,
      };
      const services = appointment.items.map((i) => ({
        name: i.service.name,
        priceCOP: i.priceCOP,
        durationMinutes: i.durationMinutes,
      }));

      // 1. Generar archivo .ics
      const icsContent = generateICS(appointment, client, barber, services);

      // Calcular ocupación estimada del día para el administrador
      const startOfDay = new Date(appointment.startTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointment.startTime);
      endOfDay.setHours(23, 59, 59, 999);

      const dayCount = await prisma.appointment.count({
        where: {
          startTime: { gte: startOfDay, lte: endOfDay },
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      });

      const todayStats = {
        count: dayCount,
        occupancyPct: Math.min(Math.round((dayCount / 12) * 100), 100),
      };

      // 2. Preparar los 3 mensajes
      const clientEmailContent = buildClientConfirmationEmail({ appointment, client, barber, services });
      const barberEmailContent = buildBarberNotificationEmail({ appointment, client, barber, services });
      const adminEmailContent = buildAdminNotificationEmail({ appointment, client, barber, services, todayStats });

      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@puntofino.com';
      const clientTargetEmail = client.email || (client.phone ? `${client.phone.replace(/\D/g, '')}@sms.local` : null);
      const barberTargetEmail = barber.email || 'brayan@puntofino.com';

      const emailJobs = [
        // Correo 1: Cliente
        {
          recipientType: 'CLIENT',
          to: clientTargetEmail,
          subject: `Tu cita en Punto Fino está confirmada — [${appointment.bookingCode}]`,
          html: clientEmailContent.html,
          text: clientEmailContent.text,
          attachments: [
            {
              filename: `cita-punto-fino-${appointment.bookingCode}.ics`,
              content: icsContent,
            },
          ],
        },
        // Correo 2: Barbero
        {
          recipientType: 'BARBER',
          to: barberTargetEmail,
          subject: `Nueva cita en tu silla: ${client.name} — [${appointment.bookingCode}]`,
          html: barberEmailContent.html,
          text: barberEmailContent.text,
        },
        // Correo 3: Administrador
        {
          recipientType: 'ADMIN',
          to: adminEmail,
          subject: `Nueva reserva en Punto Fino — [${appointment.bookingCode}]`,
          html: adminEmailContent.html,
          text: adminEmailContent.text,
        },
      ];

      // 3. Crear registros en EmailAuditLog y encolar
      for (const emailJob of emailJobs) {
        if (!emailJob.to) continue;

        // Verificar si ya existe log para evitar duplicados en reintentos
        let log = await prisma.emailAuditLog.findFirst({
          where: {
            appointmentId: appointment.id,
            recipientType: emailJob.recipientType,
          },
        });

        if (!log) {
          log = await prisma.emailAuditLog.create({
            data: {
              appointmentId: appointment.id,
              recipientType: emailJob.recipientType,
              toEmail: emailJob.to,
              subject: emailJob.subject,
              status: 'QUEUED',
              attempts: 1,
            },
          });
        }

        this.enqueue({
          logId: log.id,
          appointmentId: appointment.id,
          recipientType: emailJob.recipientType,
          to: emailJob.to,
          subject: emailJob.subject,
          html: emailJob.html,
          text: emailJob.text,
          attachments: emailJob.attachments || [],
          attempts: 1,
        });
      }
    } catch (error) {
      console.error('[EmailQueue] Error al preparar terna de correos:', error);
    }
  }

  /**
   * Notificación cuando el cliente cancela vía enlace con token
   */
  async enqueueCancellationEmails(appointmentId) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true, barber: { include: { user: true } } },
      });

      if (!appointment) return;

      const subject = `Cita cancelada [${appointment.bookingCode}] · Punto Fino`;
      const html = `
        <div style="background:#111215;color:#F7F5F0;padding:24px;font-family:sans-serif;">
          <h2 style="color:#E15233;">Cita Cancelada</h2>
          <p>La cita <strong>${appointment.bookingCode}</strong> de ${appointment.client.name} ha sido cancelada exitosamente.</p>
          <p>El cupo ha quedado libre en la agenda.</p>
        </div>
      `;

      const targets = [
        { type: 'CLIENT', to: appointment.client.email },
        { type: 'BARBER', to: appointment.barber?.user?.email },
        { type: 'ADMIN', to: process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@puntofino.com' },
      ].filter(t => Boolean(t.to));

      for (const t of targets) {
        const log = await prisma.emailAuditLog.create({
          data: {
            appointmentId: appointment.id,
            recipientType: t.type,
            toEmail: t.to,
            subject,
            status: 'QUEUED',
          },
        });

        this.enqueue({
          logId: log.id,
          appointmentId: appointment.id,
          recipientType: t.type,
          to: t.to,
          subject,
          html,
          text: `La cita ${appointment.bookingCode} ha sido cancelada.`,
          attempts: 1,
        });
      }
    } catch (err) {
      console.error('[EmailQueue] Error cancelando cita:', err);
    }
  }

  /**
   * Notificación cuando el cliente reprograma vía token
   */
  async enqueueRescheduleEmails(appointmentId) {
    try {
      // Al reprogramar, reenviamos la confirmación actualizada con el nuevo .ics
      await this.enqueueBookingEmails(appointmentId);
    } catch (err) {
      console.error('[EmailQueue] Error reprogramando cita:', err);
    }
  }

  /**
   * Helper para esperar que la cola termine en tests
   */
  async drain() {
    while (this.queue.length > 0 || this.isProcessing) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

// Instancia singleton
const emailQueue = new EmailQueue();
module.exports = emailQueue;

