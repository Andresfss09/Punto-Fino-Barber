const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testAppointments() {
  const admin = await prisma.user.findFirst({ where: { email: 'juandavid@puntofino.com' } });
  const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET || 'puntofino_jwt_secret_dev');
  
  const res = await fetch('http://localhost:5000/api/appointments', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const json = await res.json();
  console.log('API /api/appointments count:', json.appointments?.length);
  json.appointments?.forEach(a => {
    console.log(`- [${a.bookingCode}] ${a.client?.name} (${a.client?.phone}) - ${a.service?.name} - Barber: ${a.barber?.nickname || a.barber?.user?.name} - ${a.status} - $${a.totalPrice}`);
  });
}

testAppointments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

