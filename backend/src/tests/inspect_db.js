const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'User';
  `;
  console.log('User columns:', userCols);

  const clientProfileCols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ClientProfile';
  `;
  console.log('ClientProfile columns:', clientProfileCols);

  const apptCols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Appointment';
  `;
  console.log('Appointment columns:', apptCols);

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('All Users:', allUsers);

  await prisma.$disconnect();
}

main().catch(console.error);

