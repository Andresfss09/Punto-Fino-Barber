import React, { useEffect } from 'react';
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
    <div className="bg-[#0e1311]">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <BeveragesSection />

      {/* Sección de Reserva directa en la página principal */}
      <section id="reservar" className="py-24 sm:py-32 bg-[#000000] border-b border-[#1e1e1e] relative scroll-mt-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 bg-pf-terracota"></span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-pf-terracota font-bold">
                RESERVA TU SILLA EN PUNTO FINO · VILLACOLOMBIA
              </span>
            </div>
            <h2 className="font-display uppercase text-3xl sm:text-5xl text-pf-bone font-bold tracking-tight">
              Agendá tu Turno
            </h2>
            <p className="text-pf-muted text-xs sm:text-sm max-w-xl mx-auto mt-2 font-sans leading-relaxed">
              Elegí tu corte, tu barbero y tu horario. Proceso ágil y directo, sin registros ni apps para clientes.
            </p>
          </div>

          <PublicBookingView />
        </div>
      </section>

      <BarbersSection />
      <ReviewsSection />
      <LocationSection />
    </div>
  );
}