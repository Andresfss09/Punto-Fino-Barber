const express = require('express');
const router = express.Router();
const {
  holdSlot,
  createAppointment,
  getAppointmentByCode,
  manageAppointmentByToken,
  getAppointments,
  updateStatus,
  createWalkInAppointment,
  checkoutAppointment,
} = require('../controllers/appointmentController');
const { protect, protectOptional } = require('../middlewares/auth');
const { authorize } = require('../middlewares/auth');

// Rutas públicas de reserva
router.post('/hold', holdSlot);
router.post('/', protectOptional, createAppointment);
router.get('/code/:code', getAppointmentByCode);
router.post('/token/:token/:action', manageAppointmentByToken);

// Rutas protegidas para el equipo (Barberos y Administradores)
router.use(protect);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'BARBER', 'RECEPTIONIST'), getAppointments);
router.post('/walk-in', authorize('ADMIN', 'SUPER_ADMIN', 'BARBER', 'RECEPTIONIST'), createWalkInAppointment);
router.post('/:id/checkout', authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), checkoutAppointment);
router.put('/:id/status', authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), updateStatus);

module.exports = router;