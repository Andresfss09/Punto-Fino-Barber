/**
 * Sistema de Diseño "Punto Fino" - Tokens para React Native
 * Estética de Taller de Sastre y Barbería de Barrio (Santiago de Cali)
 */

export const colors = {
  // Fondos y Superficies de Alto Contraste
  carbon: '#111215',
  surface: '#18191E',
  elevated: '#22242B',
  border: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(225, 82, 51, 0.4)',

  // Acentos de Identidad
  terracota: '#E15233', // Terracota Caleño (Botón principal, estado activo)
  terracotaLight: '#FF6B4D',
  terracotaMuted: 'rgba(225, 82, 51, 0.15)',

  brass: '#B89758', // Latón Ahumado (Comisiones, barberos, notas técnicas)
  brassLight: '#D4B679',
  brassMuted: 'rgba(184, 151, 88, 0.15)',

  // Tipografía y Textos
  bone: '#F7F5F0', // Lino Hueso (Títulos y valores principales)
  muted: '#9B988F', // Gris Cemento (Subtítulos, etiquetas)
  subtle: '#6A6862', // Textos secundarios, disclaimers

  // Estados Funcionales de Barbería
  available: '#34D399', // Verde Esmeralda (En línea, sincronizado, disponible)
  occupied: '#E15233',  // Terracota (En silla ahora)
  paused: '#FBBF24',    // Ámbar (Pausa de barbero / Almuerzo)
  offline: '#F87171',   // Rojo Suave (Modo Offline / SQLite activo)
};

export const typography = {
  titleLarge: { fontSize: 24, fontWeight: '800' as const, color: colors.bone },
  titleMedium: { fontSize: 18, fontWeight: '700' as const, color: colors.bone },
  titleSmall: { fontSize: 14, fontWeight: '700' as const, color: colors.bone },
  bodyRegular: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  bodySmall: { fontSize: 11, color: colors.subtle, lineHeight: 15 },
  monoPrice: { fontSize: 16, fontWeight: '700' as const, color: colors.terracota },
  monoLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' as const, color: colors.muted },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};
