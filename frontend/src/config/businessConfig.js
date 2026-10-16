/**
 * Configuración Centralizada de Punto Fino
 * Sede Única: Carrera 12 #53-51, Barrio Villacolombia, Santiago de Cali, Colombia
 * Todos los textos, direcciones, coordenadas, canales de contacto y horarios
 * se gestionan en este archivo único.
 */

export const BUSINESS_CONFIG = {
  name: 'Punto Fino',
  legalName: 'Punto Fino S.A.S.',
  nit: '901.849.201-3',
  tagline: 'Villacolombia · Cali',
  taglineAlt: 'Corte & Cuidado Masculino · Cali',
  description: 'Estudio de barbería y cuidado masculino en Santiago de Cali. Cortes clásicos, degradados milimétricos y rituales tradicionales de toalla caliente y vapor de ozono con auténtico oficio.',
  
  // Sede Única
  location: {
    street: 'Carrera 12 #53-51',
    address: 'Carrera 12 #53-51',
    neighborhood: 'Barrio Villacolombia',
    commune: 'Comuna 8',
    city: 'Santiago de Cali',
    department: 'Valle del Cauca',
    country: 'Colombia',
    postalCode: '760010',
    fullAddress: 'Carrera 12 #53-51, Barrio Villacolombia, Cali, Valle del Cauca, Colombia',
    shortAddress: 'Carrera 12 #53-51, Villacolombia, Cali',
    
    // Coordenadas geográficas exactas de Carrera 12 #53-51, Villacolombia, Cali
    coordinates: {
      latitude: 3.4475,
      longitude: -76.5058,
      lat: 3.4475,
      lng: -76.5058,
    },
    googleMapsDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=3.4475,-76.5058',

    // Referencias para llegar a Villacolombia (editables)
    references: [
      'A dos cuadras del Parque Principal de Villacolombia',
      'Fácil acceso vehicular por el corredor de la Carrera 15 y Calle 52',
      'Bahía de parqueo para motocicletas justo frente al local'
    ],

    // Enlaces de navegación externa
    googleMapsUrl: 'https://maps.google.com/?q=Carrera+12+%2353-51,+Villacolombia,+Cali',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=3.4475,-76.5058',
    wazeUrl: 'https://waze.com/ul?ll=3.4475,-76.5058&navigate=yes',
  },

  // Canales de Contacto Directo
  contact: {
    phone: '+57 312 239 8964',
    phoneFormatted: '+57 312 239 8964',
    phoneDisplay: '312 239 8964',
    whatsapp: '+57 312 239 8964',
    whatsappUrl: 'https://wa.me/573122398964?text=Hola,%20me%20gustar%C3%ADa%20agendar%20una%20cita%20en%20Punto%20Fino',
    email: 'contacto@puntofino.co',
    adminEmail: 'admin@puntofino.co',
    instagram: '@puntofino.cali',
    instagramUrl: 'https://instagram.com/puntofino.cali',
  },

  // Horarios de Atención
  hours: [
    { day: 'Lunes', time: '08:00 — 20:30', isOpen: true },
    { day: 'Martes a Sábado', time: '09:00 — 20:30', isOpen: true },
    { day: 'Domingos', time: '09:00 — 16:00', isOpen: true },
  ],
  hoursDisplay: 'Lun: 08:00 - 20:30 | Mar-Sáb: 09:00 - 20:30 | Dom: 09:00 - 16:00',
  quickHours: 'Mar-Sáb: 09:00 - 20:30 · Dom: 09:00 - 16:00',

  // Configuración Monetaria y Zona Horaria
  locale: {
    currency: 'COP',
    currencySymbol: '$',
    timezone: 'America/Bogota',
    dateFormat: 'dd/mm/aaaa',
    language: 'es-CO',
  },

  // Equipo Oficial de Barberos (sin fotos de perfil, todos ofrecen todos los servicios)
  barbers: [
    {
      id: 'juan-david',
      name: 'Juan David',
      role: 'Barbero & Administrador',
      isAdmin: true,
      experience: '8+ Años',
      rating: 4.9,
      reviewsCount: 42,
      monogram: 'Jd',
      sortOrder: 1,
    },
    {
      id: 'emanuel-torres',
      name: 'Emanuel Torres',
      role: 'Barbero Profesional',
      isAdmin: false,
      experience: '6+ Años',
      rating: 4.9,
      reviewsCount: 38,
      monogram: 'et',
      sortOrder: 2,
    },
    {
      id: 'juan-diego',
      name: 'Juan Diego',
      role: 'Barbero Máster',
      isAdmin: false,
      experience: '7+ Años',
      rating: 5.0,
      reviewsCount: 45,
      monogram: 'JD',
      sortOrder: 3,
    },
  ],

  // Catálogo Oficial de Servicios (Tarifas fijas en COP, ofrecidos por TODOS los barberos)
  services: [
    {
      id: 'exp-punto-fino',
      name: 'Experiencia Punto Fino (Corte + Cejas)',
      slug: 'experiencia-punto-fino',
      description: 'Degradado a navaja milimétrico, cerquillo definido, lavado capilar y diseño con perfilado limpio de cejas.',
      durationMinutes: 35,
      priceCOP: 24000,
      badge: 'Popular · Recomendado',
      category: 'Cortes',
    },
    {
      id: 'exp-pf-barba',
      name: 'Experiencia Punto Fino + Ritual de Barba',
      slug: 'experiencia-punto-fino-ritual-barba',
      description: 'Corte completo con perfilado de cerquillo y cejas, combinado con ritual de barba, toalla caliente y aceites hidratantes.',
      durationMinutes: 45,
      priceCOP: 34000,
      badge: 'Popular',
      category: 'Combos',
    },
    {
      id: 'exp-platinium',
      name: 'Experiencia Platinium (VIP Todo Incluido)',
      slug: 'experiencia-platinium-vip',
      description: 'Servicio VIP integral: corte a tijera o degradado, ritual completo de barba con vapor de ozono, perfilado de cejas y exfoliación.',
      durationMinutes: 60,
      priceCOP: 55000,
      badge: '15% OFF',
      category: 'Combos',
    },
    {
      id: 'ritual-barba',
      name: 'Ritual de Barba',
      slug: 'ritual-de-barba',
      description: 'Toalla caliente aromatizada, vapor de ozono, perfilado a navaja tradicional y bálsamo calmante para piel fresca.',
      durationMinutes: 25,
      priceCOP: 12000,
      badge: 'Popular',
      category: 'Barba',
    },
    {
      id: 'cejas',
      name: 'Cejas',
      slug: 'perfilado-cejas',
      description: 'Limpieza, diseño milimétrico y perfilado con navaja fina para resaltar la mirada con máxima precisión.',
      durationMinutes: 15,
      priceCOP: 5000,
      badge: 'Detalle Rápido',
      category: 'Cejas',
    },
  ]
};

export default BUSINESS_CONFIG;
