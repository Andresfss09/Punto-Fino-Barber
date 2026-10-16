const express = require('express');
const router = express.Router();
const {
  getBarbers,
  getBarberAvailability,
  getBarberDailySummary,
} = require('../controllers/barberController');
const { protect, authorize } = require('../middlewares/auth');

// Rutas protegidas para el equipo
router.get('/me/daily-summary', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), getBarberDailySummary);

// Rutas públicas
router.get('/', getBarbers);
router.get('/:id/availability', getBarberAvailability);

module.exports = router;