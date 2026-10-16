const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Obtener todos los servicios activos (Público)
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) {
      where.category = category;
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        barbers: {
          include: {
            barber: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return sendSuccess(res, 200, 'Servicios obtenidos exitosamente.', {
      count: services.length,
      services,
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return sendError(res, 500, 'Error al consultar el catálogo de servicios.');
  }
};

// @desc    Obtener servicio por slug
// @route   GET /api/services/:slug
// @access  Public
exports.getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        barbers: {
          include: {
            barber: true,
          },
        },
      },
    });

    if (!service || !service.isActive) {
      return sendError(res, 404, 'Servicio no encontrado.');
    }

    return sendSuccess(res, 200, 'Servicio encontrado.', { service });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al consultar el servicio.');
  }
};

// @desc    Crear nuevo servicio (Admin)
// @route   POST /api/services
// @access  Private (Admin)
exports.createService = async (req, res) => {
  try {
    const { name, slug, description, durationMinutes, priceCOP, category, requiresDeposit, depositAmountCOP } = req.body;

    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      return sendError(res, 400, 'Ya existe un servicio con ese slug/identificador.');
    }

    const service = await prisma.service.create({
      data: {
        name,
        slug,
        description,
        durationMinutes: parseInt(durationMinutes, 10),
        priceCOP: parseInt(priceCOP, 10),
        category: category || 'Cortes',
        requiresDeposit: Boolean(requiresDeposit),
        depositAmountCOP: depositAmountCOP ? parseInt(depositAmountCOP, 10) : 0,
      },
    });

    return sendSuccess(res, 201, 'Servicio creado exitosamente en el catálogo.', { service });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return sendError(res, 500, 'Error al registrar el nuevo servicio.');
  }
};

// @desc    Actualizar servicio existente (Admin)
// @route   PUT /api/services/:id
// @access  Private (Admin)
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.durationMinutes) data.durationMinutes = parseInt(data.durationMinutes, 10);
    if (data.priceCOP) data.priceCOP = parseInt(data.priceCOP, 10);

    const service = await prisma.service.update({
      where: { id },
      data,
    });

    return sendSuccess(res, 200, 'Servicio actualizado.', { service });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al actualizar el servicio.');
  }
};

// @desc    Desactivar servicio (Soft Delete) (Admin)
// @route   DELETE /api/services/:id
// @access  Private (Admin)
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return sendSuccess(res, 200, 'Servicio desactivado del catálogo.');
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al desactivar el servicio.');
  }
};