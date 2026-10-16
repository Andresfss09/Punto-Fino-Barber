/**
 * Servicio de Envío de Correos Transaccionales "Punto Fino"
 * Soporta Resend API nativa (HTTP Fetch), Nodemailer SMTP y Modo Simulación/Test.
 */

const nodemailer = require('nodemailer');

const isTestOrMock = () => {
  const key = process.env.RESEND_API_KEY;
  return (
    process.env.NODE_ENV === 'test' ||
    !key ||
    key.includes('placeholder') ||
    key.startsWith('test_') ||
    key.startsWith('mock_') ||
    key === 're_placeholder_api_key'
  );
};

/**
 * Enviar correo a través de Resend API REST nativa
 */
const sendViaResend = async ({ to, subject, html, text, attachments = [] }) => {
  const fromEmail = process.env.EMAIL_FROM || 'Punto Fino <reservas@puntofinobarberia.com>';
  
  // Formatear adjuntos para Resend (content en base64)
  const formattedAttachments = attachments.map((att) => {
    let content = att.content;
    if (typeof content === 'string') {
      content = Buffer.from(content, 'utf-8').toString('base64');
    } else if (Buffer.isBuffer(content)) {
      content = content.toString('base64');
    }
    return {
      filename: att.filename,
      content,
    };
  });

  const payload = {
    from: fromEmail,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    ...(formattedAttachments.length ? { attachments: formattedAttachments } : {}),
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Error ${response.status} en Resend API`);
  }

  return {
    providerId: data.id,
    provider: 'resend',
  };
};

/**
 * Enviar correo a través de Nodemailer SMTP (alternativa secundaria)
 */
const sendViaSMTP = async ({ to, subject, html, text, attachments = [] }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Punto Fino Barbería" <reservas@puntofinobarberia.com>',
    to,
    subject,
    html,
    text,
    attachments,
  });

  return {
    providerId: info.messageId,
    provider: 'smtp',
  };
};

/**
 * Dispatcher principal con auto-detección y simulación controlada
 */
exports.sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  if (!to) {
    throw new Error('Destinatario de correo no definido');
  }

  // 1. Si no hay credenciales reales o estamos en test, simular entrega exitosa
  if (isTestOrMock()) {
    const mockId = `sim_resend_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Email Mock] ✉️ Envío simulado a [${to}] | Asunto: "${subject}" | ID: ${mockId}`);
    }
    return {
      providerId: mockId,
      provider: 'mock_simulation',
      simulated: true,
    };
  }

  // 2. Si hay Resend API Key configurada
  if (process.env.RESEND_API_KEY) {
    return await sendViaResend({ to, subject, html, text, attachments });
  }

  // 3. Si hay SMTP configurado
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    return await sendViaSMTP({ to, subject, html, text, attachments });
  }

  // Fallback seguro
  const fallbackId = `sim_fallback_${Date.now()}`;
  return {
    providerId: fallbackId,
    provider: 'fallback',
    simulated: true,
  };
};