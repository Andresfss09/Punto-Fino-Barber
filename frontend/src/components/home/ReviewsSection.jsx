import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, MessageSquarePlus, Sparkles, Send, User, Mail, Scissors } from 'lucide-react';
import Modal from '../ui/Modal';
import { reviewService } from '../../services/reviewService';
import toast from 'react-hot-toast';

const RATING_LABELS = {
  1: 'A mejorar',
  2: 'Regular',
  3: 'Bueno',
  4: 'Muy bueno',
  5: 'Excelente · 100% Recomendado',
};

const SERVICES_OPTIONS = [
  'Experiencia Punto Fino (Corte + Cejas)',
  'Experiencia Platinium (VIP Todo Incluido)',
  'Corte de Cabello + Arreglo de Barba',
  'Ritual de Barba a Navaja',
  'Perfilado y Limpieza de Cejas',
  'Otro Servicio',
];

const BARBERS_OPTIONS = [
  'Emanuel Torres',
  'Juan Diego',
  'Juan David (Admin)',
  'Cualquiera del equipo',
];

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, averageRating: 5.0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
    serviceName: 'Experiencia Punto Fino (Corte + Cejas)',
    barberName: 'Juan Diego',
  });
  const [hoverRating, setHoverRating] = useState(0);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewService.getAll();
      const list = res?.reviews || res?.data?.reviews || [];
      const count = res?.count ?? res?.data?.count ?? list.length;
      const averageRating = res?.averageRating ?? res?.data?.averageRating ?? 5.0;

      setReviews(list);
      setStats({ count, averageRating });
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Ingresa tu nombre completo');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Ingresa tu correo electrónico');
      return;
    }

    if (!formData.comment.trim() || formData.comment.trim().length < 5) {
      toast.error('Por favor escribe tu opinión (al menos 5 caracteres)');
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.createReview({
        name: formData.name.trim(),
        email: formData.email.trim(),
        rating: formData.rating,
        comment: formData.comment.trim(),
        serviceName: formData.serviceName,
        barberName: formData.barberName,
      });

      toast.success('¡Gracias por tu opinión! Se ha publicado exitosamente.');
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        rating: 5,
        comment: '',
        serviceName: 'Experiencia Punto Fino (Corte + Cejas)',
        barberName: 'Juan Diego',
      });
      fetchReviews();
    } catch (error) {
      toast.error(error.message || 'Error al enviar tu opinión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="resenas" className="py-24 sm:py-32 bg-[#0b0c0e] border-b border-white/10 scroll-mt-24">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 bg-[#B89758]"></span>
              <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[#B89758] font-bold">
                TESTIMONIOS REALES Y VERIFICADOS
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight">
              Opiniones de Clientes
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#9B988F] mt-3 max-w-xl">
              Calificación promedio de{' '}
              <strong className="text-white font-semibold">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '5.0'} ★
              </strong>{' '}
              basada en opiniones de clientes reales de Punto Fino en Villacolombia.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-6 rounded-md transition-all flex items-center gap-2.5 shadow-xl active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <MessageSquarePlus size={18} />
              <span>Dejar Mi Opinión</span>
            </button>
          </div>
        </div>

        {/* Contenido de Reseñas */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#B89758] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#9B988F] font-sans text-xs">Cargando opiniones de clientes...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* Estado Vacío Invitador */
          <div className="bg-[#111215] border border-white/10 rounded-md p-12 text-center max-w-2xl mx-auto shadow-2xl">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#B89758]">
              <Sparkles size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">
              Sé el primero en compartir tu experiencia
            </h3>
            <p className="font-sans text-sm text-[#9B988F] mb-6 leading-relaxed">
              ¿Ya te hiciste un corte o ritual en Punto Fino? Déjanos tu calificación y cuéntale a la comunidad cómo fue tu atención.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#B89758] hover:bg-[#a6864a] text-black font-sans font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <MessageSquarePlus size={16} />
              <span>Escribir Mi Reseña Ahora</span>
            </button>
          </div>
        ) : (
          /* Grid de Reseñas */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id || i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                viewport={{ once: true }}
                className="bg-[#111215] border border-white/10 hover:border-white/25 rounded-md p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xl"
              >
                <div>
                  {/* Estrellas de Calificación */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-1.5">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          size={16}
                          className={
                            idx < (review.rating || 5)
                              ? 'text-[#B89758] fill-[#B89758]'
                              : 'text-white/20'
                          }
                        />
                      ))}
                      <span className="font-mono text-sm text-[#F7F5F0] ml-2 font-bold">
                        {(review.rating || 5).toFixed(1)}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-[#9B988F]">
                      {new Date(review.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Texto de la Opinión */}
                  <p className="font-sans text-sm sm:text-base text-[#e5e5e5] leading-relaxed mb-6">
                    “{review.comment}”
                  </p>
                </div>

                {/* Pie de la Reseña */}
                <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      {review.name}
                    </h3>
                    <p className="font-mono text-xs text-[#B89758] mt-0.5">
                      {review.serviceName || 'Servicio General'}
                      {review.barberName ? ` · ${review.barberName}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#9B988F]">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>CLIENTE</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* MODAL PARA DEJAR COMENTARIO Y CALIFICACIÓN */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="DEJAR OPINIÓN DE SERVICIO"
          size="md"
        >
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <p className="text-xs text-[#9B988F] font-sans leading-relaxed">
              Tu opinión sincera nos ayuda a mantener el estándar de calidad en cada corte. Por transparencia, solicitamos tu nombre y correo.
            </p>

            {/* Selector de Estrellas Interactivo */}
            <div className="bg-[#18191E] border border-white/10 rounded-md p-4 text-center">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#B89758] mb-2 font-semibold">
                ¿Cómo calificarías tu servicio?
              </label>
              <div className="flex items-center justify-center gap-2 my-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isHovered = hoverRating >= val;
                  const isSelected = !hoverRating && formData.rating >= val;
                  const active = isHovered || isSelected;

                  return (
                    <button
                      key={val}
                      type="button"
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormData({ ...formData, rating: val })}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={30}
                        className={
                          active
                            ? 'text-[#B89758] fill-[#B89758] drop-shadow-[0_0_8px_rgba(184,151,88,0.5)]'
                            : 'text-white/20 hover:text-white/40'
                        }
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-sans text-white/90 font-medium">
                {RATING_LABELS[hoverRating || formData.rating]}
              </span>
            </div>

            {/* Nombre y Correo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans text-[#eeeef0] mb-1 font-medium">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7a85]" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Andrés Felipe"
                    className="w-full bg-[#111215] border border-[#2b292d] focus:border-[#B89758] rounded-[4px] py-2 pl-9 pr-3 text-xs text-white placeholder-[#7c7a85] focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-[#eeeef0] mb-1 font-medium">
                  Correo electrónico *
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7a85]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu@correo.com"
                    className="w-full bg-[#111215] border border-[#2b292d] focus:border-[#B89758] rounded-[4px] py-2 pl-9 pr-3 text-xs text-white placeholder-[#7c7a85] focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Servicio y Barbero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans text-[#eeeef0] mb-1 font-medium">
                  Servicio realizado
                </label>
                <select
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full bg-[#111215] border border-[#2b292d] focus:border-[#B89758] rounded-[4px] py-2 px-3 text-xs text-white focus:outline-none transition-all"
                >
                  {SERVICES_OPTIONS.map((srv, idx) => (
                    <option key={idx} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans text-[#eeeef0] mb-1 font-medium">
                  Barbero que te atendió
                </label>
                <select
                  value={formData.barberName}
                  onChange={(e) => setFormData({ ...formData, barberName: e.target.value })}
                  className="w-full bg-[#111215] border border-[#2b292d] focus:border-[#B89758] rounded-[4px] py-2 px-3 text-xs text-white focus:outline-none transition-all"
                >
                  {BARBERS_OPTIONS.map((barb, idx) => (
                    <option key={idx} value={barb}>
                      {barb}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comentario / Opinión */}
            <div>
              <label className="block text-xs font-sans text-[#eeeef0] mb-1 font-medium">
                Tu opinión o comentario sobre el corte y la atención *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Cuéntanos cómo te pareció el ambiente, la puntualidad, el trato del barbero y el resultado final..."
                rows={4}
                className="w-full bg-[#111215] border border-[#2b292d] focus:border-[#B89758] rounded-[4px] p-3 text-xs text-white placeholder-[#7c7a85] focus:outline-none transition-all resize-none font-sans leading-relaxed"
                required
              />
            </div>

            {/* Botones de Acción */}
            <div className="pt-3 border-t border-[#2b292d] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-white/20 hover:border-white text-white text-xs rounded-[4px] font-sans transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#E15233] hover:bg-[#C44327] disabled:opacity-50 text-white text-xs font-sans font-bold py-2 px-5 rounded-[4px] transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Publicar Mi Opinión</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </section>
  );
}