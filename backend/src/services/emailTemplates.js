/**
 * Plantillas HTML y Texto Plano para Correos Transaccionales — Punto Fino (Ronda 2)
 * Sede única: Carrera 12 #53-51, Barrio Villacolombia, Santiago de Cali, Colombia.
 * Comunicación exclusivamente por correo electrónico y plataforma.
 */

const { BUSINESS_CONFIG } = require('../config/businessConfig');

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #111215; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F7F5F0; }
  .email-wrapper { width: 100%; background-color: #111215; padding: 24px 12px; }
  .email-container { max-width: 600px; margin: 0 auto; background-color: #18191E; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; overflow: hidden; }
  .email-header { background-color: #111215; padding: 28px 24px; text-align: center; border-bottom: 2px solid #E15233; }
  .brand-eyebrow { color: #E15233; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; margin-bottom: 6px; }
  .brand-title { color: #F7F5F0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
  .brand-tagline { color: #9B988F; font-size: 12px; margin-top: 4px; }
  .email-body { padding: 32px 24px; }
  .email-h1 { color: #F7F5F0; font-size: 20px; font-weight: 700; margin: 0 0 12px 0; }
  .email-text { color: #9B988F; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
  .ticket-box { background-color: #111215; border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid #E15233; border-radius: 6px; padding: 20px; margin: 20px 0; }
  .ticket-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px dashed rgba(255,255,255,0.06); }
  .ticket-label { color: #9B988F; font-size: 11px; }
  .ticket-val { color: #F7F5F0; font-weight: 600; font-variant-numeric: tabular-nums; }
  .ticket-val-accent { color: #E15233; font-weight: 700; font-variant-numeric: tabular-nums; }
  .btn-primary { display: block; width: fit-content; margin: 24px auto; background-color: #E15233; color: #FFFFFF !important; text-decoration: none; font-size: 13px; font-weight: 700; padding: 14px 28px; border-radius: 6px; text-align: center; }
  .btn-secondary { color: #E15233; text-decoration: underline; font-size: 12px; font-weight: 600; }
  .btn-danger { color: #D34538; text-decoration: underline; font-size: 12px; }
  .info-callout { background-color: rgba(225,82,51,0.06); border: 1px solid rgba(225,82,51,0.2); border-radius: 6px; padding: 14px; margin: 20px 0; font-size: 12px; color: #F7F5F0; line-height: 1.5; }
  .email-footer { background-color: #111215; padding: 20px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #6A6862; }
`;

// 1. CORREO AL CLIENTE: "Tu cita en Punto Fino está confirmada"
exports.buildClientConfirmationEmail = ({ appointment, client, barber, services }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const manageUrl = `${clientUrl}/cita/${appointment.actionToken}`;
  const cancelUrl = `${clientUrl}/cita/${appointment.actionToken}?action=cancel`;
  const cancellationHours = BUSINESS_CONFIG.bookingRules?.cancellationWindowHours || 3;

  const formattedDate = new Date(appointment.startTime).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });

  const formattedTime = new Date(appointment.startTime).toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  });

  const primaryService = services[0] || { name: 'Servicio Punto Fino', durationMinutes: appointment.totalDurationMin, priceCOP: appointment.totalPriceCOP };

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cita Confirmada · Punto Fino</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="email-header">
            <div class="brand-eyebrow">VILLACOLOMBIA · SANTIAGO DE CALI</div>
            <h1 class="brand-title">PUNTO FINO</h1>
            <div class="brand-tagline">Corte &amp; Cuidado Masculino</div>
          </div>
          <div class="email-body">
            <h2 class="email-h1">¡Hola, ${client.name}! Tu cita está confirmada.</h2>
            <p class="email-text">
              Te guardamos tu lugar en la silla. Aquí tienes todos los detalles de tu cita en nuestra sede de Villacolombia.
            </p>

            <div class="ticket-box">
              <div style="padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:12px;">
                <span class="ticket-label">Código de reserva</span>
                <div style="font-size:22px;font-weight:bold;color:#E15233;letter-spacing:1px;">
                  ${appointment.bookingCode}
                </div>
              </div>

              <div style="margin-bottom:10px;">
                <span class="ticket-label">Barbero asignado:</span>
                <div class="ticket-val" style="margin-top:2px;">${barber.name || barber.nickname}</div>
              </div>

              <div style="margin-bottom:10px;">
                <span class="ticket-label">Fecha y hora:</span>
                <div class="ticket-val" style="margin-top:2px;color:#F7F5F0;">
                  ${formattedDate} a las ${formattedTime}
                </div>
                <div style="font-size:10px;color:#6A6862;">Zona horaria: America/Bogota (Cali, Colombia)</div>
              </div>

              <div style="margin-bottom:12px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.08);">
                <span class="ticket-label">Servicio reservado:</span>
                <div style="margin-top:6px;display:flex;justify-content:space-between;color:#F7F5F0;">
                  <span>${primaryService.name} (${primaryService.durationMinutes} min)</span>
                  <span style="color:#9B988F;">$ ${primaryService.priceCOP.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              <div style="padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">
                <span class="ticket-label">Total a pagar al finalizar:</span>
                <div class="ticket-val-accent" style="font-size:20px;margin-top:2px;">
                  $ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP
                </div>
                <div style="font-size:11px;color:#6A6862;margin-top:2px;">
                  Aceptamos Efectivo, Nequi, Daviplata, Transferencia y Datáfono.
                </div>
              </div>

              <div style="padding-top:12px;border-top:1px dashed rgba(255,255,255,0.08);margin-top:12px;">
                <span class="ticket-label">Dirección del local:</span>
                <div class="ticket-val" style="margin-top:2px;">${BUSINESS_CONFIG.location.shortAddress}</div>
                <div style="margin-top:4px;">
                  <a href="${BUSINESS_CONFIG.location.directionsUrl}" target="_blank" style="color:#E15233;font-size:11px;text-decoration:underline;">
                    Abrir indicaciones en Google Maps →
                  </a>
                </div>
              </div>
            </div>

            <div class="info-callout">
              <strong>Adjunto a este correo</strong> encontrarás el archivo <code>cita-punto-fino.ics</code> para agregar tu cita automáticamente a tu calendario.
            </div>

            <div style="background-color:#111215;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:16px;text-align:center;margin:24px 0;">
              <div style="font-weight:600;font-size:13px;color:#F7F5F0;margin-bottom:6px;">¿Necesitas reprogramar o cancelar tu cita?</div>
              <p style="font-size:11px;color:#9B988F;margin:0 0 12px 0;">
                Usa tu enlace firmado de un solo uso (con el mismo barbero o cancela para elegir otro):
              </p>
              <div style="display:inline-flex;gap:16px;font-size:12px;">
                <a href="${manageUrl}" class="btn-secondary">Reprogramar cita →</a>
                <span style="color:#6A6862;">·</span>
                <a href="${cancelUrl}" class="btn-danger">Cancelar cita</a>
              </div>
            </div>

            <p style="font-size:11px;color:#6A6862;line-height:1.5;">
              <strong>Política de cancelación:</strong> Si te surge un imprevisto, puedes reprogramar o cancelar hasta con ${cancellationHours} horas de anticipación.<br>
              <strong>Canal de atención y Habeas Data:</strong> Escríbenos a <a href="mailto:${BUSINESS_CONFIG.contact.email}" style="color:#9B988F;">${BUSINESS_CONFIG.contact.email}</a> o mediante el formulario de contacto en la plataforma web.
            </p>
          </div>
          <div class="email-footer">
            Punto Fino · ${BUSINESS_CONFIG.location.fullAddress}<br>
            Correo transaccional conforme a la Ley 1581 de 2012 (Protección de Datos Personales).
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
¡Hola, ${client.name}! Tu cita en Punto Fino está confirmada.

Código de reserva: ${appointment.bookingCode}
Barbero: ${barber.name || barber.nickname}
Fecha y hora: ${formattedDate} a las ${formattedTime} (America/Bogota)
Servicio: ${primaryService.name} (${primaryService.durationMinutes} min)
Total a pagar: $ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP
Dirección: ${BUSINESS_CONFIG.location.shortAddress}

Política de cancelación: Puedes reprogramar o cancelar hasta con ${cancellationHours} horas de anticipación:
${manageUrl}

Canal de contacto y ejercicio de derechos Habeas Data: ${BUSINESS_CONFIG.contact.email}
  `.trim();

  return { html, text };
};

// 2. CORREO AL BARBERO: Solo nombre, correo, servicio, hora y notas del cliente
exports.buildBarberNotificationEmail = ({ appointment, client, barber, services }) => {
  const formattedTime = new Date(appointment.startTime).toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  });

  const formattedDate = new Date(appointment.startTime).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  });

  const serviceName = services[0]?.name || 'Servicio Punto Fino';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><style>${baseStyles}</style></head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="email-header" style="border-bottom-color:#B89758;">
            <div class="brand-eyebrow" style="color:#B89758;">NOTIFICACIÓN DE AGENDA</div>
            <h1 class="brand-title">PUNTO FINO</h1>
            <div class="brand-tagline">Panel de Barbero</div>
          </div>
          <div class="email-body">
            <h2 class="email-h1">Nueva cita agendada: ${client.name}</h2>
            <p class="email-text">
              Hola <strong>${barber.name || barber.nickname}</strong>, tienes una nueva cita confirmada en tu agenda:
            </p>

            <div class="ticket-box" style="border-left-color:#B89758;">
              <div class="ticket-row">
                <span class="ticket-label">Cliente:</span>
                <span class="ticket-val">${client.name}</span>
              </div>
              <div class="ticket-row">
                <span class="ticket-label">Correo electrónico:</span>
                <span class="ticket-val">${client.email}</span>
              </div>
              ${(client.phone || appointment.clientPhone) ? `
              <div class="ticket-row">
                <span class="ticket-label">Celular / WhatsApp:</span>
                <span class="ticket-val">${client.phone || appointment.clientPhone}</span>
              </div>` : ''}
              <div class="ticket-row">
                <span class="ticket-label">Servicio:</span>
                <span class="ticket-val">${serviceName} (${appointment.totalDurationMin} min)</span>
              </div>
              <div class="ticket-row">
                <span class="ticket-label">Fecha y hora:</span>
                <span class="ticket-val">${formattedDate} a las ${formattedTime}</span>
              </div>
              ${appointment.clientNotes ? `
                <div style="padding-top:8px;margin-top:8px;border-top:1px dashed rgba(255,255,255,0.08);font-size:12px;color:#F7F5F0;">
                  <strong style="color:#9B988F;">Notas del cliente:</strong> <em>"${appointment.clientNotes}"</em>
                </div>
              ` : ''}
            </div>

            <p style="font-size:11px;color:#9B988F;text-align:center;">
              Revisa tu agenda del día desde tu panel de barbero en Punto Fino.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Nueva cita en tu agenda, ${barber.name || barber.nickname}:
Cliente: ${client.name}
Correo: ${client.email}
Celular: ${client.phone || appointment.clientPhone || 'No registrado'}
Servicio: ${serviceName} (${appointment.totalDurationMin} min)
Hora: ${formattedDate} a las ${formattedTime}
Notas: ${appointment.clientNotes || 'Ninguna'}
  `.trim();

  return { html, text };
};

// 3. CORREO AL ADMINISTRADOR: Sin teléfono
exports.buildAdminNotificationEmail = ({ appointment, client, barber, services, todayStats }) => {
  const formattedTime = new Date(appointment.startTime).toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  });

  const formattedDate = new Date(appointment.startTime).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  });

  const serviceName = services[0]?.name || 'Servicio Punto Fino';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><style>${baseStyles}</style></head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="email-header">
            <div class="brand-eyebrow">PANEL ADMINISTRATIVO</div>
            <h1 class="brand-title">PUNTO FINO</h1>
            <div class="brand-tagline">Notificación de Reserva Web</div>
          </div>
          <div class="email-body">
            <h2 class="email-h1">Nueva reserva registrada: [${appointment.bookingCode}]</h2>
            <p class="email-text">
              Se ha confirmado una reserva en la plataforma:
            </p>

            <div class="ticket-box">
              <div class="ticket-row"><span class="ticket-label">Código:</span><span class="ticket-val-accent">${appointment.bookingCode}</span></div>
              <div class="ticket-row"><span class="ticket-label">Cliente:</span><span class="ticket-val">${client.name} (${client.email}${(client.phone || appointment.clientPhone) ? ` · ${client.phone || appointment.clientPhone}` : ''})</span></div>
              <div class="ticket-row"><span class="ticket-label">Barbero:</span><span class="ticket-val">${barber.name || barber.nickname}</span></div>
              <div class="ticket-row"><span class="ticket-label">Servicio:</span><span class="ticket-val">${serviceName}</span></div>
              <div class="ticket-row"><span class="ticket-label">Fecha y hora:</span><span class="ticket-val">${formattedDate} - ${formattedTime}</span></div>
              <div class="ticket-row"><span class="ticket-label">Valor:</span><span class="ticket-val" style="color:#E15233;">$ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP</span></div>
            </div>

            ${todayStats ? `
              <div style="background-color:#111215;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:14px;font-size:12px;margin:16px 0;">
                <div style="font-weight:bold;color:#F7F5F0;margin-bottom:4px;">Estado de ocupación hoy:</div>
                <div style="color:#9B988F;">Citas agendadas: <strong>${todayStats.count || 1}</strong> | Ocupación estimada: <strong>${todayStats.occupancyPct || 80}%</strong></div>
              </div>
            ` : ''}

            <div style="text-align:center;margin-top:20px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin" style="color:#E15233;font-size:12px;text-decoration:underline;">
                Abrir Panel de Administración →
              </a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Nueva reserva en Punto Fino [${appointment.bookingCode}]:
Cliente: ${client.name} (${client.email}${(client.phone || appointment.clientPhone) ? ` · ${client.phone || appointment.clientPhone}` : ''})
Barbero: ${barber.name || barber.nickname}
Servicio: ${serviceName}
Fecha y hora: ${formattedDate} a las ${formattedTime}
Valor: $ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP
  `.trim();

  return { html, text };
};

// 4. CORREO DE CÓDIGO DE VERIFICACIÓN DE 6 DÍGITOS (OTP DE UN SOLO USO)
exports.buildOtpVerificationEmail = ({ email, code }) => {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><style>${baseStyles}</style></head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="email-header">
            <div class="brand-eyebrow">VERIFICACIÓN DE RESERVA</div>
            <h1 class="brand-title">PUNTO FINO</h1>
            <div class="brand-tagline">Villacolombia · Cali</div>
          </div>
          <div class="email-body" style="text-align:center;">
            <h2 class="email-h1">Tu código de verificación</h2>
            <p class="email-text">
              Ingresa este código de 6 dígitos de un solo uso para confirmar tu cita en Punto Fino. Expira en 10 minutos.
            </p>
            <div style="background-color:#111215;border:1px solid #E15233;border-radius:8px;padding:20px;margin:24px auto;max-width:260px;">
              <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#F7F5F0;">${code}</span>
            </div>
            <p style="font-size:11px;color:#6A6862;">
              Si no solicitaste esta reserva con el correo ${email}, puedes ignorar este mensaje con tranquilidad.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `Tu código de verificación para confirmar tu cita en Punto Fino es: ${code}. Expira en 10 minutos.`;
  return { html, text };
};

// 5. CORREO DE INVITACIÓN A NUEVO BARBERO (DEFINIR CONTRASEÑA PROPIA)
exports.buildBarberInviteEmail = ({ name, email, inviteUrl }) => {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><style>${baseStyles}</style></head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="email-header">
            <div class="brand-eyebrow">INVITACIÓN AL EQUIPO</div>
            <h1 class="brand-title">PUNTO FINO</h1>
          </div>
          <div class="email-body">
            <h2 class="email-h1">Bienvenido al equipo, ${name}</h2>
            <p class="email-text">
              La administración de Punto Fino ha creado tu perfil de barbero (${email}). Para activar tu cuenta y definir tu propia contraseña personal (la cual es privada y nunca es visible para el administrador), abre el siguiente enlace:
            </p>
            <a href="${inviteUrl}" class="btn-primary">Definir mi contraseña →</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `Bienvenido a Punto Fino, ${name}. Define tu contraseña personal en: ${inviteUrl}`;
  return { html, text };
};
