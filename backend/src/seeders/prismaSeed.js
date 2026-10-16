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
  await prisma.barberService.deleteMany({});
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

  // 1. Crear Super Administrador
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

  // 2. Crear Barberos del Equipo Real de Punto Fino
  console.log('✂️ Creando equipo de barberos...');
  const brayanUser = await prisma.user.create({
    data: {
      email: 'brayan@puntofino.com',
      phone: '+573158294012',
      name: 'Brayan Murillo',
      passwordHash: barberPasswordHash,
      role: 'BARBER',
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'El Fino',
          bio: 'Especialista en degradados milimétricos (skin fade, taper) y diseño de líneas finas.',
          avatarUrl: '/images/punto-fino/ritual-vapor-ozono.png',
          commissionRate: 0.50,
          sortOrder: 1,
        },
      },
    },
    include: { barberProfile: true },
  });

  const carlosUser = await prisma.user.create({
    data: {
      email: 'carlos@puntofino.com',
      phone: '+573167489201',
      name: 'Carlos Valencia',
      passwordHash: barberPasswordHash,
      role: 'BARBER',
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'El Primo',
          bio: 'Maestro en arreglo de barba con toalla caliente, navaja japonesa y vapor de ozono.',
          avatarUrl: '/images/punto-fino/vapor-facial-cali.png',
          commissionRate: 0.50,
          sortOrder: 2,
        },
      },
    },
    include: { barberProfile: true },
  });

  const andresUser = await prisma.user.create({
    data: {
      email: 'andres@puntofino.com',
      phone: '+573189204712',
      name: 'Andrés Mosquera',
      passwordHash: barberPasswordHash,
      role: 'BARBER',
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'Junior',
          bio: 'Cortes clásicos a tijera, texturizado y tratamientos capilares revitalizantes.',
          avatarUrl: '/images/punto-fino/masaje-percutivo-relax.png',
          commissionRate: 0.50,
          sortOrder: 3,
        },
      },
    },
    include: { barberProfile: true },
  });

  const barbers = [brayanUser.barberProfile, carlosUser.barberProfile, andresUser.barberProfile];

  // 3. Crear Horarios de Atención para cada Barbero (Lunes a Domingo)
  console.log('⏰ Asignando horarios de atención...');
  for (const b of barbers) {
    for (let day = 0; day <= 6; day++) {
      await prisma.barberSchedule.create({
        data: {
          barberId: b.id,
          dayOfWeek: day,
          startTime: day === 0 ? '10:00' : '09:00', // Domingo abre a las 10:00 AM
          endTime: day === 0 ? '17:00' : '20:00',   // Domingo cierra a las 05:00 PM
          isWorking: true,
        },
      });
    }
  }

  // 4. Crear Catálogo de Servicios en Pesos Colombianos (COP)
  console.log('📋 Creando catálogo de servicios...');
  const s1 = await prisma.service.create({
    data: {
      name: 'Corte Clásico Punto Fino',
      slug: 'corte-clasico-punto-fino',
      description: 'Degradado a navaja, perfilado de cerquillo con precisión, lavado capilar y peinado.',
      durationMinutes: 40,
      priceCOP: 25000,
      category: 'Cortes',
      sortOrder: 1,
    },
  });

  const s2 = await prisma.service.create({
    data: {
      name: 'Ritual Barba con Vapor de Ozono',
      slug: 'ritual-barba-vapor-ozono',
      description: 'Toalla caliente aromatizada, exfoliación, perfilado a navaja y aceite artesanal.',
      durationMinutes: 35,
      priceCOP: 22000,
      category: 'Barba',
      sortOrder: 2,
    },
  });

  const s3 = await prisma.service.create({
    data: {
      name: 'Combo Completo: Corte + Barba + Masaje',
      slug: 'combo-completo-corte-barba-masaje',
      description: 'Experiencia total: degradado, ritual de barba vaporizada, exfoliación facial y masaje percutor.',
      durationMinutes: 70,
      priceCOP: 45000,
      category: 'Combos',
      sortOrder: 3,
    },
  });

  const s4 = await prisma.service.create({
    data: {
      name: 'Exfoliación & Masaje Percutivo',
      slug: 'exfoliacion-masaje-percutivo',
      description: 'Limpieza de poros con vaporizador, mascarilla facial dorada y masaje relajante en sienes.',
      durationMinutes: 25,
      priceCOP: 20000,
      category: 'Faciales',
      sortOrder: 4,
    },
  });

  const s5 = await prisma.service.create({
    data: {
      name: 'Perfilado de Cejas y Barba con Navaja',
      slug: 'perfilado-cejas-barba-navaja',
      description: 'Alineación milimétrica con cuchilla esterilizada descartable e hidratación post-afeitado.',
      durationMinutes: 20,
      priceCOP: 15000,
      category: 'Barba',
      sortOrder: 5,
    },
  });

  const allServices = [s1, s2, s3, s4, s5];

  // Asociar todos los servicios a cada barbero
  for (const b of barbers) {
    for (const s of allServices) {
      await prisma.barberService.create({
        data: {
          barberId: b.id,
          serviceId: s.id,
        },
      });
    }
  }

  // 5. Crear Productos de Barbería (Mini-POS)
  console.log('🧴 Creando inventario de productos...');
  await prisma.product.createMany({
    data: [
      { name: 'Pomada Fijación Fuerte Mate', brand: 'Bandido Colombia', priceCOP: 35000, costCOP: 20000, stock: 14, minStock: 5 },
      { name: 'Aceite Hidratante para Barba 30ml', brand: 'Punto Fino Lab', priceCOP: 28000, costCOP: 14000, stock: 8, minStock: 4 },
      { name: 'Cuchillas Derby Premium (Caja x100)', brand: 'Derby Extra', priceCOP: 45000, costCOP: 30000, stock: 12, minStock: 20 },
      { name: 'Shampoo Mentolado Anticaspa 250ml', brand: 'Barber Lab', priceCOP: 32000, costCOP: 18000, stock: 6, minStock: 3 },
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
          preferredBarberId: brayanUser.barberProfile.id,
          loyaltyStamps: 3,
          totalVisits: 3,
          totalSpentCOP: 95000,
          technicalNotes: 'Degradado medio a navaja #0.5, cerquillo recto, piel sensible en cuello.',
        },
      },
      consents: {
        create: {
          policyVersion: 'v1.0-2026-10',
          acceptedTerms: true,
          acceptedMarketing: true,
          ipAddress: '186.84.90.12', // IP residencial de Cali
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
        },
      },
    },
    include: { clientProfile: true },
  });

  // 7. Crear Cita de Demostración
  console.log('📅 Creando cita de demostración...');
  const aptStartTime = new Date();
  aptStartTime.setHours(15, 30, 0, 0); // 03:30 PM de hoy
  const aptEndTime = new Date(aptStartTime.getTime() + 70 * 60 * 1000); // 70 min después

  const sampleApt = await prisma.appointment.create({
    data: {
      bookingCode: 'PF-8492',
      clientId: clientUser.id,
      barberId: brayanUser.barberProfile.id,
      startTime: aptStartTime,
      endTime: aptEndTime,
      totalDurationMin: 70,
      totalPriceCOP: 45000,
      status: 'CONFIRMED',
      clientNotes: 'Llevo foto para el degradado en sienes.',
      barberNotes: 'Cliente recurrente de los viernes.',
      actionToken: 'sec_tok_hmac_8492_cali',
      actionTokenExpiry: new Date(Date.now() + 48 * 3600 * 1000),
      items: {
        create: [
          { serviceId: s1.id, priceCOP: 25000, durationMinutes: 40 },
          { serviceId: s2.id, priceCOP: 20000, durationMinutes: 30 },
        ],
      },
      emailLogs: {
        create: [
          {
            recipientType: 'CLIENT',
            toEmail: clientUser.email,
            subject: 'Tu cita en Punto Fino está confirmada — [PF-8492]',
            status: 'DELIVERED',
            providerId: 'resend_msg_8492_demo',
          },
        ],
      },
    },
  });

  console.log('✅ Siembra de datos completada exitosamente en Neon PostgreSQL.');
  console.log(`📊 Credenciales de acceso creadas:`);
  console.log(`   - Admin:   admin@puntofino.com / PuntoFino2026!`);
  console.log(`   - Barbero: brayan@puntofino.com / Barbero2026!`);
  console.log(`   - Cita de prueba: ${sampleApt.bookingCode} (${sampleApt.totalPriceCOP} COP)`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeder de Prisma:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
