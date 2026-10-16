const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  registerStaff,
  logout,
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');

// Autenticación de personal
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Registro administrativo de personal
router.post('/register-staff', protect, authorize('ADMIN', 'SUPER_ADMIN'), registerStaff);

module.exports = router;