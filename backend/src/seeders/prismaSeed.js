const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('💈 Iniciando siembra de datos maestros para Punto Fino (Cali, Colombia)...');

  // Limpiar datos previos si existen (orden respetando llaves foráneas)
  console.log('🧹 Limpiando registros antiguos...');
  await prisma.emailAuditLog.deleteMany({});
  await prisma.slotHold.deleteMany({});
  await prisma.cashTransaction.deleteMany({});
  await prisma.cashSession.deleteMany({});
  await prisma.appointmentItem.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.barberAbsence.deleteMany({});
  await prisma.barberSchedule.deleteMany({});
  await prisma.barberProfile.deleteMany({});
  await prisma.clientProfile.deleteMany({});
  await prisma.habeasDataConsent.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('PuntoFino2026!', 10);
  const barberPasswordHash = await bcrypt.hash('Barbero2026!', 10);

  // 1. Crear Administrador General
  console.log('👤 Creando usuario Administrador...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@puntofino.com',
      phone: '+573001234567',
      name: 'Alberto Cardona',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 2. Crear los 3 Barberos Reales de Punto Fino (Sin fotos de perfil)
  // Juan David: Barbero y Admin
  console.log('✂️ Creando equipo de 3 barberos de Punto Fino...');
  const juanDavidUser = await prisma.user.create({
    data: {
      email: 'juandavid@puntofino.com',
      phone: '+573158294012',
      name: 'Juan David',
      passwordHash: barberPasswordHash,
      role: 'ADMIN', // Barbero y Admin
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'Juan David "El Fino"',
          bio: 'Fundador de Punto Fino, barbero y administrador. Especialista en corte clásico, degradados de precisión y gestión integral.',
          commissionRate: 0.50,
          sortOrder: 1,
        },
      },
    },
    include: { barberProfile: true },
  });

  // Emanuel Torres: Barbero
  const emanuelUser = await prisma.user.create({
    data: {
      email: 'emanuel@puntofino.com',
      phone: '+573167489201',
      name: 'Emanuel Torres',
      passwordHash: barberPasswordHash,
      role: 'BARBER',
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'Emanuel Torres "El Primo"',
          bio: 'Barbero profesional con maestría en corte, ritual de barba con toalla caliente y vapor de ozono.',
          commissionRate: 0.50,
          sortOrder: 2,
        },
      },
    },
    include: { barberProfile: true },
  });

  // Juan Diego: Barbero
  const juanDiegoUser = await prisma.user.create({
    data: {
      email: 'juandiego@puntofino.com',
      phone: '+573189204712',
      name: 'Juan Diego',
      passwordHash: barberPasswordHash,
      role: 'BARBER',
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'Juan Diego "Junior"',
          bio: 'Barbero máster con amplia trayectoria en cortes a tijera, perfilado milimétrico y asesoría de estilo.',
          commissionRate: 0.50,
          sortOrder: 3,
        },
      },
    },
    include: { barberProfile: true },
  });

  // Usuario alias para compatibilidad retroactiva con test suites anteriores
  await prisma.user.create({
    data: {
      email: 'brayan@puntofino.com',
      phone: '+573159990000',
      name: 'Juan David (Alias Móvil)',
      passwordHash: barberPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const barbers = [juanDavidUser.barberProfile, emanuelUser.barberProfile, juanDiegoUser.barberProfile];

  // 3. Crear Horarios de Atención para cada Barbero (Lunes a Domingo)
  console.log('⏰ Asignando horarios de atención...');
  for (const b of barbers) {
    for (let day = 0; day <= 6; day++) {
      await prisma.barberSchedule.create({
        data: {
          barberId: b.id,
          dayOfWeek: day,
          startTime: day === 0 ? '09:00' : '09:00', // Domingo 09:00 AM
          endTime: day === 0 ? '16:00' : '20:30',   // Domingo cierra 04:00 PM, Mar-Sáb 08:30 PM
          isWorking: day !== 1, // Lunes descanso
        },
      });
    }
  }

  // 4. Crear Catálogo Oficial de Servicios de Punto Fino
  // Todos los barberos ofrecen todos los servicios sin distinción ni especialidades
  console.log('📋 Creando catálogo oficial de servicios en COP...');
  const s1 = await prisma.service.create({
    data: {
      name: 'Experiencia Punto Fino (Corte Clásico + Cejas)',
      slug: 'experiencia-punto-fino',
      description: 'Descubre nuestro servicio de Corte y Ceja, una experiencia de 35 min con degradado a navaja y cerquillo limpio.',
      durationMinutes: 35,
      priceCOP: 24000,
      category: 'Cortes',
      sortOrder: 1,
    },
  });

  const s2 = await prisma.service.create({
    data: {
      name: 'Experiencia Punto Fino + Ritual de Barba',
      slug: 'experiencia-punto-fino-ritual-barba',
      description: 'EXPERIENCIA FINO + RITUAL DE BARBA. Corte de cabello, alineación de cejas y ritual completo de barba con toalla al vapor.',
      durationMinutes: 45,
      priceCOP: 34000,
      category: 'Combos',
      sortOrder: 2,
    },
  });

  const s3 = await prisma.service.create({
    data: {
      name: 'Experiencia Platinium',
      slug: 'experiencia-platinium',
      description: 'Experiencia total de lujo: corte personalizado, cejas, ritual completo de barba con vapor de ozono, exfoliación y mascarilla facial.',
      durationMinutes: 60,
      priceCOP: 55000,
      category: 'Combos',
      sortOrder: 3,
    },
  });

  const s4 = await prisma.service.create({
    data: {
      name: 'Ritual de Barba',
      slug: 'ritual-de-barba',
      description: 'RITUAL DE BARBA con toalla caliente, aceite hidratante artesanal y perfilado a navaja de un solo filo.',
      durationMinutes: 25,
      priceCOP: 12000,
      category: 'Barba',
      sortOrder: 4,
    },
  });

  const s5 = await prisma.service.create({
    data: {
      name: 'Cejas',
      slug: 'cejas',
      description: 'Alineación y limpieza milimétrica de cejas con cuchilla descartable esterilizada.',
      durationMinutes: 15,
      priceCOP: 5000,
      category: 'Faciales',
      sortOrder: 5,
    },
  });

  // 5. Crear Productos Oficiales de Barbería
  console.log('🧴 Creando inventario de productos oficiales...');
  await prisma.product.createMany({
    data: [
      { name: 'Rolda Gel Black', brand: 'Rolda', priceCOP: 25000, costCOP: 15000, stock: 16, minStock: 5 },
      { name: 'Rolda Curl Crem', brand: 'Rolda', priceCOP: 36000, costCOP: 22000, stock: 12, minStock: 4 },
      { name: 'Rolda Spiderwax', brand: 'Rolda', priceCOP: 34000, costCOP: 20000, stock: 14, minStock: 4 },
      { name: 'Rolda Aqua Wax', brand: 'Rolda', priceCOP: 34000, costCOP: 20000, stock: 18, minStock: 4 },
      { name: 'Rolda Gel Wax', brand: 'Rolda', priceCOP: 34000, costCOP: 20000, stock: 15, minStock: 4 },
      { name: 'Jugo Hit', brand: 'Postobón', priceCOP: 5000, costCOP: 2500, stock: 24, minStock: 8 },
      { name: 'Cerveza Águila Latón', brand: 'Bavaria', priceCOP: 6000, costCOP: 3200, stock: 20, minStock: 6 },
      { name: 'Agua', brand: 'Cristal', priceCOP: 3000, costCOP: 1200, stock: 30, minStock: 10 },
    ],
  });

  // 6. Crear Cliente de Prueba con Habeas Data en Regla (Ley 1581)
  console.log('👥 Creando cliente y consentimiento de Habeas Data...');
  const clientUser = await prisma.user.create({
    data: {
      email: 'mateo.holguin@gmail.com',
      phone: '+573157894210',
      name: 'Mateo Holguín',
      role: 'CLIENT',
      isActive: true,
      clientProfile: {
        create: {
          loyaltyStamps: 4,
          totalVisits: 5,
          totalSpentCOP: 185000,
          technicalNotes: 'Fade #0.5 en sienes con transición suave a tijera arriba. Cerquillo recto a navaja.',
        },
      },
      consents: {
        create: {
          policyVersion: 'v1.0-2026-10',
          acceptedTerms: true,
          acceptedMarketing: true,
          ipAddress: '186.84.92.110', // IP residencial Cali
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
        },
      },
    },
    include: { clientProfile: true },
  });

  // 7. Abrir sesión inicial de caja
  console.log('💵 Creando sesión inicial de caja diaria...');
  await prisma.cashSession.create({
    data: {
      openedByUserId: adminUser.id,
      openingBalance: 100000,
      notes: 'Apertura de turno matutino Punto Fino Villacolombia',
    },
  });

  console.log('\n========================================================');
  console.log('✨ SIEMBRA DE DATOS OFICIALES DE PUNTO FINO EXITOSA ✨');
  console.log('========================================================');
  console.log('👤 Administrador: admin@puntofino.com / PuntoFino2026!');
  console.log('✂️ 3 Barberos Reales:');
  console.log('   1. Juan David (Barbero & Admin) - juandavid@puntofino.com (Rating 4.9)');
  console.log('   2. Emanuel Torres (Barbero) - emanuel@puntofino.com (Rating 4.9)');
  console.log('   3. Juan Diego (Barbero) - juandiego@puntofino.com (Rating 5.0)');
  console.log('📋 5 Servicios Oficiales:');
  console.log('   - Experiencia Punto Fino (Corte + Cejas): $ 24.000 COP (35 min)');
  console.log('   - Experiencia Punto Fino + Ritual de Barba: $ 34.000 COP (45 min)');
  console.log('   - Experiencia Platinium: $ 55.000 COP (60 min)');
  console.log('   - Ritual de Barba: $ 12.000 COP (25 min)');
  console.log('   - Cejas: $ 5.000 COP (15 min)');
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
