const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alberto = await prisma.user.findFirst({
    where: { email: 'admin@puntofino.com' },
    include: {
      barberProfile: true,
      clientProfile: true,
      cashSessions: true,
      appointments: true,
      consents: true,
      deviceSessions: true,
      auditLogs: true
    }
  });
  console.log('Alberto references:', {
    barberProfile: alberto?.barberProfile?.id,
    clientProfile: alberto?.clientProfile?.id,
    cashSessions: alberto?.cashSessions?.length,
    appointments: alberto?.appointments?.length,
    consents: alberto?.consents?.length,
    deviceSessions: alberto?.deviceSessions?.length,
    auditLogs: alberto?.auditLogs?.length
  });

  const juanDavid = await prisma.user.findFirst({
    where: { email: 'juandavid@puntofino.com' },
    include: { barberProfile: true }
  });
  console.log('Juan David:', {
    id: juanDavid?.id,
    name: juanDavid?.name,
    role: juanDavid?.role,
    barberProfileId: juanDavid?.barberProfile?.id
  });

  await prisma.$disconnect();
}

main().catch(console.error);

