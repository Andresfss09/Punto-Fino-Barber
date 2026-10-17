const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Obtener opiniones y reseñas reales de clientes
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const reviews = await prisma.customerReview.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const count = reviews.length;
    const averageRating = count > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
      : 5.0;

    return sendSuccess(res, 200, 'Opiniones obtenidas exitosamente.', {
      reviews,
      count,
      averageRating,
    });
  } catch (error) {
    console.error('Error en getReviews:', error);
    return sendError(res, 500, 'Error al obtener opiniones.', error.message);
  }
};

// @desc    Publicar nueva opinión de cliente con nombre, correo, estrellas y comentario
// @route   POST /api/reviews
// @access  Public
exports.createReview = async (req, res) => {
  try {
    const { name, email, rating, comment, serviceName, barberName } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 400, 'Por favor ingresa tu nombre completo.');
    }

    if (!email || !email.trim()) {
      return sendError(res, 400, 'Por favor ingresa tu correo electrónico.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return sendError(res, 400, 'El formato de correo electrónico no es válido.');
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return sendError(res, 400, 'La calificación debe ser entre 1 y 5 estrellas.');
    }

    if (!comment || !comment.trim() || comment.trim().length < 5) {
      return sendError(res, 400, 'Por favor escribe un comentario de al menos 5 caracteres.');
    }

    const newReview = await prisma.customerReview.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rating: numRating,
        comment: comment.trim(),
        serviceName: serviceName?.trim() || null,
        barberName: barberName?.trim() || null,
        isApproved: true,
      },
    });

    // Calcular nuevas estadísticas
    const allReviews = await prisma.customerReview.findMany({
      where: { isApproved: true },
    });
    const count = allReviews.length;
    const averageRating = Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1));

    return sendSuccess(res, 201, '¡Gracias por tu opinión! Tu comentario ha sido publicado.', {
      review: newReview,
      count,
      averageRating,
    });
  } catch (error) {
    console.error('Error en createReview:', error);
    return sendError(res, 500, 'Error al publicar la opinión.', error.message);
  }
};