const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getTechnicalNotes,
  updateTechnicalNotes,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

// Rutas de ficha técnica para el equipo (Barberos y Admins)
router.get('/:id/technical-notes', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER', 'RECEPTIONIST'), getTechnicalNotes);
router.put('/:id/technical-notes', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER', 'RECEPTIONIST'), updateTechnicalNotes);

// Rutas administrativas
router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAllUsers);
router.get('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), getUserById);
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateUser);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteUser);

module.exports = router;
