const prisma = require('./prisma');

const connectDB = async () => {
  try {
    // Verificar conexión ejecutando una query ligera
    await prisma.$queryRaw`SELECT 1 as connected`;
    console.log(`✅ Neon PostgreSQL conectado exitosamente con Prisma.`);
  } catch (error) {
    console.error(`❌ Error conectando a Neon PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;