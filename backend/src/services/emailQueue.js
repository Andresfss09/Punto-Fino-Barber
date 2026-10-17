/**
 * Motor de Cola Asíncrona de Correos Transaccionales y Notificaciones de Panel — Punto Fino (Ronda 2)
 * - Comunicación exclusivamente por correo electrónico y paneles internos
 * - Terna de correos al agendar: Cliente (.ics), Barbero y Admin
 * - Creación automática de PanelNotification para el barbero y el administrador
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
    this.delays = [1000, 3000, 7000];
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  enqueue(job) {
    this.queue.push(job);
    this.processQueue();
  }

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

      if (job.logId) {
        await prisma.emailAuditLog.update({
          where: { id: job.logId },
          data: {
            status: 'SENT',
            providerId: result.providerId,
            sentAt: new Date(),
            attempts: job.attempts,
          },
        });
      }

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

        if (job.logId) {
          await prisma.emailAuditLog.update({
            where: { id: job.logId },
            data: {
              attempts: nextAttempt,
              lastError: error.message,
            },
          });
        }

        setTimeout(() => {
          this.enqueue({ ...job, attempts: nextAttempt });
        }, delay);
      } else {
        if (job.logId) {
          await prisma.emailAuditLog.update({
            where: { id: job.logId },
            data: {
              status: 'FAILED',
              lastError: error.message,
              attempts: job.attempts,
            },
          });
        }

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
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Disparar la terna de correos al confirmar una cita + notificaciones en panel
   */
  async enqueueBookingEmails(appointmentId) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          service: true,
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

      const services = appointment.service
        ? [{ name: appointment.service.name, priceCOP: appointment.service.priceCOP, durationMinutes: appointment.service.durationMinutes }]
        : appointment.items.map((i) => ({
            name: i.service.name,
            priceCOP: i.priceCOP,
            durationMinutes: i.durationMinutes,
          }));

      // Crear notificaciones en panel para Barbero y Admin
      await prisma.panelNotification.createMany({
        data: [
          {
            barberId: appointment.barberId,
            roleTarget: 'BARBER',
            title: `Nueva cita agendada [${appointment.bookingCode}]`,
            body: `${client.name} reservó ${services[0]?.name || 'servicio'} en tu agenda.`,
            type: 'NEW_BOOKING',
          },
          {
            roleTarget: 'ADMIN',
            title: `Reserva confirmada [${appointment.bookingCode}]`,
            body: `${client.name} agendó con ${barber.name} (${services[0]?.name || 'servicio'}).`,
            type: 'NEW_BOOKING',
          },
        ],
      });

      const icsContent = generateICS(appointment, client, barber, services);

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

      const clientEmailContent = buildClientConfirmationEmail({ appointment, client, barber, services });
      const barberEmailContent = buildBarberNotificationEmail({ appointment, client, barber, services });
      const adminEmailContent = buildAdminNotificationEmail({ appointment, client, barber, services, todayStats });

      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@puntofino.com';
      const clientTargetEmail = client.email;
      const barberTargetEmail = barber.email || 'juandavid@puntofino.com';

      const emailJobs = [
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
        {
          recipientType: 'BARBER',
          to: barberTargetEmail,
          subject: `Nueva cita en tu agenda: ${client.name} — [${appointment.bookingCode}]`,
          html: barberEmailContent.html,
          text: barberEmailContent.text,
        },
        {
          recipientType: 'ADMIN',
          to: adminEmail,
          subject: `Nueva reserva en Punto Fino — [${appointment.bookingCode}]`,
          html: adminEmailContent.html,
          text: adminEmailContent.text,
        },
      ];

      for (const emailJob of emailJobs) {
        if (!emailJob.to) continue;

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
   * Notificación cuando se cancela una cita
   */
  async enqueueCancellationEmails(appointmentId) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true, barber: { include: { user: true } } },
      });

      if (!appointment) return;

      await prisma.panelNotification.createMany({
        data: [
          {
            barberId: appointment.barberId,
            roleTarget: 'BARBER',
            title: `Cita cancelada [${appointment.bookingCode}]`,
            body: `La cita de ${appointment.client.name} ha sido cancelada.`,
            type: 'CANCELLED',
          },
          {
            roleTarget: 'ADMIN',
            title: `Cita cancelada [${appointment.bookingCode}]`,
            body: `${appointment.client.name} canceló su cita con ${appointment.barber?.nickname || 'barbero'}.`,
            type: 'CANCELLED',
          },
        ],
      });

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
      ].filter((t) => Boolean(t.to));

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
   * Notificación cuando se reprograma una cita
   */
  async enqueueRescheduleEmails(appointmentId) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true, barber: true },
      });
      if (appointment) {
        await prisma.panelNotification.createMany({
          data: [
            {
              barberId: appointment.barberId,
              roleTarget: 'BARBER',
              title: `Cita reprogramada [${appointment.bookingCode}]`,
              body: `${appointment.client.name} reprogramó su cita en tu agenda.`,
              type: 'RESCHEDULED',
            },
            {
              roleTarget: 'ADMIN',
              title: `Cita reprogramada [${appointment.bookingCode}]`,
              body: `${appointment.client.name} cambió la fecha/hora de su cita.`,
              type: 'RESCHEDULED',
            },
          ],
        });
      }
      await this.enqueueBookingEmails(appointmentId);
    } catch (err) {
      console.error('[EmailQueue] Error reprogramando cita:', err);
    }
  }

  async drain() {
    while (this.queue.length > 0 || this.isProcessing) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

const emailQueue = new EmailQueue();

async function createPanelNotification(data) {
  try {
    return await prisma.panelNotification.create({
      data: {
        userId: data.userId || null,
        barberId: data.barberId || null,
        roleTarget: data.roleTarget || 'BARBER',
        title: data.title,
        body: data.body,
        type: data.type || 'SYSTEM',
      },
    });
  } catch (err) {
    console.error('[EmailQueue] Error creando notificación de panel:', err);
  }
}

async function sendReassignmentAlert(appointment, oldBarber, targetBarber, reason) {
  try {
    await prisma.panelNotification.createMany({
      data: [
        {
          barberId: oldBarber.id,
          roleTarget: 'BARBER',
          title: `Cita reasignada [${appointment.bookingCode}]`,
          body: `Tu cita con ${appointment.client?.name || 'el cliente'} fue reasignada a ${targetBarber.nickname || targetBarber.name}. Motivo: ${reason || 'Ajuste operativo'}.`,
          type: 'REASSIGNED',
        },
        {
          barberId: targetBarber.id,
          roleTarget: 'BARBER',
          title: `Nueva cita asignada [${appointment.bookingCode}]`,
          body: `Se te ha asignado la cita de ${appointment.client?.name || 'el cliente'}. Motivo: ${reason || 'Ajuste operativo'}.`,
          type: 'REASSIGNED',
        },
      ],
    });

    if (appointment.client?.email) {
      emailQueue.enqueue({
        recipientType: 'CLIENT',
        to: appointment.client.email,
        subject: `Actualización de barbero en tu cita — Punto Fino [${appointment.bookingCode}]`,
        html: `<p>Hola ${appointment.client.name},</p><p>Te informamos que tu cita ha sido reasignada a <strong>${targetBarber.nickname || targetBarber.name}</strong> para garantizar tu atención puntual.</p><p>Horario: ${new Date(appointment.startTime).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>`,
        text: `Hola ${appointment.client.name}, tu cita ${appointment.bookingCode} fue reasignada a ${targetBarber.nickname || targetBarber.name}.`,
        attempts: 1,
      });
    }
  } catch (err) {
    console.error('[EmailQueue] Error enviando alerta de reasignación:', err);
  }
}

async function sendBarberInvitationEmail({ to, name, inviteToken, invitedBy }) {
  try {
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/onboarding/barber?token=${inviteToken}`;
    emailQueue.enqueue({
      recipientType: 'BARBER',
      to,
      subject: `Invitación al equipo de Punto Fino`,
      html: `<p>Hola ${name},</p><p>${invitedBy || 'El administrador'} te ha invitado al equipo de Punto Fino.</p><p><a href="${inviteUrl}">Completa tu perfil aquí</a></p>`,
      text: `Hola ${name}, accede a este enlace para completar tu perfil: ${inviteUrl}`,
      attempts: 1,
    });
  } catch (err) {
    console.error('[EmailQueue] Error enviando invitación de barbero:', err);
  }
}

emailQueue.createPanelNotification = createPanelNotification;
emailQueue.sendReassignmentAlert = sendReassignmentAlert;
emailQueue.sendBarberInvitationEmail = sendBarberInvitationEmail;

module.exports = emailQueue;
module.exports.createPanelNotification = createPanelNotification;
module.exports.sendReassignmentAlert = sendReassignmentAlert;
module.exports.sendBarberInvitationEmail = sendBarberInvitationEmail;

