import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

const BARBERS = [
  { 
    id: 1, 
    name: 'Juan David', 
    role: 'Barbero & Administrador', 
    experience: '8+ AÑOS',
    rating: 4.9, 
    reviews: 42, 
    monogram: 'Jd',
    image: '/images/punto-fino/equipo-barberos-real.png',
    specs: ['Experiencia Punto Fino', 'Visagismo Masculino', 'Degradados Fade', 'Gestión de Barbería'],
    bio: 'Barbero y Administrador de Punto Fino. Especialista en la Experiencia Punto Fino, visagismo masculino, cortes clásicos, degradados pulidos y el cuidado meticuloso de cada cliente que se sienta en la silla.',
  },
  { 
    id: 2, 
    name: 'Emanuel Torres', 
    role: 'Barbero Profesional', 
    experience: '6+ AÑOS',
    rating: 4.9, 
    reviews: 38, 
    monogram: 'et',
    image: '/images/punto-fino/ritual-vapor-real.png',
    specs: ['Ritual de Barba', 'Vapor de Ozono', 'Afeitado a Navaja', 'Toalla Caliente'],
    bio: 'Especialista en Ritual de Barba tradicional con toalla caliente y vapor de ozono, perfilado a navaja milimétrica, degradados fade y tratamientos para barba suave y piel hidratada.',
  },
  { 
    id: 3, 
    name: 'Juan Diego', 
    role: 'Barbero Máster', 
    experience: '7+ AÑOS',
    rating: 5.0, 
    reviews: 45, 
    monogram: 'JD',
    image: '/images/punto-fino/corte-fade-real.png',
    specs: ['Experiencia Platinium VIP', 'Perfilado de Cejas', 'Corte a Tijera', 'Texturizado'],
    bio: 'Barbero máster enfocado en la Experiencia Platinium VIP, diseño y perfilado limpio de cejas, cortes a tijera con textura natural y acabados de precisión para los clientes más exigentes.',
  },
];

export default function BarbersSection() {
  return (
    <section id="barberos" className="py-24 sm:py-32 bg-[#000000] border-b border-[#1e1e1e] scroll-mt-24">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#1e1e1e] pb-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 bg-[#B89758]"></span>
              <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.24em] text-[#B89758] font-bold">
                03 · NUESTRO EQUIPO DE MAESTROS
              </span>
            </div>
            <h2 className="font-sans uppercase text-4xl sm:text-5xl lg:text-6xl text-white font-black tracking-normal sm:tracking-[0.02em] leading-tight">
              Los Barberos de Punto Fino
            </h2>
          </div>
          <p className="font-sans text-sm sm:text-base text-[#aaaaaa] max-w-lg mt-4 md:mt-0 leading-relaxed">
            Juan David (Barbero & Administrador), Emanuel Torres y Juan Diego. Tres profesionales con oficio, mano fina y la calidez del barrio en Santiago de Cali.
          </p>
        </div>

        {/* Barbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BARBERS.map((barber, i) => (
            <motion.div 
              key={barber.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              viewport={{ once: true }}
              className="bg-[#0d0d0d] border border-[#1e1e1e] hover:border-[#444444] rounded-none overflow-hidden flex flex-col justify-between transition-all duration-150 group shadow-lg"
            >
              {/* Header with Photo / Monogram */}
              <div className="p-6 sm:p-7 border-b border-[#1e1e1e] bg-black flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-none overflow-hidden border border-[#333333] group-hover:border-[#B89758] transition-colors shrink-0 shadow-md">
                    <img 
                      src={barber.image} 
                      alt={barber.name} 
                      className="w-full h-full object-cover filter brightness-95 contrast-105"
                    />
                    <div className="absolute bottom-0 right-0 bg-[#111215]/90 border-t border-l border-[#B89758]/40 px-1 py-0.5">
                      <span className="font-mono text-[9px] font-bold text-[#B89758] tracking-tighter">
                        {barber.monogram}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-sans uppercase text-base sm:text-lg text-white font-bold tracking-[0.08em] leading-snug group-hover:text-[#B89758] transition-colors">
                      {barber.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] rounded-none border border-[#333333] bg-[#0a0a0a] text-[#B89758]">
                        {barber.experience}
                      </span>
                      {barber.role.includes('Administrador') && (
                        <span className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-none bg-[#E15233]/20 border border-[#E15233]/40 text-[#E15233]">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[#222222] px-3 py-1.5 rounded-none shrink-0">
                  <Star size={13} className="text-[#B89758] fill-[#B89758]" />
                  <span className="font-mono text-sm font-bold text-white">{barber.rating}</span>
                  <span className="font-sans text-[11px] text-[#888888]">({barber.reviews})</span>
                </div>
              </div>

              {/* Information & Specialties */}
              <div className="p-7 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#B89758] font-bold">
                    {barber.role}
                  </p>
                  <p className="font-sans text-sm text-[#cccccc] mt-3 leading-relaxed">
                    {barber.bio}
                  </p>
                </div>

                <div className="space-y-5 pt-5 border-t border-[#1e1e1e]">
                  <div className="flex flex-wrap gap-2">
                    {barber.specs.map((spec, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 bg-black border border-[#222222] text-[#cccccc] text-xs font-sans uppercase tracking-[0.12em] rounded-none font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <a
                    href="#reservar"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('reservar');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full bg-transparent hover:bg-white text-white hover:text-black border border-[#333333] hover:border-white font-sans text-xs sm:text-[13px] uppercase tracking-[0.16em] py-3 px-5 rounded-none transition-all flex items-center justify-center gap-2.5 cursor-pointer font-bold active:scale-[0.99]"
                  >
                    <span>Agendar con {barber.name.split(' ')[0]}</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}