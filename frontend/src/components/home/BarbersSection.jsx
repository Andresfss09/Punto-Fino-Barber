import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Calendar, Clock } from 'lucide-react';
import { OFFICIAL_BARBERS, getShopStatus } from '../../config/businessConfig';

export default function BarbersSection({ onSelectBarber }) {
  const shopStatus = getShopStatus();
  const todayDayOfWeek = shopStatus.todayDayOfWeek;

  const handleScrollToBooking = (e, barber) => {
    e.preventDefault();
    if (onSelectBarber) {
      onSelectBarber(barber);
    }
    const el = document.getElementById('reservar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="barberos" className="py-24 sm:py-32 bg-[#0b0c0e] border-b border-white/10 scroll-mt-24">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        {/* Encabezado de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 mb-12">
          <div>
            <span className="font-sans text-xs text-[#B89758] font-semibold block mb-2">
              El equipo de Punto Fino
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white font-bold tracking-tight leading-tight">
              Los Barberos
            </h2>
          </div>
          <div className="max-w-lg mt-4 md:mt-0">
            <p className="font-sans text-sm sm:text-base text-[#9B988F] leading-relaxed">
              Juan David (Barbero y Administrador), Emanuel Torres y Juan Diego. Tres profesionales dedicados al oficio en nuestra sede de Villacolombia, Cali.
            </p>
            <p className="font-sans text-xs text-[#B89758] mt-2 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="shrink-0" />
              <span>Todos los barberos ofrecen todos los servicios con la misma duración y el mismo precio.</span>
            </p>
          </div>
        </div>

        {/* Tarjetas Tipográficas — Sin Fotos de Perfil, Sin Cajas de Iniciales ni Estadísticas Inventadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {OFFICIAL_BARBERS.map((barber, i) => {
            const isRestingToday = barber.weeklyRestDay === todayDayOfWeek;

            return (
              <motion.div
                key={barber.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                viewport={{ once: true }}
                className="bg-[#111215] border border-white/10 hover:border-[#B89758]/50 rounded-md overflow-hidden flex flex-col justify-between transition-all duration-200 group shadow-xl"
              >
                {/* Encabezado Editorial Puro */}
                <div className="p-7 border-b border-white/10 bg-[#16181D]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-sans text-xs text-[#B89758] font-medium block mb-1">
                        {barber.roleLabel}
                      </span>
                      <h3 className="font-display text-2xl sm:text-3xl text-white font-bold leading-tight group-hover:text-[#B89758] transition-colors">
                        {barber.name}
                      </h3>
                    </div>

                    {barber.isAdmin && (
                      <span className="inline-block px-2.5 py-1 text-[11px] font-sans font-semibold rounded bg-[#E15233]/15 border border-[#E15233]/35 text-[#E15233] shrink-0">
                        Admin
                      </span>
                    )}
                  </div>

                  {/* Estado de Agenda y Día de Descanso Real */}
                  <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-sans font-medium px-2.5 py-1 rounded ${
                        isRestingToday
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRestingToday ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                        }`}
                      />
                      {isRestingToday ? 'En descanso hoy' : 'Disponible en agenda'}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-sans text-[#9B988F]">
                      <Calendar size={13} className="text-[#B89758]" />
                      {barber.restDayLabel}
                    </span>
                  </div>
                </div>

                {/* Cuerpo y Acción */}
                <div className="p-7 flex-1 flex flex-col justify-between space-y-6">
                  <p className="font-sans text-sm text-[#cccccc] leading-relaxed">
                    {barber.bio}
                  </p>

                  <div className="space-y-4 pt-5 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs font-sans text-[#9B988F]">
                      <Clock size={13} className="text-[#B89758] shrink-0" />
                      <span>Atiende el catálogo completo de cortes y rituales</span>
                    </div>

                    <a
                      href="#reservar"
                      onClick={(e) => handleScrollToBooking(e, barber)}
                      className="w-full bg-[#18191E] hover:bg-white text-white hover:text-black border border-white/15 hover:border-white font-sans text-xs sm:text-sm font-semibold py-3 px-5 rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>Agendar con {barber.name}</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}