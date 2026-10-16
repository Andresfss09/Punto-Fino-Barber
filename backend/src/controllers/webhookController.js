/**
 * Controlador de Webhooks Transaccionales
 * Procesa eventos de entrega, apertura y rebote de Resend
 */

const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');

exports.handleResendWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!type || !data || !data.email_id) {
      return res.status(200).json({ received: true, note: 'Evento ignorado por falta de email_id' });
    }

    const emailId = data.email_id;
    const io = req.app.get('io');

    // Buscar el log por providerId
    const emailLog = await prisma.emailAuditLog.findFirst({
      where: { providerId: emailId },
    });

    if (!emailLog) {
      return res.status(200).json({ received: true, note: 'Registro no encontrado para este providerId' });
    }

    let newStatus = emailLog.status;
    let lastError = emailLog.lastError;

    if (type === 'email.delivered') {
      newStatus = 'DELIVERED';
    } else if (type === 'email.bounced') {
      newStatus = 'BOUNCED';
      lastError = data.bounce_type || 'Rebote reportado por el servidor de destino';
    }

    const updatedLog = await prisma.emailAuditLog.update({
      where: { id: emailLog.id },
      data: {
        status: newStatus,
        lastError,
      },
    });

    // Registrar en auditoría de seguridad
    await prisma.auditLog.create({
      data: {
        action: `WEBHOOK_RESEND_${type.toUpperCase()}`,
        resource: 'EmailAuditLog',
        resourceId: emailLog.id,
        details: JSON.stringify({ type, data }),
      },
    });

    if (io) {
      io.emit('email:status_update', {
        logId: updatedLog.id,
        appointmentId: updatedLog.appointmentId,
        recipientType: updatedLog.recipientType,
        status: newStatus,
        providerId: emailId,
      });
    }

    return res.status(200).json({
      received: true,
      logId: updatedLog.id,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error procesando webhook de Resend:', error);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }
};
