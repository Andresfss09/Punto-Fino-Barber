const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const apts = await prisma.appointment.findMany({
    include: { client: true, barber: { include: { user: true } } },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Appointments list:');
  apts.forEach(a => {
    console.log({
      code: a.bookingCode,
      client: a.client?.name,
      email: a.client?.email,
      phone: a.clientPhone || a.client?.phone,
      barber: a.barber?.user?.name,
      status: a.status,
      created: a.createdAt,
      start: a.startTime,
      price: a.totalPriceCOP
    });
  });
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

