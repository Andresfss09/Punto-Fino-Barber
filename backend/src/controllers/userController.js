const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Obtener todos los usuarios (Staff/Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    const where = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        clientProfile: true,
        barberProfile: true,
      },
    });

    return sendSuccess(res, 200, 'Usuarios obtenidos.', {
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al obtener usuarios.');
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        clientProfile: true,
        barberProfile: true,
      },
    });

    if (!user) return sendError(res, 404, 'Usuario no encontrado.');
    return sendSuccess(res, 200, 'Usuario obtenido.', { user });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al obtener usuario.');
  }
};

// @desc    Actualizar usuario (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { role, isActive, name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role ? { role } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(name ? { name } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return sendSuccess(res, 200, 'Usuario actualizado.', { user });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al actualizar usuario.');
  }
};

// @desc    Desactivar usuario (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: { id: true, name: true, isActive: true },
    });

    return sendSuccess(res, 200, 'Usuario desactivado exitosamente.', { user });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al desactivar usuario.');
  }
};

// @desc    Consultar ficha y notas técnicas privadas del cliente (Fórmula de corte del barbero)
// @route   GET /api/users/:id/technical-notes
// @access  Private (Staff)
exports.getTechnicalNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const clientProfile = await prisma.clientProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!clientProfile) {
      return sendError(res, 404, 'Ficha del cliente no encontrada.');
    }

    return sendSuccess(res, 200, 'Ficha técnica del cliente.', {
      client: clientProfile.user,
      technicalNotes: clientProfile.technicalNotes || 'Sin notas previas.',
      loyaltyStamps: clientProfile.loyaltyStamps,
      totalVisits: clientProfile.totalVisits,
      totalSpentCOP: clientProfile.totalSpentCOP,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al consultar notas técnicas.');
  }
};

// @desc    Actualizar ficha y notas técnicas privadas del cliente
// @route   PUT /api/users/:id/technical-notes
// @access  Private (Staff)
exports.updateTechnicalNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicalNotes } = req.body;

    const profile = await prisma.clientProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
    });

    if (!profile) {
      return sendError(res, 404, 'Ficha de cliente no encontrada.');
    }

    const updated = await prisma.clientProfile.update({
      where: { id: profile.id },
      data: { technicalNotes },
    });

    return sendSuccess(res, 200, 'Fórmula y notas de corte guardadas.', {
      technicalNotes: updated.technicalNotes,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al actualizar notas técnicas.');
  }
};
