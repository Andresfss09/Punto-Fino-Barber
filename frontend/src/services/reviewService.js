import api from './api';

export const reviewService = {
  getAll: async () => {
    const response = await api.get('/reviews');
    return response;
  },
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response;
  },
  getBarberReviews: async (barberId) => {
    const response = await api.get(`/reviews/barber/${barberId}`);
    return response;
  }
};
