const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  registerStaff,
  forgotPassword,
  resetPassword,
  logout,
  registerDeviceSession,
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');
const { authLimiter, otpRateLimiter } = require('../middlewares/rateLimit');

// Autenticación de personal
router.post('/login', authLimiter, login);
router.post('/forgot-password', otpRateLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/register-device', protect, registerDeviceSession);

// Registro administrativo de personal
router.post('/register-staff', protect, authorize('ADMIN', 'SUPER_ADMIN'), registerStaff);

module.exports = router;