const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alberto = await prisma.user.findFirst({
    where: { email: 'admin@puntofino.com' }
  });

  const juanDavid = await prisma.user.findFirst({
    where: { email: 'juandavid@puntofino.com' }
  });

  if (!juanDavid) {
    console.error('Juan David not found!');
    process.exit(1);
  }

  if (alberto) {
    console.log(`Reassigning records from Alberto (${alberto.id}) to Juan David (${juanDavid.id})...`);
    await prisma.cashSession.updateMany({
      where: { openedByUserId: alberto.id },
      data: { openedByUserId: juanDavid.id }
    });
    await prisma.auditLog.updateMany({
      where: { userId: alberto.id },
      data: { userId: juanDavid.id }
    });
    await prisma.staffDeviceSession.deleteMany({
      where: { userId: alberto.id }
    });
    await prisma.panelNotification.deleteMany({
      where: { userId: alberto.id }
    });

    console.log('Deleting Alberto from User table...');
    await prisma.user.delete({
      where: { id: alberto.id }
    });
    console.log('Alberto deleted successfully!');
  } else {
    console.log('Alberto does not exist in DB.');
  }

  // Ensure Juan David has dual role ADMIN and barberProfile
  await prisma.user.update({
    where: { id: juanDavid.id },
    data: { role: 'ADMIN', isActive: true }
  });

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('Remaining Users in DB:', remainingUsers);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error removing Alberto:', err);
  process.exit(1);
});

