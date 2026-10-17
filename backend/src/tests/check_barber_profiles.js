const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const barbers = await prisma.barberProfile.findMany({
    include: { user: { select: { name: true, email: true } } }
  });
  console.log(JSON.stringify(barbers.map(b => ({
    id: b.id,
    userId: b.userId,
    name: b.user?.name,
    email: b.user?.email,
    commissionScheme: b.commissionScheme,
    commissionRate: b.commissionRate,
    productCommissionRate: b.productCommissionRate,
    fixedBaseAmountCOP: b.fixedBaseAmountCOP
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

