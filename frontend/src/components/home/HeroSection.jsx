import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

const SLIDES = [
  {
    id: 1,
    eyebrow: 'VILLACOLOMBIA · SANTIAGO DE CALI',
    titleLine1: 'EXPERIENCIA',
    titleLine2: 'PUNTO FINO',
    desc: 'Corte de precisión a navaja y perfilado limpio de cejas ($ 24.000 COP). Oficio de tradición con Juan David, Emanuel Torres y Juan Diego.',
    buttonText: 'RESERVAR TU SILLA',
    image: '/images/punto-fino/corte-fade-real.png',
  },
  {
    id: 2,
    eyebrow: 'RITUAL TRADICIONAL DE BARBA',
    titleLine1: 'VAPOR DE OZONO &',
    titleLine2: 'TOALLA CALIENTE',
    desc: 'Perfilado al milímetro a navaja, hidratación con aceites botánicos y relajación facial profunda en el corazón de Cali ($ 12.000 COP).',
    buttonText: 'RESERVAR BARBA',
    image: '/images/punto-fino/ritual-vapor-facial.png',
  },
  {
    id: 3,
    eyebrow: 'EXPERIENCIA PLATINIUM VIP',
    titleLine1: 'EL PAQUETE TOTAL',
    titleLine2: 'CORTE, BARBA & FACIAL',
    desc: 'La experiencia definitiva: corte personalizado, cejas, ritual completo de barba con vapor de ozono y toalla caliente por $ 55.000 COP.',
    buttonText: 'RESERVAR PLATINIUM',
    image: '/images/punto-fino/masaje-vapor-ozono.png',
  },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const active = SLIDES[currentSlide];

  return (
    <div className="w-full bg-[#0b0c0e] text-white pt-[112px]">
      {/* Cinematic Hero Viewport */}
      <div className="relative w-full min-h-[660px] sm:min-h-[720px] lg:min-h-[calc(100vh-112px)] xl:min-h-[820px] flex flex-col justify-center overflow-hidden bg-black select-none border-b border-white/10">
        
        {/* Slide de Fondo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <img
              src={active.image}
              alt={active.titleLine1}
              className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.05]"
            />
            {/* Degradados sutiles para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-transparent to-black/40" />
          </motion.div>
        </AnimatePresence>

        {/* Contenido en 2 Columnas */}
        <div className="relative z-10 max-w-[1600px] w-full mx-auto h-full px-6 sm:px-10 lg:px-16 xl:px-20 py-12 lg:py-20 flex items-center flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center w-full">
            
            {/* Columna Izquierda: Títulos Editoriales & CTA */}
            <div className="lg:col-span-7 xl:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-2.5 h-2.5 bg-[#E15233]"></span>
                    <span className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-[#B89758]">
                      {active.eyebrow}
                    </span>
                  </div>

                  <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white leading-[1.02] mb-6">
                    <span>{active.titleLine1}</span>
                    <br />
                    <span className="text-[#B89758]">{active.titleLine2}</span>
                  </h1>

                  <p className="font-sans text-base sm:text-lg lg:text-xl text-[#d4d4d4] max-w-2xl mb-8 sm:mb-10 leading-relaxed font-normal">
                    {active.desc}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                    <a
                      href="#reservar"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('reservar');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-bold text-sm sm:text-base uppercase tracking-wider py-4 px-8 sm:px-10 rounded-md transition-all flex items-center gap-3 shadow-2xl active:scale-95 cursor-pointer"
                    >
                      <Calendar size={18} />
                      <span>{active.buttonText}</span>
                      <ArrowRight size={16} />
                    </a>

                    <a
                      href="#servicios"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('servicios');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-[#18191E]/80 hover:bg-[#18191E] border border-white/20 hover:border-white text-white font-sans font-bold text-sm sm:text-base uppercase tracking-wider py-4 px-7 sm:px-8 rounded-md transition-all text-center backdrop-blur-sm cursor-pointer"
                    >
                      Ver Precios y Cortes
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Columna Derecha: Tarjeta de Acceso Rápido */}
            <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 justify-end">
              <div className="w-full max-w-md bg-[#111215]/95 backdrop-blur-md border border-white/10 p-8 sm:p-9 shadow-2xl rounded-md relative">
                {/* Header de la Tarjeta */}
                <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src="/images/punto-fino/logo.png" 
                      alt="Punto Fino" 
                      className="w-12 h-12 object-contain p-1 bg-black border border-white/10 rounded shadow-md" 
                    />
                    <div>
                      <h3 className="font-display font-bold text-xl text-white leading-tight">
                        Punto Fino
                      </h3>
                      <span className="text-xs text-[#B89758] font-sans mt-0.5 block">
                        Villacolombia · Cali
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded font-semibold">
                    Abierto Hoy
                  </span>
                </div>

                <div className="space-y-4 text-sm font-sans mb-8">
                  <div className="flex items-start gap-3 text-[#dcdcdc]">
                    <CheckCircle2 size={18} className="text-[#B89758] shrink-0 mt-0.5" />
                    <span><strong>3 Barberos oficiales:</strong> Juan David (Admin), Emanuel y Juan Diego</span>
                  </div>
                  <div className="flex items-start gap-3 text-[#dcdcdc]">
                    <CheckCircle2 size={18} className="text-[#B89758] shrink-0 mt-0.5" />
                    <span><strong>Atención puntual:</strong> Reserva online sin hacer fila en el local</span>
                  </div>
                  <div className="flex items-start gap-3 text-[#dcdcdc]">
                    <CheckCircle2 size={18} className="text-[#B89758] shrink-0 mt-0.5" />
                    <span><strong>Espacio Climatizado:</strong> Buena música, comodidad y la mejor vibra de Cali</span>
                  </div>
                </div>

                <a
                  href="#reservar"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('reservar');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-white hover:bg-[#EFECE4] text-black font-sans font-bold text-sm uppercase tracking-wider py-3.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Calendar size={16} />
                  <span>Agendar Mi Cita Ahora</span>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Indicadores del Carrusel */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
          {SLIDES.map((s, idx) => {
            const isActive = currentSlide === idx;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 transition-all cursor-pointer rounded-full ${
                  isActive ? 'w-10 bg-[#E15233]' : 'w-3 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            );
          })}
        </div>

        {/* Flechas de Navegación */}
        <button
          onClick={prevSlide}
          aria-label="Corte anterior"
          className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-md border border-white/20 hover:border-white text-white flex items-center justify-center transition-all bg-black/60 hover:bg-black/90 cursor-pointer backdrop-blur-sm shadow-lg"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Siguiente corte"
          className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-md border border-white/20 hover:border-white text-white flex items-center justify-center transition-all bg-black/60 hover:bg-black/90 cursor-pointer backdrop-blur-sm shadow-lg"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Franja de Estadísticas */}
      <section className="bg-[#111215] border-b border-white/10 py-8 sm:py-12">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-16 grid grid-cols-3 gap-6 text-center divide-x divide-white/10">
          <div>
            <div className="font-mono text-3xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight">
              +<AnimatedCounter value={5} />
            </div>
            <div className="font-sans text-xs sm:text-sm uppercase tracking-wider text-[#9B988F] font-medium mt-2">
              Años de Experiencia
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight">
              <AnimatedCounter value={2500} />+
            </div>
            <div className="font-sans text-xs sm:text-sm uppercase tracking-wider text-[#9B988F] font-medium mt-2">
              Clientes Atendidos
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl sm:text-5xl lg:text-6xl text-[#B89758] font-bold tracking-tight">
              <AnimatedCounter value={5.0} />
            </div>
            <div className="font-sans text-xs sm:text-sm uppercase tracking-wider text-[#9B988F] font-medium mt-2">
              Calificación en Cali
            </div>
          </div>
        </div>
      </section>

      {/* Promesa del Oficio de Punto Fino */}
      <section className="border-b border-white/10 bg-[#0b0c0e] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-[#B89758] block mb-5 font-bold">
            LA EXPERIENCIA EN PUNTO FINO
          </span>
          <blockquote className="font-display text-xl sm:text-2xl lg:text-3xl text-white font-normal leading-relaxed">
            “En Punto Fino nos enfocamos en que te sientas con confianza, disfrutes de un buen ambiente y salgas con el corte exacto que pediste. Atención puntual, buena música y la mejor vibra de Cali.”
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="w-12 h-px bg-white/20"></span>
            <span className="font-sans text-xs sm:text-sm uppercase tracking-wider text-[#9B988F] font-medium">
              Juan David · Emanuel Torres · Juan Diego
            </span>
            <span className="w-12 h-px bg-white/20"></span>
          </div>
        </div>
      </section>
    </div>
  );
}