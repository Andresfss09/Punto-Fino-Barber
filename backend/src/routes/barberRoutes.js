const express = require('express');
const router = express.Router();
const {
  getBarbers,
  getBarberAvailability,
  getBarberDailySummary,
  getBarberEarnings,
  blockOwnTime,
} = require('../controllers/barberController');
const { protect, authorize } = require('../middlewares/auth');

// Rutas protegidas para el equipo (con verificación estricta de propiedad del recurso)
router.get('/me/daily-summary', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), getBarberDailySummary);
router.get('/me/dashboard', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), getBarberDailySummary);
router.get('/stats/me', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), getBarberDailySummary);
router.get('/me/earnings', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), getBarberEarnings);
router.post('/me/block-time', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), blockOwnTime);

// Rutas públicas
router.get('/', getBarbers);
router.get('/:id/availability', getBarberAvailability);

module.exports = router;