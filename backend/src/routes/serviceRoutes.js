const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceBySlug,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middlewares/auth');

// Rutas públicas
router.get('/', getServices);
router.get('/:slug', getServiceBySlug);

// Rutas administrativas
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), createService);
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateService);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteService);

module.exports = router;