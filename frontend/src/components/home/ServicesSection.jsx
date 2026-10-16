import React, { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';

const CATEGORIES = ['Todos', 'Combos', 'Cortes', 'Barba & Cejas'];

const SERVICES = [
  {
    id: 1,
    name: "Experiencia 'Punto Fino' (Corte + Cejas)",
    badge: 'Popular · Recomendado',
    image: '/images/punto-fino/corte-fade-real.png',
    desc: 'Descubre nuestro servicio de Corte y Ceja, una experiencia de 35 min con degradado a navaja, cerquillo limpio y lavado revitalizante.',
    price: 24000,
    time: 35,
    cat: 'Cortes',
    highlight: true,
  },
  {
    id: 2,
    name: 'Experiencia Punto Fino + Ritual de Barba',
    badge: 'Popular',
    image: '/images/punto-fino/ritual-vapor-facial.png',
    desc: 'Corte de cabello, perfilado de cerquillo y cejas, combinado con ritual completo de barba con toalla caliente aromatizada y aceites hidratantes.',
    price: 34000,
    time: 45,
    cat: 'Combos',
  },
  {
    id: 3,
    name: 'Experiencia Platinium (Todo Incluido)',
    badge: 'Popular · 15% OFF',
    image: '/images/punto-fino/masaje-vapor-ozono.png',
    desc: 'El servicio más completo: corte personalizado, cejas, ritual completo de barba con vapor de ozono, exfoliación profunda y toalla caliente.',
    price: 55000,
    time: 60,
    cat: 'Combos',
    highlight: true,
  },
  {
    id: 4,
    name: 'Ritual de Barba',
    badge: 'Popular',
    image: '/images/punto-fino/ritual-vapor-facial.png',
    desc: 'Ritual tradicional con toalla caliente aromatizada, perfilado a navaja con cuchilla nueva y aceites botánicos para piel suave y relajada.',
    price: 12000,
    time: 25,
    cat: 'Barba & Cejas',
  },
  {
    id: 5,
    name: 'Cejas',
    badge: 'Detalle Rápido',
    image: '/images/punto-fino/corte-fade-real.png',
    desc: 'Limpieza y alineación milimétrica de cejas con navaja y cuchilla descartable esterilizada.',
    price: 5000,
    time: 15,
    cat: 'Barba & Cejas',
  },
];

export default function ServicesSection() {
  const [activeCat, setActiveCat] = useState('Todos');

  const filtered = activeCat === 'Todos' ? SERVICES : SERVICES.filter(s => s.cat === activeCat);

  return (
    <section id="servicios" className="py-24 sm:py-32 bg-[#0b0c0e] border-b border-white/10 scroll-mt-24">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 bg-[#E15233]"></span>
              <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[#B89758] font-bold">
                01 · PRECIOS Y SERVICIOS
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight leading-tight">
              Cortes & Servicios
            </h2>
          </div>
          <p className="font-sans text-sm sm:text-base text-[#9B988F] max-w-lg mt-4 md:mt-0 leading-relaxed">
            Cortes modernos, degradados limpios, afeitado a navaja y el mejor ambiente en Villacolombia · Cali. Mismo precio con cualquiera de nuestros tres barberos.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2.5 mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-5 py-2.5 text-xs sm:text-sm font-sans rounded-md border transition-all cursor-pointer ${
                activeCat === cat
                  ? 'bg-white text-black border-white font-bold shadow-md'
                  : 'bg-[#111215] text-[#9B988F] border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(service => (
            <article
              key={service.id}
              className={`bg-[#111215] border rounded-md overflow-hidden flex flex-col justify-between transition-all duration-200 group shadow-xl ${
                service.highlight
                  ? 'border-white/30 ring-1 ring-white/15'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              {/* Fotografía del Servicio */}
              <div className="relative aspect-[16/10] overflow-hidden bg-black">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05] group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111215] via-transparent to-transparent opacity-80" />

                {/* Badge Superior */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 text-xs font-sans font-semibold rounded-md bg-black/85 text-white border border-white/15 backdrop-blur-sm">
                    {service.badge}
                  </span>
                </div>

                {/* Duración */}
                <div className="absolute bottom-4 right-4 z-10 bg-black/85 border border-white/15 px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-mono text-[#cccccc] backdrop-blur-sm">
                  <Clock size={13} className="text-[#B89758]" />
                  <span>{service.time} min</span>
                </div>
              </div>

              {/* Detalles */}
              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl text-white font-bold group-hover:text-[#B89758] transition-colors leading-snug mb-3">
                    {service.name}
                  </h3>
                  <p className="font-sans text-sm text-[#9B988F] leading-relaxed mb-6 font-normal">
                    {service.desc}
                  </p>
                </div>

                {/* Precio y CTA */}
                <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-2xl text-white">
                      ${service.price.toLocaleString('es-CO')}
                    </div>
                    <span className="font-sans text-[11px] text-[#6A6862] uppercase tracking-wider block font-normal">
                      COP · Tarifa Única
                    </span>
                  </div>

                  <a
                    href="#reservar"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('reservar');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 bg-[#18191E] hover:bg-white text-white hover:text-black border border-white/15 hover:border-white font-sans text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-md transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Reservar</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}