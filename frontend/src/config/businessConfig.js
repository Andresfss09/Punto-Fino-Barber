/**
 * CONFIGURACIÓN CENTRALIZADA DEL NEGOCIO — PUNTO FINO (RONDA 2)
 * Sede única en Santiago de Cali, Valle del Cauca, Colombia.
 * Comunicación exclusivamente por plataforma y correo electrónico.
 */

import { isColombianHoliday } from '../utils/colombianHolidays';

export const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DAY_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const OFFICIAL_SERVICES = [
  {
    id: 'srv-corte-cejas',
    name: 'Experiencia Punto Fino (Corte + Cejas)',
    slug: 'experiencia-punto-fino-corte-cejas',
    description: 'Degradado a navaja milimétrico, perfilado de cerquillo, diseño y limpieza de cejas con acabado profesional.',
    durationMinutes: 35,
    priceCOP: 24000,
    isPopular: true,
    badgeLabel: 'Popular',
    category: 'Cortes',
    sortOrder: 1,
  },
  {
    id: 'srv-corte-barba',
    name: 'Experiencia Punto Fino + Ritual de Barba',
    slug: 'experiencia-punto-fino-ritual-barba',
    description: 'Corte completo con perfilado de cerquillo y cejas, combinado con ritual de barba, toalla caliente y aceites.',
    durationMinutes: 45,
    priceCOP: 34000,
    isPopular: true,
    badgeLabel: 'Popular',
    category: 'Combos',
    sortOrder: 2,
  },
  {
    id: 'srv-platinium',
    name: 'Experiencia Platinium (VIP Todo Incluido)',
    slug: 'experiencia-platinium-vip',
    description: 'Servicio VIP integral: corte a tijera o degradado, ritual completo de barba, perfilado de cejas y exfoliación.',
    durationMinutes: 60,
    priceCOP: 55000,
    isPopular: false,
    badgeLabel: null,
    category: 'Combos',
    sortOrder: 3,
  },
  {
    id: 'srv-barba',
    name: 'Ritual de Barba',
    slug: 'ritual-de-barba',
    description: 'Toalla caliente aromatizada, vapor de ozono, perfilado a navaja tradicional y bálsamo hidratante.',
    durationMinutes: 25,
    priceCOP: 12000,
    isPopular: false,
    badgeLabel: null,
    category: 'Barba',
    sortOrder: 4,
  },
  {
    id: 'srv-cejas',
    name: 'Cejas',
    slug: 'cejas-punto-fino',
    description: 'Limpieza, diseño milimétrico y perfilado con navaja fina para resaltar la mirada con precisión.',
    durationMinutes: 15,
    priceCOP: 5000,
    isPopular: false,
    badgeLabel: null,
    category: 'Faciales',
    sortOrder: 5,
  },
];

