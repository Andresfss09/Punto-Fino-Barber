/**
 * CÁLCULO OFICIAL DE FESTIVOS DE COLOMBIA (Ley 51 de 1983 - Ley Emiliani)
 * En Punto Fino los festivos se trabaja con el mismo horario de los domingos (09:00 a 16:00).
 */

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function moveToNextMonday(date) {
  const day = date.getUTCDay();
  if (day === 1) return date;
  const diff = day === 0 ? 1 : 8 - day;
  return new Date(date.getTime() + diff * 86400000);
}

function formatDate(dt) {
  return dt.toISOString().split('T')[0];
}

export function getColombianHolidaysForYear(year) {
  const easter = getEasterSunday(year);
  const addDays = (dt, days) => new Date(dt.getTime() + days * 86400000);

  const holidays = [
    // Fijos (no se trasladan)
    { date: `${year}-01-01`, name: 'Año Nuevo' },
    { date: `${year}-05-01`, name: 'Día del Trabajo' },
    { date: `${year}-07-20`, name: 'Día de la Independencia' },
    { date: `${year}-08-07`, name: 'Batalla de Boyacá' },
    { date: `${year}-12-08`, name: 'Inmaculada Concepción' },
    { date: `${year}-12-25`, name: 'Navidad' },

    // Fiestas religiosas y patrias que se trasladan al lunes siguiente (Ley Emiliani)
    { date: formatDate(moveToNextMonday(new Date(Date.UTC(year, 0, 6)))), name: 'Reyes Magos' },
    { date: formatDate(moveToNextMonday(new Date(Date.UTC(year, 2, 19)))), name: 'Día de San José' },
    { date: formatDate(moveToNextMonday(new Date(Date.UTC(year, 5, 29)))), name: 'San Pedro y San Pablo' },
    { date: formatDate(moveToNextMonday(new Date(Date.UTC(year, 7, 15)))), name: 'La Asunción' },
    { date: formatDate(moveToNextMonday(new Date(Date.UTC(year, 9, 12)))), name: 'Día de la Raza' },
    { date: formatDate(moveToNextMonday(new Date(Date.UTC(year, 10, 1)))), name: 'Todos los Santos' },
    { date: formatDate(moveToNextMonday(new Date(Date.UTC(year, 10, 11)))), name: 'Independencia de Cartagena' },

    // Dependientes de Pascua (Semana Santa y celebraciones religiosas)
    { date: formatDate(addDays(easter, -3)), name: 'Jueves Santo' },
    { date: formatDate(addDays(easter, -2)), name: 'Viernes Santo' },
    { date: formatDate(moveToNextMonday(addDays(easter, 39))), name: 'Ascensión del Señor' },
    { date: formatDate(moveToNextMonday(addDays(easter, 60))), name: 'Corpus Christi' },
    { date: formatDate(moveToNextMonday(addDays(easter, 68))), name: 'Sagrado Corazón' },
  ];

  return holidays;
}

/**
 * Verifica si una fecha 'YYYY-MM-DD' es festivo en Colombia
 * @param {string} dateStr Formato 'YYYY-MM-DD'
 * @returns {{ isHoliday: boolean, name: string | null }}
 */
export function isColombianHoliday(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isHoliday: false, name: null };
  }
  const year = parseInt(dateStr.slice(0, 4), 10);
  if (isNaN(year)) return { isHoliday: false, name: null };

  const holidays = getColombianHolidaysForYear(year);
  const match = holidays.find((h) => h.date === dateStr);
  if (match) {
    return { isHoliday: true, name: match.name };
  }
  return { isHoliday: false, name: null };
}

