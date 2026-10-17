const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isTest ? 200 : 15,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: isTest ? 1000 : 150,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Espera un momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: isTest ? 500 : 10,
  message: {
    success: false,
    message: 'Has solicitado demasiados códigos de verificación. Espera unos minutos antes de volver a intentarlo.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.bookingRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: isTest ? 500 : 20,
  message: {
    success: false,
    message: 'Has realizado demasiadas solicitudes de reserva desde esta dirección. Espera unos minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isTest ? 200 : 8,
  message: {
    success: false,
    message: 'Has enviado demasiados mensajes de contacto recientemente. Espera unos minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});