const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanFakeAppointments() {
  const codesToKeep = ['PF-9013', 'PF-4051'];
  
  const fakeApts = await prisma.appointment.findMany({
    where: { bookingCode: { notIn: codesToKeep } }
  });
  
  console.log(`Found ${fakeApts.length} fake appointments to delete.`);
  const fakeIds = fakeApts.map(a => a.id);

  if (fakeIds.length > 0) {
    // 1. Delete slot holds
    const deletedHolds = await prisma.slotHold.deleteMany({
      where: { appointmentId: { in: fakeIds } }
    });
    console.log(`Deleted ${deletedHolds.count} slot holds.`);

    // 2. Delete appointment products
    const deletedProducts = await prisma.appointmentProduct.deleteMany({
      where: { appointmentId: { in: fakeIds } }
    });
    console.log(`Deleted ${deletedProducts.count} appointment products.`);

    // 3. Delete cash transactions
    const deletedTx = await prisma.cashTransaction.deleteMany({
      where: { appointmentId: { in: fakeIds } }
    });
    console.log(`Deleted ${deletedTx.count} cash transactions.`);

    // 4. Delete email audit logs
    const deletedEmails = await prisma.emailAuditLog.deleteMany({
      where: { appointmentId: { in: fakeIds } }
    });
    console.log(`Deleted ${deletedEmails.count} email audit logs.`);

    // 5. Delete appointment items (in case cascade not triggered)
    const deletedItems = await prisma.appointmentItem.deleteMany({
      where: { appointmentId: { in: fakeIds } }
    });
    console.log(`Deleted ${deletedItems.count} appointment items.`);

    // 6. Delete appointments
    const deletedApts = await prisma.appointment.deleteMany({
      where: { id: { in: fakeIds } }
    });
    console.log(`Deleted ${deletedApts.count} appointments.`);
  }

  // Also clean mock clients from User table who have no appointments
  const fakeEmails = [
    'mateo.holguin@gmail.com',
    'jaime.vecino@cali.co',
    'jaime.vecino@puntofino.co',
    'santiago.caicedo@cali.co',
    'alejandro.lloreda@cali.co',
    'cliente.a@semiabierto.co',
    'cliente.b@semiabierto.co',
    'c2@concurrencia.co',
    'carlos.mendoza.test@gmail.com'
  ];

  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { in: fakeEmails } }
  });
  console.log(`Deleted ${deletedUsers.count} fake client users.`);

  // Verify remaining
  const remainingApts = await prisma.appointment.findMany({
    include: { client: true, barber: { include: { user: true } } }
  });
  console.log(`Remaining appointments: ${remainingApts.length}`);
  remainingApts.forEach(a => {
    console.log(`- ${a.bookingCode}: ${a.client?.name} (${a.client?.email}) - Barber: ${a.barber?.user?.name} - Status: ${a.status} - Price: ${a.totalPriceCOP}`);
  });
}

cleanFakeAppointments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

