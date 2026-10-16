const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateToken, generateRandomToken, sendSuccess, sendError } = require('../utils/helpers');

// @desc    Iniciar sesión (Personal de Barbería & Administrador)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, deviceId, deviceName } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Por favor ingresá tu correo y contraseña.');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        barberProfile: true,
      },
    });

    if (!user || !user.passwordHash) {
      return sendError(res, 401, 'Credenciales inválidas. Verificá tu correo o contraseña.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Tu cuenta ha sido desactivada por la administración.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'Credenciales inválidas. Verificá tu correo o contraseña.');
    }

    // Generar Token JWT
    const token = generateToken(user.id);

    // Registro de sesión en dispositivo móvil si se envía deviceId
    if (deviceId) {
      const refreshToken = generateRandomToken();
      await prisma.staffDeviceSession.upsert({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId,
          },
        },
        update: {
          refreshTokenHash: await bcrypt.hash(refreshToken, 8),
          lastActiveAt: new Date(),
          isRevoked: false,
        },
        create: {
          userId: user.id,
          deviceId,
          deviceName: deviceName || 'Dispositivo Móvil',
          refreshTokenHash: await bcrypt.hash(refreshToken, 8),
        },
      });
    }

    return sendSuccess(res, 200, `¡Bienvenido de vuelta, ${user.name}!`, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        barberProfile: user.barberProfile ? {
          id: user.barberProfile.id,
          nickname: user.barberProfile.nickname,
          avatarUrl: user.barberProfile.avatarUrl,
          commissionRate: Number(user.barberProfile.commissionRate),
        } : null,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return sendError(res, 500, 'Error en el servidor al autenticar.');
  }
};

// @desc    Obtener usuario actual autenticado
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        barberProfile: true,
        clientProfile: true,
      },
    });

    if (!user) {
      return sendError(res, 404, 'Usuario no encontrado.');
    }

    const { passwordHash, ...cleanUser } = user;
    return sendSuccess(res, 200, 'Perfil cargado exitosamente.', { user: cleanUser });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al consultar el perfil.');
  }
};

// @desc    Registro de nuevo barbero o personal (Admin)
// @route   POST /api/auth/register-staff
// @access  Private (Admin)
exports.registerStaff = async (req, res) => {
  try {
    const { name, email, phone, password, role, nickname, commissionRate } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { phone }] },
    });

    if (existing) {
      return sendError(res, 400, 'Ya existe un usuario con este correo o teléfono.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash,
        role: role || 'BARBER',
        isActive: true,
        ...(role === 'BARBER' ? {
          barberProfile: {
            create: {
              nickname: nickname || name.split(' ')[0],
              commissionRate: commissionRate ? parseFloat(commissionRate) : 0.50,
            },
          },
        } : {}),
      },
      include: { barberProfile: true },
    });

    const { passwordHash: _, ...cleanUser } = newUser;
    return sendSuccess(res, 201, 'Miembro del equipo registrado exitosamente.', { user: cleanUser });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al registrar al usuario.');
  }
};

// @desc    Cerrar sesión y revocar sesión de dispositivo
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (deviceId && req.user) {
      await prisma.staffDeviceSession.updateMany({
        where: { userId: req.user.id, deviceId },
        data: { isRevoked: true },
      });
    }
    return sendSuccess(res, 200, 'Sesión cerrada correctamente.');
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al cerrar sesión.');
  }
};