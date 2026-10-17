const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('--- ALL USERS ---');
  users.forEach(u => console.log(u));

  const apts = await prisma.appointment.findMany({
    include: { client: true, barber: { include: { user: true } } }
  });
  console.log('\n--- ALL APPOINTMENTS (' + apts.length + ') ---');
  apts.forEach(a => {
    console.log(`[${a.bookingCode}] ${a.client?.name} (${a.client?.email}) - Barber: ${a.barber?.user?.name} - Status: ${a.status} - Price: ${a.totalPriceCOP}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

