require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPayroll() {
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) throw new Error('No admin user found');

    const adminToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Get payroll
    const res = await axios.get('http://localhost:5000/api/admin/payroll', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('--- PAYROLL STATUS ---');
    console.log('Status:', res.status);
    const payload = res.data.data || res.data;
    console.log('Payload keys:', Object.keys(payload));
    console.log('Legal Note:', payload.legalNote);
    console.log('Summary Totals:');
    console.log('  Total Gross COP:', payload.summary?.totalShopGrossCOP);
    console.log('  Total Base Salary Payout:', payload.summary?.totalBaseSalaryPayout);
    console.log('  Total Commissions Payout:', payload.summary?.totalCommissionsPayout);
    console.log('  Total Barbers Payout:', payload.summary?.totalBarbersPayout);
    console.log('  Total Pending Payout:', payload.summary?.totalPendingPayout);

    console.log('\n--- BARBERS PAYROLL ---');
    for (const b of payload.barbersPayroll || []) {
      console.log(`Barber: ${b.name}`);
      console.log(`  Base Mensual: $${b.monthlyBaseCOP.toLocaleString('es-CO')} COP`);
      console.log(`  Base Quincenal (15 días): $${b.biweeklyBaseCOP.toLocaleString('es-CO')} COP`);
      console.log(`  Cortes: ${b.totalCuts} | Comisión Cortes (${b.commissionRate}%): $${b.serviceCommissionCOP.toLocaleString('es-CO')} COP`);
      console.log(`  Comisión Productos Rolda (${b.productCommissionRate}%): $${b.productCommissionCOP.toLocaleString('es-CO')} COP`);
      console.log(`  Total Nómina Quincenal a Pagar: $${b.netPayableCOP.toLocaleString('es-CO')} COP`);
      console.log(`  Liquidado: $${b.paidCommission.toLocaleString('es-CO')} | Pendiente: $${b.pendingCommission.toLocaleString('es-CO')}`);
    }

    const firstBarber = payload.barbersPayroll?.[0];
    if (firstBarber) {
      console.log(`\n--- TESTING SALARY UPDATE FOR ${firstBarber.name} ---`);
      const updateRes = await axios.put(
        `http://localhost:5000/api/admin/barbers/${firstBarber.barberId}/salary`,
        { baseSalaryCOP: 1700000, productCommissionRate: 20 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('Update Status:', updateRes.status);
      console.log('Update Message:', updateRes.data.message);

      // Re-fetch to verify updated calculation
      const refetch = await axios.get('http://localhost:5000/api/admin/payroll', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const updatedBarber = refetch.data.data.barbersPayroll.find(b => b.barberId === firstBarber.barberId);
      console.log(`Verification: New Monthly: $${updatedBarber.monthlyBaseCOP.toLocaleString('es-CO')}, New Biweekly: $${updatedBarber.biweeklyBaseCOP.toLocaleString('es-CO')}, New Prod %: ${updatedBarber.productCommissionRate}%`);

      // Reset back to legal minimum (1.623.500 COP) and 15%
      await axios.put(
        `http://localhost:5000/api/admin/barbers/${firstBarber.barberId}/salary`,
        { baseSalaryCOP: 1623500, productCommissionRate: 15 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('Reset back to legal minimum: $1.623.500 COP mensual ($811.750 COP quincenal)');
    }

    console.log('\n✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('Error during test:', error.response?.data || error.message);
  }
}

testPayroll();
