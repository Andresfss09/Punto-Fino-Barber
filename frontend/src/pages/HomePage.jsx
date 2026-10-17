import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import BeveragesSection from '../components/home/BeveragesSection';
import BarbersSection from '../components/home/BarbersSection';
import ReviewsSection from '../components/home/ReviewsSection';
import LocationSection from '../components/home/LocationSection';
import PublicBookingView from './prototypes/PublicBookingView';

export default function HomePage() {
  const location = useLocation();
  const [preselectedBarber, setPreselectedBarber] = useState(null);
  const [preselectedProduct, setPreselectedProduct] = useState(null);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  return (
    <div className="bg-[#0b0c0e]">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <BeveragesSection onSelectBeverage={(prod) => setPreselectedProduct(prod)} />

      {/* Sección de Reserva directa en la página principal */}
      <section
        id="reservar"
        className="py-24 sm:py-32 bg-[#0b0c0e] border-b border-white/10 relative scroll-mt-24"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <div className="text-center mb-12">
            <span className="font-sans text-xs text-[#E15233] font-semibold block mb-2">
              Sede Villacolombia · Carrera 12 #53-51, Cali
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white font-bold tracking-tight">
              Agenda tu cita
            </h2>
            <p className="text-[#9B988F] text-sm sm:text-base max-w-xl mx-auto mt-2 font-sans leading-relaxed">
              Elige tu servicio, tu barbero y tu horario en tiempo real. Confirmación inmediata a tu correo electrónico sin crear cuentas ni contraseñas.
            </p>
          </div>

          <PublicBookingView
            preselectedBarber={preselectedBarber}
            preselectedProduct={preselectedProduct}
          />
        </div>
      </section>

      <BarbersSection onSelectBarber={(barber) => setPreselectedBarber(barber)} />
      <ReviewsSection />
      <LocationSection />
    </div>
  );
}