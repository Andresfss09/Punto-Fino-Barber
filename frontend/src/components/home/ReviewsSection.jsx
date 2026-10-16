import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle2 } from 'lucide-react';

const REVIEWS = [
  { 
    id: 1, 
    name: 'Carlos Alberto Gómez', 
    service: 'Experiencia Punto Fino + Ritual de Barba ($34.000)',
    date: 'Octubre 2026',
    rating: 5, 
    text: 'Excelente servicio por parte de Juan David. El corte quedó impecable, la toalla caliente y el vapor de ozono en la barba relajan muchísimo. Puntualidad inglesa y ambiente de barrio muy agradable.' 
  },
  { 
    id: 2, 
    name: 'Camilo Andrés Mora', 
    service: 'Ritual de Barba a Navaja ($12.000)',
    date: 'Octubre 2026',
    rating: 5, 
    text: 'Puntualidad de diez y trato de primera por parte de Emanuel Torres. El afeitado a navaja tradicional con aceites hidratantes no me irritó nada la piel. Sin duda la mejor barbería del Tequendama.' 
  },
  { 
    id: 3, 
    name: 'Felipe Benítez', 
    service: 'Experiencia Platinium VIP ($55.000)',
    date: 'Septiembre 2026',
    rating: 5, 
    text: 'El servicio Platinium con Juan Diego es otro nivel: corte a tijera con textura, perfilado milimétrico de cejas, exfoliación y masaje. Salí renovado. 100% recomendados.' 
  },
];

export default function ReviewsSection() {
  return (
    <section id="resenas" className="py-24 sm:py-32 bg-[#000000] border-b border-[#1e1e1e] scroll-mt-24">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="w-2.5 h-2.5 bg-[#B89758]"></span>
            <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.24em] text-[#B89758] font-bold">
              05 · TESTIMONIOS VERIFICADOS · 4.9 ★ CLIENTES PUNTO FINO
            </span>
          </div>
          <h2 className="font-sans uppercase text-4xl sm:text-5xl lg:text-6xl text-white font-black tracking-normal sm:tracking-[0.02em]">
            La Voz del Barrio
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#aaaaaa] mt-4 max-w-xl mx-auto">
            Calificación 4.9 / 5.0 basada en opiniones reales de clientes que confían su estilo en Punto Fino.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS.map((review, i) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              viewport={{ once: true }}
              className="bg-[#0a0a0a] border border-[#1e1e1e] hover:border-[#383838] rounded-none p-8 sm:p-9 flex flex-col justify-between transition-all duration-200 shadow-lg"
            >
              <div>
                {/* Rating Stars (Antique Gold) */}
                <div className="flex items-center gap-1.5 mb-6">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={idx} 
                      size={16} 
                      className={idx < review.rating ? "text-gold-400 fill-gold-400" : "text-[#262626]"} 
                    />
                  ))}
                  <span className="font-mono text-sm text-[#aaaaaa] ml-2 font-bold">5.0</span>
                </div>
                
                {/* Review Text */}
                <p className="font-sans text-base text-[#e5e5e5] leading-relaxed mb-8 font-normal">
                  “{review.text}”
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-5 border-t border-[#1e1e1e] flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-sm uppercase tracking-[0.12em] font-bold text-white">
                    {review.name}
                  </h4>
                  <p className="font-mono text-xs text-gold-400 mt-1 font-medium">
                    {review.service}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#888888]">
                  <CheckCircle2 size={15} className="text-gold-400" />
                  <span>VERIFICADO</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}