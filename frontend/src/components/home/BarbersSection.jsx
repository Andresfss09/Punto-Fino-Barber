import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

const BARBERS = [
  { 
    id: 1, 
    name: 'Juan David', 
    role: 'Barbero & Administrador', 
    experience: '8 años de oficio',
    rating: 5.0, 
    reviews: 64, 
    monogram: 'Jd',
    availability: 'Disponible ahora',
    availabilityState: 'available',
    bio: 'Barbero y Administrador de Punto Fino. Especialista en la Experiencia Punto Fino, visagismo masculino, cortes clásicos, degradados pulidos y el cuidado meticuloso de cada cliente que se sienta en la silla.',
  },
  { 
    id: 2, 
    name: 'Emanuel Torres', 
    role: 'Barbero Profesional', 
    experience: '6 años de oficio',
    rating: 4.9, 
    reviews: 58, 
    monogram: 'et',
    availability: 'En turno hoy',
    availabilityState: 'available',
    bio: 'Barbero profesional con amplia trayectoria en Santiago de Cali. Maestro en degradados modernos, rituales tradicionales de barba a navaja y perfilado milimétrico.',
  },
  { 
    id: 3, 
    name: 'Juan Diego', 
    role: 'Barbero Profesional', 
    experience: '7 años de oficio',
    rating: 5.0, 
    reviews: 71, 
    monogram: 'JD',
    availability: 'Disponible ahora',
    availabilityState: 'available',
    bio: 'Dedicado al oficio del corte masculino y la precisión a tijera y máquina. Todos los servicios de la casa ejecutados con paciencia, pulcritud y el mejor trato.',
  },
];

export default function BarbersSection() {
  const handleScrollToBooking = (e, barberName) => {
    e.preventDefault();
    const el = document.getElementById('reservar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="barberos" className="py-24 sm:py-32 bg-[#0b0c0e] border-b border-white/10 scroll-mt-24">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 bg-[#B89758]"></span>
              <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[#B89758] font-bold">
                03 · EL EQUIPO DE PUNTO FINO
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight leading-tight">
              Los Barberos
            </h2>
          </div>
          <div className="max-w-lg mt-4 md:mt-0">
            <p className="font-sans text-sm sm:text-base text-[#9B988F] leading-relaxed">
              Juan David (Barbero & Administrador), Emanuel Torres y Juan Diego. Tres profesionales con oficio, mano fina y la cercanía de siempre en Cali.
            </p>
            <p className="font-sans text-xs text-[#B89758] mt-2 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="shrink-0" />
              <span>Todos los barberos atienden todos los servicios con el mismo estándar de calidad y precio.</span>
            </p>
          </div>
        </div>

        {/* Barbers Grid — Resueltas Tipográficamente Sin Fotos de Perfil */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BARBERS.map((barber, i) => (
            <motion.div 
              key={barber.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              viewport={{ once: true }}
              className="bg-[#111215] border border-white/10 hover:border-white/30 rounded-md overflow-hidden flex flex-col justify-between transition-all duration-200 group shadow-xl"
            >
              {/* Header Tipográfico con Monograma Editorial */}
              <div className="p-6 sm:p-7 border-b border-white/10 bg-[#16181D] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Monograma de Autor */}
                  <div className="w-16 h-16 rounded-md bg-[#111215] border border-white/15 group-hover:border-[#B89758] flex items-center justify-center transition-colors shrink-0 shadow-inner">
                    <span className="font-display text-2xl font-bold text-[#F7F5F0] tracking-wide">
                      {barber.monogram}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl text-white font-bold leading-tight group-hover:text-[#B89758] transition-colors">
                      {barber.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[11px] text-[#9B988F]">
                        {barber.experience}
                      </span>
                      {barber.role.includes('Administrador') && (
                        <span className="inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-[#E15233]/20 border border-[#E15233]/40 text-[#E15233]">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 bg-[#111215] border border-white/10 px-3 py-1.5 rounded shrink-0">
                  <Star size={13} className="text-[#B89758] fill-[#B89758]" />
                  <span className="font-mono text-sm font-bold text-white">{barber.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Información y Disponibilidad en Tiempo Real */}
              <div className="p-7 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  {/* Indicador de Disponibilidad */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans text-xs uppercase tracking-wider text-[#B89758] font-semibold">
                      {barber.role}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {barber.availability}
                    </span>
                  </div>

                  <p className="font-sans text-sm text-[#cccccc] leading-relaxed">
                    {barber.bio}
                  </p>
                </div>

                {/* Garantía de Menú Completo & Botón Directo */}
                <div className="space-y-4 pt-5 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs font-sans text-[#9B988F]">
                    <Clock size={13} className="text-[#B89758] shrink-0" />
                    <span>Atiende el menú completo de cortes y rituales</span>
                  </div>

                  <a
                    href="#reservar"
                    onClick={(e) => handleScrollToBooking(e, barber.name)}
                    className="w-full bg-[#18191E] hover:bg-white text-white hover:text-black border border-white/15 hover:border-white font-sans text-xs sm:text-sm font-bold uppercase tracking-wider py-3 px-5 rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Reservar con {barber.name.split(' ')[0]}</span>
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