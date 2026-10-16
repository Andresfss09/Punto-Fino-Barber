/**
 * Plantillas HTML y Texto Plano para Correos Transaccionales
 * Identidad de Autor "Punto Fino" (Santiago de Cali, Colombia)
 */

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #111215; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F7F5F0; }
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
  .ticket-label { color: #9B988F; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
  .ticket-val { color: #F7F5F0; font-weight: 600; }
  .ticket-val-accent { color: #E15233; font-weight: 700; font-family: monospace; }
  .btn-primary { display: block; width: fit-content; margin: 24px auto; background-color: #E15233; color: #FFFFFF !important; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 14px 28px; border-radius: 6px; text-align: center; }
  .btn-secondary { color: #E15233; text-decoration: underline; font-size: 12px; font-weight: 600; }
  .btn-danger { color: #D34538; text-decoration: underline; font-size: 12px; }
  .info-callout { background-color: rgba(225,82,51,0.06); border: 1px solid rgba(225,82,51,0.2); border-radius: 6px; padding: 14px; margin: 20px 0; font-size: 12px; color: #F7F5F0; line-height: 1.5; }
  .email-footer { background-color: #111215; padding: 20px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #6A6862; }
`;

const BUSINESS_CONFIG = require('../config/businessConfig');

// 1. CORREO AL CLIENTE: "Tu cita en Punto Fino está confirmada"
exports.buildClientConfirmationEmail = ({ appointment, client, barber, services }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const manageUrl = `${clientUrl}/cita/${appointment.actionToken}`;
  const cancelUrl = `${clientUrl}/cita/${appointment.actionToken}?action=cancel`;
  
  const formattedDate = new Date(appointment.startTime).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });

  const formattedTime = new Date(appointment.startTime).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  });

  const servicesListHtml = services.map(s => `
    <div style="display:flex;justify-content:space-between;padding:4px 0;color:#F7F5F0;">
      <span>• ${s.name} (${s.durationMinutes} min)</span>
      <span style="font-family:monospace;color:#9B988F;">$ ${s.priceCOP.toLocaleString('es-CO')} COP</span>
    </div>
  `).join('');

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
            <div class="brand-tagline">Oficio, paciencia y corte al milímetro</div>
          </div>
          <div class="email-body">
            <h2 class="email-h1">¡Hola, ${client.name}! Tu cita está confirmada.</h2>
            <p class="email-text">
              Te guardamos el puesto en la silla. Aquí tenés todos los detalles de tu turno para que llegués con calma y frescura a nuestra sede en Villacolombia.
            </p>

            <div class="ticket-box">
              <div style="padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:12px;">
                <span class="ticket-label">Código de Reserva</span>
                <div style="font-size:22px;font-family:monospace;font-weight:bold;color:#E15233;letter-spacing:2px;">
                  ${appointment.bookingCode}
                </div>
              </div>

              <div style="margin-bottom:10px;">
                <span class="ticket-label">Barbero:</span>
                <div class="ticket-val" style="margin-top:2px;">${barber.name} ("${barber.nickname}")</div>
              </div>

              <div style="margin-bottom:10px;">
                <span class="ticket-label">Fecha y Hora:</span>
                <div class="ticket-val" style="margin-top:2px;color:#F7F5F0;">
                  📅 ${formattedDate} a las ${formattedTime}
                </div>
                <div style="font-size:10px;color:#6A6862;font-family:monospace;">Zona horaria: America/Bogota (Cali, Colombia)</div>
              </div>

              <div style="margin-bottom:12px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.08);">
                <span class="ticket-label">Servicios Solicitados:</span>
                <div style="margin-top:6px;">${servicesListHtml}</div>
              </div>

              <div style="padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">
                <span class="ticket-label">Total a pagar al terminar:</span>
                <div class="ticket-val-accent" style="font-size:20px;margin-top:2px;">
                  $ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP
                </div>
                <div style="font-size:11px;color:#6A6862;margin-top:2px;">
                  Aceptamos Efectivo, Nequi, Daviplata y Datáfono.
                </div>
              </div>

              <div style="padding-top:12px;border-top:1px dashed rgba(255,255,255,0.08);margin-top:12px;">
                <span class="ticket-label">Dirección del Local:</span>
                <div class="ticket-val" style="margin-top:2px;">${BUSINESS_CONFIG.location.shortAddress}</div>
                <div style="margin-top:4px;">
                  <a href="${BUSINESS_CONFIG.location.googleMapsUrl}" target="_blank" style="color:#E15233;font-size:11px;text-decoration:underline;">
                    📍 Abrir ubicación en Google Maps / Waze →
                  </a>
                </div>
              </div>
            </div>

            <div class="info-callout">
              <strong>Adjunto a este correo</strong> encontrarás el archivo <code>cita-punto-fino.ics</code> para agregar el turno automáticamente a tu Google Calendar, Apple Calendar o celular.
            </div>

            <!-- Botones Seguros de Autogestión sin cuenta -->
            <div style="background-color:#111215;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:16px;text-align:center;margin:24px 0;">
              <div style="font-weight:600;font-size:13px;color:#F7F5F0;margin-bottom:6px;">¿Necesitás cambiar o cancelar tu turno?</div>
              <p style="font-size:11px;color:#9B988F;margin:0 0 12px 0;">
                No necesitas cuenta ni contraseña. Usa tu enlace seguro de un solo uso:
              </p>
              <div style="display:inline-flex;gap:16px;font-size:12px;">
                <a href="${manageUrl}" class="btn-secondary">Reprogramar Cita →</a>
                <span style="color:#6A6862;">·</span>
                <a href="${cancelUrl}" class="btn-danger">Cancelar Cita</a>
              </div>
            </div>

            <p style="font-size:11px;color:#6A6862;line-height:1.5;">
              <strong>Política de cancelación:</strong> Si te surge un imprevisto, te agradecemos reprogramar o cancelar con al menos 2 horas de anticipación.<br>
              <strong>Contacto directo:</strong> Escribinos al WhatsApp <a href="${BUSINESS_CONFIG.contact.whatsappUrl}" style="color:#9B988F;">${BUSINESS_CONFIG.contact.phoneFormatted}</a>.
            </p>
          </div>
          <div class="email-footer">
            Punto Fino · ${BUSINESS_CONFIG.location.fullAddress}<br>
            Este es un correo transaccional en estricto cumplimiento de la Ley 1581 de 2012 (Habeas Data).
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
¡Hola, ${client.name}! Tu cita en Punto Fino está confirmada.

Código de Reserva: ${appointment.bookingCode}
Barbero: ${barber.name} ("${barber.nickname}")
Fecha: ${formattedDate} a las ${formattedTime} (Hora de Colombia)
Total a pagar: $ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP
Dirección: ${BUSINESS_CONFIG.location.shortAddress}

Para reprogramar o cancelar tu cita sin contraseñas:
${manageUrl}

Encuentra adjunto el archivo .ics para agregar tu turno al calendario.
WhatsApp de atención: ${BUSINESS_CONFIG.contact.phoneFormatted}
  `.trim();

  return { html, text };
};

// 2. CORREO AL BARBERO: "Nueva cita agendada en tu silla"
exports.buildBarberNotificationEmail = ({ appointment, client, barber, services }) => {
  const waPhone = client.phone ? client.phone.replace(/\D/g, '') : '';
  const waText = encodeURIComponent(`¡Hola ${client.name}! Te saluda ${barber.nickname} de Punto Fino. Tu cita para el ${new Date(appointment.startTime).toLocaleDateString('es-CO')} quedó confirmada.`);
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

  const formattedTime = new Date(appointment.startTime).toLocaleTimeString('es-CO', {
    hour: '2-digit',
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

  const servicesNames = services.map(s => s.name).join(' + ');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><style>${baseStyles}</style></head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="email-header" style="border-bottom-color:#B89758;">
            <div class="brand-eyebrow" style="color:#B89758;">NOTIFICACIÓN PARA EL EQUIPO</div>
            <h1 class="brand-title">PUNTO FINO</h1>
            <div class="brand-tagline">App Interna de Barberos</div>
          </div>
          <div class="email-body">
            <h2 class="email-h1">Nueva cita en tu silla: ${client.name}</h2>
            <p class="email-text">
              Hola <strong>${barber.nickname}</strong>, un cliente ha reservado un turno en tu horario a través de la plataforma web:
            </p>

            <div class="ticket-box" style="border-left-color:#B89758;">
              <div class="ticket-row">
                <span class="ticket-label">Cliente:</span>
                <span class="ticket-val">${client.name}</span>
              </div>
              <div class="ticket-row">
                <span class="ticket-label">Celular / WhatsApp:</span>
                <span class="ticket-val" style="color:#71d083;">${client.phone}</span>
              </div>
              <div class="ticket-row">
                <span class="ticket-label">Horario:</span>
                <span class="ticket-val">${formattedDate} a las ${formattedTime}</span>
              </div>
              <div class="ticket-row">
                <span class="ticket-label">Servicios:</span>
                <span class="ticket-val">${servicesNames} (${appointment.totalDurationMin} min)</span>
              </div>
              <div class="ticket-row">
                <span class="ticket-label">Valor Estimado:</span>
                <span class="ticket-val-accent" style="color:#B89758;">$ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP</span>
              </div>
              ${appointment.clientNotes ? `
                <div style="padding-top:8px;margin-top:8px;border-top:1px dashed rgba(255,255,255,0.08);font-size:12px;color:#F7F5F0;">
                  <strong style="color:#9B988F;">Nota del cliente:</strong> <em>"${appointment.clientNotes}"</em>
                </div>
              ` : ''}
            </div>

            <div style="text-align:center;margin:24px 0;">
              <a href="${waUrl}" target="_blank" style="display:inline-block;background-color:#25D366;color:#000000;font-weight:bold;font-size:13px;padding:12px 24px;border-radius:6px;text-decoration:none;margin-bottom:12px;">
                💬 Abrir Chat de WhatsApp con el Cliente
              </a>
            </div>

            <p style="font-size:11px;color:#9B988F;text-align:center;">
              Podés revisar esta cita y registrar notas privadas desde tu app móvil de barbero.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Nueva cita agendada en tu silla, ${barber.nickname}:
Cliente: ${client.name}
Celular: ${client.phone} (WhatsApp: ${waUrl})
Fecha: ${formattedDate} a las ${formattedTime}
Servicios: ${servicesNames}
Total: $ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP
Notas: ${appointment.clientNotes || 'Ninguna'}
  `.trim();

  return { html, text };
};

// 3. CORREO AL ADMINISTRADOR: "Nueva reserva en Punto Fino"
exports.buildAdminNotificationEmail = ({ appointment, client, barber, services, todayStats }) => {
  const formattedTime = new Date(appointment.startTime).toLocaleTimeString('es-CO', {
    hour: '2-digit',
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
              Se ha completado una reserva pública desde la web. Detalles de operación:
            </p>

            <div class="ticket-box">
              <div class="ticket-row"><span class="ticket-label">Código:</span><span class="ticket-val-accent">${appointment.bookingCode}</span></div>
              <div class="ticket-row"><span class="ticket-label">Cliente:</span><span class="ticket-val">${client.name} (${client.phone})</span></div>
              <div class="ticket-row"><span class="ticket-label">Barbero:</span><span class="ticket-val">${barber.name} ("${barber.nickname}")</span></div>
              <div class="ticket-row"><span class="ticket-label">Fecha/Hora:</span><span class="ticket-val">${formattedDate} - ${formattedTime}</span></div>
              <div class="ticket-row"><span class="ticket-label">Ingreso Estimado:</span><span class="ticket-val" style="color:#E15233;">$ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP</span></div>
            </div>

            ${todayStats ? `
              <div style="background-color:#111215;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:14px;font-size:12px;margin:16px 0;">
                <div style="font-weight:bold;color:#F7F5F0;margin-bottom:4px;">Estado de Ocupación Hoy:</div>
                <div style="color:#9B988F;">Citas agendadas: <strong>${todayStats.count || 1}</strong> | Ocupación estimada: <strong>${todayStats.occupancyPct || 80}%</strong></div>
              </div>
            ` : ''}

            <div style="text-align:center;margin-top:20px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin" style="color:#E15233;font-size:12px;text-decoration:underline;">
                Abrir Panel de Control y Agenda del Día →
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
Cliente: ${client.name} (${client.phone})
Barbero: ${barber.name}
Fecha: ${formattedDate} a las ${formattedTime}
Total: $ ${appointment.totalPriceCOP.toLocaleString('es-CO')} COP
  `.trim();

  return { html, text };
};

