const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apts = await prisma.appointment.findMany({
    where: { bookingCode: { in: ['PF-4051', 'PF-9013'] } },
    include: { service: true, items: true, consumedProducts: true }
  });
  console.log(JSON.stringify(apts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

