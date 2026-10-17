const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSalaries() {
  try {
    const res = await prisma.barberProfile.updateMany({
      data: {
        fixedBaseAmountCOP: 2000000,
        productCommissionRate: 0.15,
      },
    });

    console.log(`Updated ${res.count} barbers to $2.000.000 COP base salary.`);

    const barbers = await prisma.barberProfile.findMany({
      include: { user: true },
    });

    for (const b of barbers) {
      console.log(`- ${b.user?.name || b.nickname}: Base Mensual $${b.fixedBaseAmountCOP.toLocaleString('es-CO')} COP | Base Quincenal $${Math.round(b.fixedBaseAmountCOP / 2).toLocaleString('es-CO')} COP`);
    }
  } catch (error) {
    console.error('Error updating salaries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSalaries();

