import React from 'react';
import { motion } from 'framer-motion';
import { User, Check, Star, ShieldCheck } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function BarberSelector({ barbers = [], selectedBarber, onSelectBarber, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!barbers.length) {
    return (
      <div className="text-center py-16 border border-white/10 rounded-md bg-[#111215]">
        <User size={32} className="text-[#666666] mx-auto mb-3" />
        <p className="text-[#888888] font-sans text-xs uppercase tracking-wider">No hay barberos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-[#B89758] font-sans px-1">
        <ShieldCheck size={14} className="shrink-0" />
        <span>Todos nuestros barberos atienden el menú completo con el mismo estándar y tarifa.</span>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Opción: Cualquier Barbero Disponible */}
        <motion.div variants={item}>
          <div 
            onClick={() => onSelectBarber({ _id: 'any', user: { name: 'Cualquiera' } })}
            className={`h-full flex flex-col justify-between p-5 rounded-md border transition-all duration-200 cursor-pointer ${
              selectedBarber?._id === 'any' 
                ? 'bg-[#18191E] border-[#E15233] shadow-lg ring-1 ring-[#E15233]' 
                : 'bg-[#111215] border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-md border border-white/15 flex items-center justify-center bg-[#18191E] shrink-0">
                <User size={20} className="text-[#E15233]" />
              </div>
              {selectedBarber?._id === 'any' && (
                <div className="w-5 h-5 shrink-0 bg-[#E15233] text-white flex items-center justify-center rounded">
                  <Check size={13} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="font-display font-bold text-lg text-white leading-tight">
                El primero libre
              </h3>
              <p className="text-[#9B988F] text-xs font-sans mt-1">
                Asignación inteligente según tu hora preferida
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <span>● Mayor rapidez</span>
            </div>
          </div>
        </motion.div>

        {/* Barberos Individuales — Tipográficos Sin Foto */}
        {barbers.map(barber => {
          const isSelected = selectedBarber?._id === barber._id;
          const barberName = barber.user?.name || barber.name || 'Barbero';
          const initials = barberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

          return (
            <motion.div key={barber._id} variants={item}>
              <div 
                onClick={() => onSelectBarber(barber)}
                className={`h-full flex flex-col justify-between p-5 rounded-md border transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'bg-[#18191E] border-[#E15233] shadow-lg ring-1 ring-[#E15233]' 
                    : 'bg-[#111215] border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Monograma Tipográfico */}
                  <div className={`w-12 h-12 rounded-md border flex items-center justify-center shrink-0 bg-[#18191E] ${
                    isSelected ? 'border-[#E15233]' : 'border-white/15'
                  }`}>
                    <span className="font-display text-lg text-white font-bold">
                      {initials}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 shrink-0 bg-[#E15233] text-white flex items-center justify-center rounded">
                      <Check size={13} strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="font-display font-bold text-lg text-white leading-tight">
                    {barberName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star size={11} className="text-[#B89758] fill-[#B89758]" />
                    <span className="font-mono text-xs text-white">
                      {barber.rating?.average?.toFixed(1) || '5.0'}
                    </span>
                    <span className="text-[#888888] text-[11px] font-sans">
                      ({barber.rating?.count || 48})
                    </span>
                  </div>
                  <p className="text-[#9B988F] text-xs font-sans mt-1">
                    Maestro Barbero
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-sans text-[#cccccc]">
                  <span>Menú completo</span>
                  <span className="text-emerald-400 font-mono text-[10px]">● Activo</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
