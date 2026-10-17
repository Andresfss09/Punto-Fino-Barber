const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const serviceCols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Service';
  `;
  console.log('Service columns:', serviceCols);
  await prisma.$disconnect();
}

main().catch(console.error);

