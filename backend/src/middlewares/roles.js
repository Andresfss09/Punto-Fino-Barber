exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado. Por favor inicia sesión.',
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const normalizedRoles = roles.map((r) => {
      const upper = r.toUpperCase();
      if (upper === 'BARBERO') return 'BARBER';
      if (upper === 'CLIENTE') return 'CLIENT';
      return upper;
    });

    if (!normalizedRoles.includes(userRole) && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: `El rol "${req.user.role}" no tiene permiso para esta acción.`,
      });
    }
    next();
  };
};