const express = require('express');
const router = express.Router();
const {
  getBarbers,
  getBarberAvailability,
} = require('../controllers/barberController');

// Rutas públicas
router.get('/', getBarbers);
router.get('/:id/availability', getBarberAvailability);

module.exports = router;