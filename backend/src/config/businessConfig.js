/**
 * CONFIGURACIÓN CENTRALIZADA DEL NEGOCIO — PUNTO FINO BACKEND (RONDA 2)
 * Sede única: Carrera 12 #53-51, Barrio Villacolombia, Santiago de Cali, Colombia.
 * Comunicación exclusivamente por plataforma y correo electrónico.
 */

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const OFFICIAL_SCHEDULES = [
  { dayOfWeek: 1, dayName: 'Lunes', shortName: 'Lun', openTime: '08:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 2, dayName: 'Martes', shortName: 'Mar', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 3, dayName: 'Miércoles', shortName: 'Mié', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 4, dayName: 'Jueves', shortName: 'Jue', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 5, dayName: 'Viernes', shortName: 'Vie', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 6, dayName: 'Sábado', shortName: 'Sáb', openTime: '09:00', closeTime: '20:30', isOpen: true },
  { dayOfWeek: 0, dayName: 'Domingo', shortName: 'Dom', openTime: '09:00', closeTime: '16:00', isOpen: true },
];

function formatTime12h(time24) {
  if (!time24 || typeof time24 !== 'string') return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;
  const period = h >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${period}`;
}

const OFFICIAL_PRODUCTS = [
  {
    name: 'Gel Black',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 25000,
    costCOP: 12000,
    stock: 25,
    minStock: 5,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-gel-black.png',
    monogram: null,
    isActive: true,
    description: 'Gel fijador con pigmento oscuro sutil para mayor definición y control.',
  },
  {
    name: 'Jugo Hit',
    brand: 'NEVERA',
    category: 'NEVERA',
    priceCOP: 5000,
    costCOP: 2500,
    stock: 40,
    minStock: 10,
    containsAlcohol: false,
    imageUrl: '/images/productos/nevera-jugo-hit.png',
    monogram: 'JH',
    isActive: true,
    description: 'Bebida refrescante bien fría para acompañar tu cita.',
  },
  {
    name: 'Cerveza Águila Latón',
    brand: 'NEVERA',
    category: 'NEVERA',
    priceCOP: 6000,
    costCOP: 3200,
    stock: 48,
    minStock: 12,
    containsAlcohol: true,
    isAlcohol: true,
    imageUrl: '/images/productos/nevera-aguila-laton.webp',
    monogram: 'CA',
    isActive: true,
    description: 'Cerveza fría en lata grande. Exclusivo para mayores de 18 años. [REVISAR CON ABOGADO]',
  },
  {
    name: 'Agua',
    brand: 'NEVERA',
    category: 'NEVERA',
    priceCOP: 3000,
    costCOP: 1200,
    stock: 60,
    minStock: 15,
    containsAlcohol: false,
    imageUrl: '/images/productos/nevera-agua.webp',
    monogram: 'AG',
    isActive: true,
    description: 'Botella de agua natural fría.',
  },
  {
    name: 'Curl Crem',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 36000,
    costCOP: 18000,
    stock: 18,
    minStock: 4,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-curl-crem.png',
    monogram: null,
    isActive: true,
    description: 'Crema activadora y definidora de rizos con hidratación profunda.',
  },
  {
    name: 'Spiderwax',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 34000,
    costCOP: 17000,
    stock: 20,
    minStock: 5,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-spiderwax.png',
    monogram: null,
    isActive: true,
    description: 'Cera elástica efecto telaraña para textura flexible y acabado natural.',
  },
  {
    name: 'Aqua Wax',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 34000,
    costCOP: 17000,
    stock: 22,
    minStock: 5,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-aqua-wax.png',
    monogram: null,
    isActive: true,
    description: 'Cera a base de agua con brillo medio y fijación limpia sin residuos.',
  },
  {
    name: 'Gel Wax',
    brand: 'ROLDA',
    category: 'ROLDA',
    priceCOP: 34000,
    costCOP: 17000,
    stock: 20,
    minStock: 5,
    containsAlcohol: false,
    imageUrl: '/images/productos/rolda-gel-wax.png',
    monogram: null,
    isActive: true,
    description: 'Fijación extrema tipo gel con la manejabilidad de una cera profesional.',
  },
];

const BUSINESS_CONFIG = {
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
  },

  contact: {
    email: 'contacto@puntofino.co',
    bookingEmail: 'reservas@puntofino.co',
    adminEmail: 'admin@puntofino.com',
    privacyChannel: 'contacto@puntofino.co y formulario oficial en la plataforma web',
  },

  bookingRules: {
    cancellationWindowHours: 3,
    minAdvanceMinutes: 30,
    slotHoldMinutes: 8,
    bufferMinutes: 0,
    maxActiveBookingsPerClient: 2,
    singleServiceOnly: true,
  },

  schedules: OFFICIAL_SCHEDULES,
  schedule: {
    monday: '8:00 a. m. a 8:30 p. m.',
    tuesdayToSaturday: '9:00 a. m. a 8:30 p. m.',
    sunday: '9:00 a. m. a 4:00 p. m.',
    holidays: '9:00 a. m. a 4:00 p. m. (mismo horario de domingos)',
    holidayNote: 'Los días festivos abrimos en jornada de domingo (9:00 a. m. a 4:00 p. m.).',
    summary: 'Lunes 8:00 a. m. – 8:30 p. m. · Martes a Sábado 9:00 a. m. – 8:30 p. m. · Domingo y Festivos 9:00 a. m. – 4:00 p. m.',
  },

  products: OFFICIAL_PRODUCTS,
  formatTime12h,
};

const OFFICIAL_BARBERS = [
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

module.exports = {
  BUSINESS_CONFIG,
  OFFICIAL_SCHEDULES,
  OFFICIAL_PRODUCTS,
  OFFICIAL_BARBERS,
  DAY_NAMES_ES,
  formatTime12h,
};
