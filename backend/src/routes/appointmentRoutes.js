const express = require('express');
const router = express.Router();
const {
  sendBookingOtp,
  verifyBookingOtp,
  holdSlot,
  releaseHold,
  createAppointment,
  getAppointmentByCode,
  manageAppointmentByToken,
  getAppointments,
  updateStatus,
  createWalkInAppointment,
  checkoutAppointment,
} = require('../controllers/appointmentController');
const { protect, protectOptional, authorize } = require('../middlewares/auth');
const { otpRateLimiter, bookingRateLimiter } = require('../middlewares/rateLimit');

// Rutas públicas de reserva
router.post('/send-otp', otpRateLimiter, sendBookingOtp);
router.post('/verify-otp', verifyBookingOtp);
router.post('/hold', holdSlot);
router.delete('/hold/:id', releaseHold);
router.post('/', bookingRateLimiter, protectOptional, createAppointment);
router.get('/code/:code', getAppointmentByCode);
router.post('/token/:token/:action', manageAppointmentByToken);

// Rutas protegidas para el equipo (Barberos y Administradores)
router.use(protect);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'BARBER', 'RECEPTIONIST'), getAppointments);
router.get('/barber-appointments', authorize('ADMIN', 'SUPER_ADMIN', 'BARBER', 'RECEPTIONIST'), getAppointments);
router.post('/walk-in', authorize('ADMIN', 'SUPER_ADMIN'), createWalkInAppointment);
router.post('/:id/checkout', authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), checkoutAppointment);
router.put('/:id/status', authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), updateStatus);

module.exports = router;