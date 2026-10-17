const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { OFFICIAL_SCHEDULES, OFFICIAL_PRODUCTS } = require('../config/businessConfig');

const prisma = new PrismaClient();

async function main() {
  console.log('💈 Iniciando siembra de datos maestros para Punto Fino — Ronda 2 (Villacolombia, Cali)...');

  // 1. Limpiar registros previos en orden seguro de llaves foráneas
  console.log('🧹 Limpiando registros antiguos...');
  await prisma.panelNotification.deleteMany({});
  await prisma.emailVerificationCode.deleteMany({});
  await prisma.contactMessage.deleteMany({});
  await prisma.emailAuditLog.deleteMany({});
  await prisma.slotHold.deleteMany({});
  await prisma.cashTransaction.deleteMany({});
  await prisma.cashSession.deleteMany({});
  await prisma.appointmentProduct.deleteMany({});
  await prisma.appointmentItem.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.barberAbsence.deleteMany({});
  await prisma.barberSchedule.deleteMany({});
  await prisma.commissionSettlement.deleteMany({});
  await prisma.barberProfile.deleteMany({});
  await prisma.clientProfile.deleteMany({});
  await prisma.habeasDataConsent.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.scheduleException.deleteMany({});
  await prisma.businessSchedule.deleteMany({});
  await prisma.staffDeviceSession.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Habilitar extensión btree_gist y constraints de exclusión en PostgreSQL (Neon)
  console.log('🛡️ Configurando constraints de exclusión btree_gist en PostgreSQL...');
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "no_overlapping_barber_appointments";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Appointment"
    ADD CONSTRAINT "no_overlapping_barber_appointments"
    EXCLUDE USING gist (
      "barberId" WITH =,
      tsrange("startTime", "endTime", '[)') WITH &&
    )
    WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW'));
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "no_overlapping_client_appointments";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Appointment"
    ADD CONSTRAINT "no_overlapping_client_appointments"
    EXCLUDE USING gist (
      "clientId" WITH =,
      tsrange("startTime", "endTime", '[)') WITH &&
    )
    WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW'));
  `);
  console.log('✅ Constraints anti-solapamiento (barbero y cliente) activos en Neon PostgreSQL.');

  // 3. Configurar ajustes de plataforma
  await prisma.platformSetting.upsert({
    where: { id: 'default' },
    update: {
      cancellationWindowHours: 3,
      minAdvanceMinutes: 30,
      bufferMinutes: 0,
      maxActiveBookingsPerClient: 2,
      allowClientProductAddOn: true,
      adminNotificationEmails: 'admin@puntofino.com',
      holidayNote: 'Los días festivos abrimos en jornada de domingo (9:00 a. m. a 4:00 p. m.).',
    },
    create: {
      id: 'default',
      cancellationWindowHours: 3,
      minAdvanceMinutes: 30,
      bufferMinutes: 0,
      maxActiveBookingsPerClient: 2,
      allowClientProductAddOn: true,
      adminNotificationEmails: 'admin@puntofino.com',
      holidayNote: 'Los días festivos abrimos en jornada de domingo (9:00 a. m. a 4:00 p. m.).',
    },
  });

  // 4. Sembrar los 7 Horarios Oficiales del Negocio
  console.log('🕒 Sembrando horarios oficiales de Punto Fino (7 días de la semana)...');
  for (const sched of OFFICIAL_SCHEDULES) {
    await prisma.businessSchedule.create({
      data: {
        dayOfWeek: sched.dayOfWeek,
        dayName: sched.dayName,
        openTime: sched.openTime,
        closeTime: sched.closeTime,
        isOpen: sched.isOpen,
      },
    });
  }

  const passwordHash = await bcrypt.hash('PuntoFino2026!', 10);
  const barberPasswordHash = await bcrypt.hash('Barbero2026!', 10);

  // 5. Crear los 3 Barberos Oficiales (Juan David: Fundador con Doble Rol Admin + Barbero)
  // - Juan David: Descansa miércoles (dayOfWeek = 3), rol ADMIN + BarberProfile (Fundador de Punto Fino)
  // - Emanuel Torres: Descansa lunes (dayOfWeek = 1), rol BARBER
  // - Juan Diego: Descansa martes (dayOfWeek = 2), rol BARBER
  console.log('✂️ Creando equipo oficial (Juan David como Administrador y Barbero)...');
  const juanDavidUser = await prisma.user.create({
    data: {
      email: 'juandavid@puntofino.com',
      name: 'Juan David',
      passwordHash: barberPasswordHash,
      role: 'ADMIN', // Rol dual: Administrador y Barbero
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'Juan David',
          bio: 'Fundador de Punto Fino, barbero y administrador. Especialista en corte clásico, degradados de precisión y cuidado integral.',
          weeklyRestDay: 3, // Miércoles
          commissionScheme: 'PERCENTAGE',
          commissionRate: 0.50,
          productCommissionRate: 0.15,
          sortOrder: 1,
        },
      },
    },
    include: { barberProfile: true },
  });

  const emanuelUser = await prisma.user.create({
    data: {
      email: 'emanuel@puntofino.com',
      name: 'Emanuel Torres',
      passwordHash: barberPasswordHash,
      role: 'BARBER',
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'Emanuel Torres',
          bio: 'Barbero profesional con maestría en corte, ritual de barba con toalla caliente y vapor de ozono.',
          weeklyRestDay: 1, // Lunes
          commissionScheme: 'PERCENTAGE',
          commissionRate: 0.50,
          productCommissionRate: 0.15,
          sortOrder: 2,
        },
      },
    },
    include: { barberProfile: true },
  });

  const juanDiegoUser = await prisma.user.create({
    data: {
      email: 'juandiego@puntofino.com',
      name: 'Juan Diego',
      passwordHash: barberPasswordHash,
      role: 'BARBER',
      isActive: true,
      barberProfile: {
        create: {
          nickname: 'Juan Diego',
          bio: 'Dedicado al oficio del corte masculino y la precisión a tijera y máquina.',
          weeklyRestDay: 2, // Martes
          commissionScheme: 'PERCENTAGE',
          commissionRate: 0.50,
          productCommissionRate: 0.15,
          sortOrder: 3,
        },
      },
    },
    include: { barberProfile: true },
  });

  // Crear horarios semanales para cada barbero respetando horarios oficiales y su día de descanso
  const barberProfiles = [
    juanDavidUser.barberProfile,
    emanuelUser.barberProfile,
    juanDiegoUser.barberProfile,
  ];

  for (const bp of barberProfiles) {
    for (const sched of OFFICIAL_SCHEDULES) {
      await prisma.barberSchedule.create({
        data: {
          barberId: bp.id,
          dayOfWeek: sched.dayOfWeek,
          startTime: sched.openTime,
          endTime: sched.closeTime,
          isWorking: sched.dayOfWeek !== bp.weeklyRestDay,
        },
      });
    }
  }

  // 7. Catálogo Oficial de Servicios (Un solo servicio por reserva)
  console.log('💈 Creando catálogo oficial de servicios...');
  const srvExpPF = await prisma.service.create({
    data: {
      name: 'Experiencia Punto Fino (Corte + Cejas)',
      slug: 'experiencia-punto-fino-corte-cejas',
      description: 'Degradado a navaja milimétrico, perfilado de cerquillo, diseño y limpieza de cejas con acabado profesional.',
      durationMinutes: 35,
      priceCOP: 24000,
      isPopular: true,
      badgeLabel: 'Popular',
      category: 'Cortes',
      sortOrder: 1,
    },
  });

  const srvExpPFBarba = await prisma.service.create({
    data: {
      name: 'Experiencia Punto Fino + Ritual de Barba',
      slug: 'experiencia-punto-fino-ritual-barba',
      description: 'Corte completo con perfilado de cerquillo y cejas, combinado con ritual de barba, toalla caliente y aceites.',
      durationMinutes: 45,
      priceCOP: 34000,
      isPopular: true,
      badgeLabel: 'Popular',
      category: 'Combos',
      sortOrder: 2,
    },
  });

  const srvPlatinium = await prisma.service.create({
    data: {
      name: 'Experiencia Platinium (VIP Todo Incluido)',
      slug: 'experiencia-platinium-vip',
      description: 'Servicio VIP integral: corte a tijera o degradado, ritual completo de barba, perfilado de cejas y exfoliación.',
      durationMinutes: 60,
      priceCOP: 55000,
      isPopular: false,
      badgeLabel: null,
      category: 'Combos',
      sortOrder: 3,
    },
  });

  const srvBarba = await prisma.service.create({
    data: {
      name: 'Ritual de Barba',
      slug: 'ritual-de-barba',
      description: 'Toalla caliente aromatizada, vapor de ozono, perfilado a navaja tradicional y bálsamo hidratante.',
      durationMinutes: 25,
      priceCOP: 12000,
      isPopular: false,
      badgeLabel: null,
      category: 'Barba',
      sortOrder: 4,
    },
  });

  const srvCejas = await prisma.service.create({
    data: {
      name: 'Cejas',
      slug: 'cejas-punto-fino',
      description: 'Limpieza, diseño milimétrico y perfilado con navaja fina para resaltar la mirada con precisión.',
      durationMinutes: 15,
      priceCOP: 5000,
      isPopular: false,
      badgeLabel: null,
      category: 'Faciales',
      sortOrder: 5,
    },
  });

  // 8. Catálogo Oficial de Productos ("Lo que usamos contigo": Rolda & Nevera)
  console.log('🧴 Sembrando los 8 productos oficiales (Rolda & Nevera)...');
  for (const prod of OFFICIAL_PRODUCTS) {
    await prisma.product.create({
      data: {
        name: prod.name,
        brand: prod.brand,
        category: prod.category,
        description: prod.description,
        priceCOP: prod.priceCOP,
        costCOP: prod.costCOP || 0,
        stock: prod.stock,
        minStock: prod.minStock,
        containsAlcohol: prod.containsAlcohol,
        imageUrl: prod.imageUrl,
        monogram: prod.monogram,
        isActive: prod.isActive,
      },
    });
  }

  // 9. Crear Clientes de Muestra (Cero teléfono — Identificados por correo)
  console.log('👥 Creando clientes frecuentes de Villacolombia...');
  const client1 = await prisma.user.create({
    data: {
      email: 'mateo.holguin@gmail.com',
      name: 'Mateo Holguín',
      role: 'CLIENT',
      clientProfile: {
        create: {
          preferredBarberId: juanDavidUser.barberProfile.id,
          loyaltyStamps: 4,
          totalVisits: 10,
          totalSpentCOP: 240000,
          technicalNotes: 'Degradado medio #0.5 en laterales, tijera arriba y cejas limpias a navaja.',
        },
      },
      consents: {
        create: {
          policyVersion: 'v2.0-2026-10',
          acceptedTerms: true,
          acceptedMarketing: true,
          ipAddress: '181.52.14.90',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        },
      },
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'jaime.vecino@puntofino.co',
      name: 'Jaime Valencia',
      role: 'CLIENT',
      clientProfile: {
        create: {
          preferredBarberId: emanuelUser.barberProfile.id,
          loyaltyStamps: 2,
          totalVisits: 8,
          totalSpentCOP: 272000,
          technicalNotes: 'Corte clásico a tijera y ritual de barba con toalla caliente.',
        },
      },
    },
  });

  // 10. Crear una cita completada hoy sin colisiones (1 solo servicio)
  const now = new Date();
  const pastStart = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const pastEnd = new Date(pastStart.getTime() + 35 * 60 * 1000);

  await prisma.appointment.create({
    data: {
      bookingCode: 'PF-1001',
      clientId: client1.id,
      barberId: juanDavidUser.barberProfile.id,
      serviceId: srvExpPF.id,
      startTime: pastStart,
      endTime: pastEnd,
      totalDurationMin: 35,
      totalPriceCOP: 24000,
      paymentMethod: 'NEQUI',
      status: 'COMPLETED',
      clientNotes: 'Mantener largo en la coronilla.',
      barberNotes: 'Se aplicó Rolda Aqua Wax al finalizar.',
      items: {
        create: [
          {
            serviceId: srvExpPF.id,
            priceCOP: 24000,
            durationMinutes: 35,
          },
        ],
      },
    },
  });

  console.log('✨ Siembra maestra Ronda 2 completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en la siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
