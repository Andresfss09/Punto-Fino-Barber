const express = require('express');
const router = express.Router();
const {
  getAdminOverview,
  reassignAppointment,
  getAdminBarbers,
  createAdminBarber,
  updateAdminBarber,
  getBusinessSchedules,
  updateBusinessSchedules,
  createScheduleException,
  deleteScheduleException,
  openCashSession,
  getCurrentCashSession,
  closeCashSession,
  getInventory,
  upsertProduct,
  recordInventoryMovement,
  getBarberPayroll,
  approveCommissionSettlement,
  updateBarberCommission,
  updateBarberSalary,
  payoutAppointments,
  getClientsDirectory,
  getContactMessages,
  updateContactMessageStatus,
  getPanelNotifications,
  markNotificationRead,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// Rutas de notificaciones accesibles por ADMIN y BARBER
router.get('/notifications', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), getPanelNotifications);
router.put('/notifications/:id/read', protect, authorize('ADMIN', 'SUPER_ADMIN', 'BARBER'), markNotificationRead);

// Rutas protegidas estrictamente para rol ADMIN y SUPER_ADMIN
router.use(protect, authorize('ADMIN', 'SUPER_ADMIN'));

// Tablero General & Reasignación de Sillas
router.get('/overview', getAdminOverview);
router.post('/reassign-appointment', reassignAppointment);

// Gestión de Barberos
router.get('/barbers', getAdminBarbers);
router.post('/barbers', createAdminBarber);
router.put('/barbers/:id', updateAdminBarber);
router.put('/barbers/:id/commission', updateBarberCommission);
router.put('/barbers/:id/salary', updateBarberSalary);

// Horarios Oficiales y Excepciones
router.get('/schedules', getBusinessSchedules);
router.put('/schedules', updateBusinessSchedules);
router.post('/schedules/exceptions', createScheduleException);
router.delete('/schedules/exceptions/:id', deleteScheduleException);

// Caja y Arqueo Diario
router.get('/cash/current', getCurrentCashSession);
router.post('/cash/open', openCashSession);
router.post('/cash/close', closeCashSession);

// Catálogo de Productos ("Lo que usamos contigo") e Inventario
router.get('/inventory', getInventory);
router.post('/inventory', upsertProduct);
router.post('/inventory/movement', recordInventoryMovement);

// Nómina y Liquidación de Barberos (con snapshot inmutable)
router.get('/payroll', getBarberPayroll);
router.get('/payroll-stats', getBarberPayroll);
router.post('/payroll/approve', approveCommissionSettlement);
router.put('/payout', payoutAppointments);

// Directorio de Clientes y Bandeja de Mensajes de Contacto
router.get('/clients', getClientsDirectory);
router.get('/contact-messages', getContactMessages);
router.put('/contact-messages/:id', updateContactMessageStatus);

module.exports = router;
