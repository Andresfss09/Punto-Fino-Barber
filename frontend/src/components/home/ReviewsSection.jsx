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
    text: 'Excelente servicio por parte de Juan David. El corte quedó impecable, la toalla caliente y el vapor de ozono en la barba relajan muchísimo. Puntualidad inglesa y ambiente cálido de confianza muy agradable.' 
  },
  { 
    id: 2, 
    name: 'Camilo Andrés Mora', 
    service: 'Ritual de Barba a Navaja ($12.000)',
    date: 'Octubre 2026',
    rating: 5, 
    text: 'Puntualidad de diez y trato de primera por parte de Emanuel Torres. El afeitado a navaja tradicional con aceites hidratantes no me irritó nada la piel. Sin duda la mejor barbería de Villacolombia.' 
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
    <section id="resenas" className="py-24 sm:py-32 bg-[#0b0c0e] border-b border-white/10 scroll-mt-24">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="w-2.5 h-2.5 bg-[#B89758]"></span>
            <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[#B89758] font-bold">
              05 · TESTIMONIOS VERIFICADOS · 5.0 ★ CLIENTES PUNTO FINO
            </span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight">
            Opiniones de Clientes
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#9B988F] mt-4 max-w-xl mx-auto">
            Calificación 5.0 basada en opiniones reales de clientes que confían su estilo en Punto Fino.
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
              className="bg-[#111215] border border-white/10 hover:border-white/25 rounded-md p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xl"
            >
              <div>
                {/* Estrellas */}
                <div className="flex items-center gap-1.5 mb-6">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={idx} 
                      size={16} 
                      className="text-[#B89758] fill-[#B89758]" 
                    />
                  ))}
                  <span className="font-mono text-sm text-[#F7F5F0] ml-2 font-bold">5.0</span>
                </div>
                
                {/* Texto */}
                <p className="font-sans text-sm sm:text-base text-[#e5e5e5] leading-relaxed mb-8">
                  “{review.text}”
                </p>
              </div>

              {/* Autor */}
              <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    {review.name}
                  </h3>
                  <p className="font-mono text-xs text-[#B89758] mt-0.5">
                    {review.service}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#9B988F]">
                  <CheckCircle2 size={13} className="text-emerald-400" />
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