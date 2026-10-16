const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Middleware para proteger rutas autenticadas (Barberos, Administradores, Recepción)
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Por favor iniciá sesión con tus credenciales de Punto Fino.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        barberProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado en la base de datos.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada por la administración.',
      });
    }

    // Excluimos passwordHash de la request
    const { passwordHash, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso inválido o expirado.',
      error: error.message,
    });
  }
};

// Middleware de Control de Acceso Basado en Roles (RBAC)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: El rol '${req.user?.role || 'INVITADO'}' no tiene permisos para esta acción.`,
      });
    }
    next();
  };
};

// Middleware para rutas públicas que pueden enriquecerse si el usuario envía token
exports.protectOptional = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { barberProfile: true },
      });
      if (user && user.isActive) {
        const { passwordHash, ...userClean } = user;
        req.user = userClean;
      }
    }
  } catch (error) {
    // Continúa como invitado anónimo
  }
  next();
};