export const OFFICIAL_SCHEDULES = [
  { dayOfWeek: 1, dayName: 'Lunes', shortName: 'Lun', openTime: '08:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 2, dayName: 'Martes', shortName: 'Mar', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 3, dayName: 'Miércoles', shortName: 'Mié', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 4, dayName: 'Jueves', shortName: 'Jue', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 5, dayName: 'Viernes', shortName: 'Vie', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 6, dayName: 'Sábado', shortName: 'Sáb', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 0, dayName: 'Domingo', shortName: 'Dom', openTime: '09:00', closeTime: '16:00', isOpen: true },
];

/**
 * Convierte hora en formato 24h ("08:00", "20:30", "16:00") a formato colombiano 12h ("8:00 a. m.", "8:30 p. m.")
 */
export function formatTime12h(time24) {
  if (!time24 || typeof time24 !== 'string') return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;
  const period = h >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${period}`;
}

export function formatRange12h(openTime, closeTime) {
  return `${formatTime12h(openTime)} a ${formatTime12h(closeTime)}`;
}

/**
 * Calcula en tiempo real si el local está "Abierto ahora" o "Cerrado" en zona America/Bogota
 */
export function getShopStatus(now = new Date(), customSchedules = OFFICIAL_SCHEDULES, exceptions = []) {
  try {
    // Obtener fecha y hora en America/Bogota
    const bogotaParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    }).formatToParts(now);

    const partMap = {};
    bogotaParts.forEach((p) => { partMap[p.type] = p.value; });

    const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
    const hour = parseInt(partMap.hour === '24' ? '0' : partMap.hour, 10);
    const minute = parseInt(partMap.minute, 10);
    const currentMinutes = hour * 60 + minute;

    const bogotaDateObj = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const dayOfWeek = bogotaDateObj.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb

    // Revisar si hoy hay excepción (festivo / cierre puntual en BD)
    const exception = exceptions.find((ex) => ex.date === dateStr);
    if (exception) {
      if (exception.isClosed) {
        return {
          isOpen: false,
          label: 'Cerrado hoy',
          detail: exception.reason || 'Excepción de horario',
          dayOfWeek,
          dateStr,
        };
      }
      if (exception.openTime && exception.closeTime) {
        const [oh, om] = exception.openTime.split(':').map(Number);
        const [ch, cm] = exception.closeTime.split(':').map(Number);
        const openMin = oh * 60 + om;
        const closeMin = ch * 60 + cm;
        const isOpen = currentMinutes >= openMin && currentMinutes < closeMin;
        return {
          isOpen,
          label: isOpen ? 'Abierto ahora' : 'Cerrado',
          detail: `${formatTime12h(exception.openTime)} a ${formatTime12h(exception.closeTime)}`,
          dayOfWeek,
          dateStr,
        };
      }
    }

    // Revisar si hoy es día festivo oficial en Colombia (abierto en horario de domingos: 9:00 a. m. a 4:00 p. m.)
    const holiday = isColombianHoliday(dateStr);
    if (holiday.isHoliday) {
      const openMin = 9 * 60;
      const closeMin = 16 * 60;
      const isOpen = currentMinutes >= openMin && currentMinutes < closeMin;
      return {
        isOpen,
        label: isOpen ? 'Abierto ahora' : 'Cerrado',
        detail: '9:00 a. m. a 4:00 p. m. (Festivo)',
        holidayName: holiday.name,
        isHoliday: true,
        dayOfWeek,
        dateStr,
      };
    }

    const schedule = customSchedules.find((s) => s.dayOfWeek === dayOfWeek) || OFFICIAL_SCHEDULES.find((s) => s.dayOfWeek === dayOfWeek);
    if (!schedule || !schedule.isOpen) {
      return {
        isOpen: false,
        label: 'Cerrado',
        detail: 'Cerrado hoy',
        dayOfWeek,
        dateStr,
      };
    }

    const [oh, om] = schedule.openTime.split(':').map(Number);
    const [ch, cm] = schedule.closeTime.split(':').map(Number);
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    const isOpen = currentMinutes >= openMin && currentMinutes < closeMin;

    return {
      isOpen,
      label: isOpen ? 'Abierto ahora' : 'Cerrado',
      detail: `${formatTime12h(schedule.openTime)} a ${formatTime12h(schedule.closeTime)}`,
      todaySchedule: schedule,
      dayOfWeek,
      dateStr,
    };
  } catch {
    return {
      isOpen: true,
      label: 'Abierto ahora',
      detail: '9:00 a. m. a 8:30 p. m.',
      dayOfWeek: new Date().getDay(),
    };
  }
}

export const OFFICIAL_PRODUCTS = [
  {
    id: 'prod-rolda-gel-black',
    name: 'Gel Black',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 25000,
    stock: 25,
    minStock: 5,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-gel-black.png',
    monogram: null,
    isActive: true,
    description: 'Gel fijador con pigmento oscuro sutil para mayor definición y control.',
  },
  {
    id: 'prod-nevera-jugo-hit',
    name: 'Jugo Hit',
    brand: 'NEVERA',
    category: 'NEVERA',
    priceCOP: 5000,
    stock: 40,
    minStock: 10,
    containsAlcohol: false,
    imageUrl: '/images/productos/nevera-jugo-hit.png',
    monogram: 'JH',
    isActive: true,
    description: 'Bebida refrescante bien fría para acompañar tu cita.',
  },
  {
    id: 'prod-nevera-aguila-laton',
    name: 'Cerveza Águila Latón',
    brand: 'NEVERA',
    category: 'NEVERA',
    priceCOP: 6000,
    stock: 48,
    minStock: 12,
    containsAlcohol: true,
    isAlcohol: true,
    imageUrl: '/images/productos/nevera-aguila-laton.webp',
    monogram: 'CA',
    isActive: true,
    // NOTA LEGAL: REVISAR CON ABOGADO — Prohibido el expendio de bebidas embriagantes a menores de edad (Ley 1801 de 2016)
    legalNotice: 'REVISAR CON ABOGADO: Venta exclusiva a mayores de 18 años.',
    description: 'Cerveza fría en lata grande. Exclusivo para mayores de 18 años.',
  },
  {
    id: 'prod-nevera-agua',
    name: 'Agua',
    brand: 'NEVERA',
    category: 'NEVERA',
    priceCOP: 3000,
    stock: 60,
    minStock: 15,
    containsAlcohol: false,
    imageUrl: '/images/productos/nevera-agua.webp',
    monogram: 'AG',
    isActive: true,
    description: 'Botella de agua natural fría.',
  },
  {
    id: 'prod-rolda-curl-crem',
    name: 'Curl Crem',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 36000,
    stock: 18,
    minStock: 4,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-curl-crem.png',
    monogram: null,
    isActive: true,
    description: 'Crema activadora y definidora de rizos con hidratación profunda.',
  },
  {
    id: 'prod-rolda-spiderwax',
    name: 'Spiderwax',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 34000,
    stock: 20,
    minStock: 5,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-spiderwax.png',
    monogram: null,
    isActive: true,
    description: 'Cera elástica efecto telaraña para textura flexible y acabado natural.',
  },
  {
    id: 'prod-rolda-aqua-wax',
    name: 'Aqua Wax',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 34000,
    stock: 22,
    minStock: 5,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-aqua-wax.png',
    monogram: null,
    isActive: true,
    description: 'Cera a base de agua con brillo medio y fijación limpia sin residuos.',
  },
  {
    id: 'prod-rolda-gel-wax',
    name: 'Gel Wax',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 34000,
    stock: 20,
    minStock: 5,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-gel-wax.png',
    monogram: null,
    isActive: true,
    description: 'Fijación extrema tipo gel con la manejabilidad de una cera profesional.',
  },
];

export const OFFICIAL_BARBERS = [
  {
    id: 'juan-david',
    name: 'Juan David',
    roleLabel: 'Barbero & Administrador',
    isDualRole: true,
    weeklyRestDay: 3, // Miércoles
    restDayLabel: 'Descansa los miércoles',
    bio: 'Fundador de Punto Fino, barbero y administrador. Corte clásico, degradados de precisión y cuidado integral.',
  },
  {
    id: 'emanuel-torres',
    name: 'Emanuel Torres',
    roleLabel: 'Barbero Profesional',
    isDualRole: false,
    weeklyRestDay: 1, // Lunes
    restDayLabel: 'Descansa los lunes',
    bio: 'Barbero profesional con maestría en corte, ritual de barba con toalla caliente y vapor de ozono.',
  },
  {
    id: 'juan-diego',
    name: 'Juan Diego',
    roleLabel: 'Barbero Profesional',
    isDualRole: false,
    weeklyRestDay: 2, // Martes
    restDayLabel: 'Descansa los martes',
    bio: 'Dedicado al oficio del corte masculino y la precisión a tijera y máquina.',
  },
];

export const BUSINESS_CONFIG = {
  name: 'Punto Fino',
  legalName: 'Punto Fino',
  tagline: 'Villacolombia · Cali',
  subtitle: 'Villacolombia · Cali',
  shortTagline: 'Cali',
  descriptor: 'Corte & Cuidado Masculino',

  location: {
    street: 'Carrera 12 #53-51',
    address: 'Carrera 12 #53-51',
    neighborhood: 'Barrio Villacolombia',
    commune: 'Comuna 8',
    city: 'Santiago de Cali',
    department: 'Valle del Cauca',
    country: 'Colombia',
    countryCode: 'CO',
    postalCode: '760012',
    fullAddress: 'Carrera 12 #53-51, Barrio Villacolombia, Santiago de Cali, Valle del Cauca, Colombia',
    shortAddress: 'Carrera 12 #53-51, Villacolombia, Cali',
    cityLine: 'Barrio Villacolombia · Santiago de Cali, Valle del Cauca',
    coordinates: {
      lat: 3.4475,
      lng: -76.5058,
      latitude: 3.4475,
      longitude: -76.5058,
    },
    googleMapsDirectionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Carrera+12+%2353-51,+Villacolombia,+Cali,+Valle+del+Cauca,+Colombia',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Carrera+12+%2353-51,+Villacolombia,+Cali,+Valle+del+Cauca,+Colombia',
    googleMapsPlaceUrl:
      'https://www.google.com/maps/search/?api=1&query=Carrera+12+%2353-51,+Villacolombia,+Cali,+Colombia',
    arrivalReferences: [
      'A dos cuadras del Parque Principal de Villacolombia',
      'Fácil acceso vehicular por el corredor de la Carrera 15 y Calle 52',
      'Bahía de parqueo para motocicletas justo frente al local',
    ],
    references: [
      'A dos cuadras del Parque Principal de Villacolombia',
      'Fácil acceso vehicular por el corredor de la Carrera 15 y Calle 52',
      'Bahía de parqueo para motocicletas justo frente al local',
    ],
  },

  // Comunicación exclusiva por correo y plataforma
  contact: {
    email: 'contacto@puntofino.co',
    bookingEmail: 'reservas@puntofino.co',
    adminEmail: 'admin@puntofino.com',
    privacyChannel: 'contacto@puntofino.co y formulario oficial en la plataforma web',
  },

  // Reglas operativas de agenda y cancelación
  bookingRules: {
    cancellationWindowHours: 3,
    minAdvanceMinutes: 30,
    slotHoldMinutes: 8,
    bufferMinutes: 0,
    maxActiveBookingsPerClient: 2,
    singleServiceOnly: true,
    holidayNote: 'Los días festivos abrimos en jornada de domingo (9:00 a. m. a 4:00 p. m.).',
  },

  // Horarios oficiales los 7 días de la semana
  schedules: OFFICIAL_SCHEDULES,
  hours: {
    summaryShort: 'Lun 8:00 a. m. – 8:30 p. m. · Mar-Sáb 9:00 a. m. – 8:30 p. m. · Dom y Festivos 9:00 a. m. – 4:00 p. m.',
    summary: 'Lunes 8:00 a. m. – 8:30 p. m. · Martes a Sábado 9:00 a. m. – 8:30 p. m. · Domingo y Festivos 9:00 a. m. – 4:00 p. m.',
    monday: '8:00 a. m. a 8:30 p. m.',
    tuesdayToSaturday: '9:00 a. m. a 8:30 p. m.',
    sunday: '9:00 a. m. a 4:00 p. m.',
    holidays: '9:00 a. m. a 4:00 p. m.',
  },
  schedule: {
    monday: '8:00 a. m. a 8:30 p. m.',
    tuesdayToSaturday: '9:00 a. m. a 8:30 p. m.',
    sunday: '9:00 a. m. a 4:00 p. m.',
    holidays: '9:00 a. m. a 4:00 p. m.',
    summary: 'Lunes 8:00 a. m. – 8:30 p. m. · Martes a Sábado 9:00 a. m. – 8:30 p. m. · Domingo y Festivos 9:00 a. m. – 4:00 p. m.',
  },

  products: OFFICIAL_PRODUCTS,
  barbers: OFFICIAL_BARBERS,

  maps: {
    apiKey: import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    defaultZoom: 17,
  },
};

export default BUSINESS_CONFIG;
