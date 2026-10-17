require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const Barber = require('../models/Barber');

const seedUsers = async () => {
  try {
    await connectDB();

    // 1. Admin & Barbero: Juan David
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@puntofino.co';
    let admin = await User.findOne({ email: { $in: [adminEmail, 'juandavid@puntofino.co'] } });
    if (!admin) {
      admin = await User.create({
        name: 'Juan David',
        email: adminEmail,
        password: 'admin123456',
        role: 'admin',
        isVerified: true,
      });
      console.log(`✅ Admin Juan David creado: ${adminEmail} / admin123456`);
    }

    // 2. Barbero 1: Juan David
    const barber1Email = 'juandavid@puntofino.co';
    let barberUser1 = await User.findOne({ email: barber1Email });
    if (!barberUser1) {
      barberUser1 = await User.create({
        name: 'Juan David',
        email: barber1Email,
        password: 'barbero123',
        role: 'barbero',
        isVerified: true,
      });
      await Barber.create({
        user: barberUser1._id,
        bio: 'Barbero y Administrador de Punto Fino. Todos los servicios del catálogo con el mismo estándar.',
        isAvailable: true,
      });
      console.log('✅ Barbero Juan David creado: juandavid@puntofino.co / barbero123');
    }

    // 3. Barbero 2: Emanuel Torres
    const barber2Email = 'emanuel@puntofino.co';
    let barberUser2 = await User.findOne({ email: barber2Email });
    if (!barberUser2) {
      barberUser2 = await User.create({
        name: 'Emanuel Torres',
        email: barber2Email,
        password: 'barbero123',
        role: 'barbero',
        isVerified: true,
      });
      await Barber.create({
        user: barberUser2._id,
        bio: 'Barbero de Punto Fino. Todos los servicios del catálogo con el mismo estándar.',
        isAvailable: true,
      });
      console.log('✅ Barbero Emanuel Torres creado: emanuel@puntofino.co / barbero123');
    }

    // 4. Barbero 3: Juan Diego
    const barber3Email = 'juandiego@puntofino.co';
    let barberUser3 = await User.findOne({ email: barber3Email });
    if (!barberUser3) {
      barberUser3 = await User.create({
        name: 'Juan Diego',
        email: barber3Email,
        password: 'barbero123',
        role: 'barbero',
        isVerified: true,
      });
      await Barber.create({
        user: barberUser3._id,
        bio: 'Barbero de Punto Fino. Todos los servicios del catálogo con el mismo estándar.',
        isAvailable: true,
      });
      console.log('✅ Barbero Juan Diego creado: juandiego@puntofino.co / barbero123');
    }

    // 5. Cliente Punto Fino
    const clientEmail = 'cliente@puntofino.co';
    let client = await User.findOne({ email: clientEmail });
    if (!client) {
      client = await User.create({
        name: 'Carlos Alberto Gómez',
        email: clientEmail,
        password: 'cliente123',
        role: 'cliente',
        isVerified: true,
        loyaltyPoints: 100,
      });
      console.log('✅ Cliente creado: cliente@puntofino.co / cliente123');
    }

    console.log('🎉 Seed de usuarios de Punto Fino finalizado con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seedUsers:', error.message);
    process.exit(1);
  }
};

seedUsers();
