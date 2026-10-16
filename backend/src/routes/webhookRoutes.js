const express = require('express');
const router = express.Router();
const { handleResendWebhook } = require('../controllers/webhookController');

// Webhook endpoint de Resend
router.post('/resend', handleResendWebhook);

module.exports = router;

