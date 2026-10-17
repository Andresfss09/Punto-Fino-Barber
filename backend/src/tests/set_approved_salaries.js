const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDefaultSalaries() {
  const SMLMV_2025_WITH_TRANSPORT = 1623500; // SMLMV + Auxilio Transporte legal
  const res = await prisma.barberProfile.updateMany({
    data: {
      fixedBaseAmountCOP: SMLMV_2025_WITH_TRANSPORT,
      productCommissionRate: 0.15, // 15% comisión por venta de productos de cabello
    }
  });
  console.log(`Updated ${res.count} barbers with base salary $${SMLMV_2025_WITH_TRANSPORT}`);

  const barbers = await prisma.barberProfile.findMany({
    include: { user: { select: { name: true, email: true } } }
  });
  barbers.forEach(b => {
    console.log(`- ${b.user?.name}: Base Mensual $${b.fixedBaseAmountCOP} (Quincenal $${Math.round(b.fixedBaseAmountCOP / 2)}) | Comis. Cortes: ${Number(b.commissionRate) * 100}% | Comis. Productos: ${Number(b.productCommissionRate) * 100}%`);
  });
}

updateDefaultSalaries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

