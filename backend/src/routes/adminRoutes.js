const express = require('express');
const router = express.Router();
const {
  getAdminOverview,
  reassignAppointment,
  openCashSession,
  getCurrentCashSession,
  closeCashSession,
  getInventory,
  recordInventoryMovement,
  getBarberPayroll,
  getClientsDirectory,
} = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');

// Rutas protegidas para rol ADMIN y SUPER_ADMIN
router.use(protect, authorize('ADMIN', 'SUPER_ADMIN'));

// Tablero General & Reasignación de Sillas
router.get('/overview', getAdminOverview);
router.post('/reassign-appointment', reassignAppointment);

// Caja y Arqueo Diario
router.get('/cash/current', getCurrentCashSession);
router.post('/cash/open', openCashSession);
router.post('/cash/close', closeCashSession);

// Inventario de Insumos y Pomadas
router.get('/inventory', getInventory);
router.post('/inventory/movement', recordInventoryMovement);

// Nómina y Liquidación de Barberos
router.get('/payroll', getBarberPayroll);

// Directorio de Clientes y Fichas Técnicas
router.get('/clients', getClientsDirectory);

module.exports = router;
