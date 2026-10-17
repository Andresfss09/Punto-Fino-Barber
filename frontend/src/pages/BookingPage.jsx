import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PageTransition from '../components/ui/PageTransition';
import useAuthStore from '../store/useAuthStore';
import PublicBookingView from './prototypes/PublicBookingView';

export default function BookingPage() {
  const { isAuthenticated, user, isBarber, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin?.()) {
        navigate('/admin', { replace: true });
      } else if (isBarber?.()) {
        navigate('/barber', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, isBarber, isAdmin]);

  return (
    <PageTransition>
      <Navbar />
      <div className="min-h-screen bg-[#0b0c0e] text-white pt-32 pb-28 px-4 sm:px-6">
        <div className="max-w-[1320px] mx-auto">
          <div className="mb-10 text-center">
            <span className="text-xs font-sans font-semibold text-[#E15233] inline-block mb-2">
              Punto Fino · Carrera 12 #53-51, Villacolombia, Cali
            </span>
            <h1 className="font-display font-bold text-3xl sm:text-5xl text-white mb-2">
              Agenda tu cita
            </h1>
            <p className="text-[#9B988F] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-sans">
              Elige tu servicio, tu barbero y la franja horaria disponible. Confirmación directa por correo electrónico.
            </p>
          </div>

          <PublicBookingView />
        </div>
      </div>
    </PageTransition>
  );
}