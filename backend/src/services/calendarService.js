/**
 * Servicio de Generación de Archivos .ics (iCalendar RFC 5545)
 * Compatible con Google Calendar, Apple Calendar, Outlook y dispositivos móviles.
 */

const formatICSDate = (date) => {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

exports.generateICS = (appointment, client, barber, services) => {
  const dtStart = formatICSDate(appointment.startTime);
  const dtEnd = formatICSDate(appointment.endTime);
  const now = formatICSDate(new Date());

  const servicesNames = services && services.length 
    ? services.map(s => s.name || s.service?.name).join(', ')
    : 'Servicio de barbería';

  const barberName = barber?.nickname || barber?.user?.name || 'Barbero Punto Fino';
  const clientName = client?.name || 'Cliente';
  const bookingCode = appointment.bookingCode || 'PF-CITA';

  const summary = `Cita en Punto Fino — ${barberName} [${bookingCode}]`;
  const location = `Punto Fino Barbería, Calle 5ta #38-24, Barrio Tequendama, Santiago de Cali, Colombia`;
  
  const manageUrl = appointment.actionToken 
    ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/cita/${appointment.actionToken}`
    : `${process.env.CLIENT_URL || 'http://localhost:5173'}/reservar`;

  const description = [
    `Hola ${clientName}, tu cita en Punto Fino está confirmada.`,
    `Barbero: ${barberName}`,
    `Servicios: ${servicesNames}`,
    `Valor total: $ ${appointment.totalPriceCOP?.toLocaleString('es-CO') || '0'} COP`,
    `Código de Reserva: ${bookingCode}`,
    `Ubicación: ${location}`,
    `Reprogramar o cancelar: ${manageUrl}`,
  ].join('\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Punto Fino Barberia//Santiago de Cali CO//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${bookingCode}-${appointment.id}@puntofinobarberia.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de cita en Punto Fino en 2 horas',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
};
