import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PageTransition from '../components/ui/PageTransition';
import useAuthStore from '../store/useAuthStore';
import PublicBookingView from './prototypes/PublicBookingView';

export default function BookingPage() {
  const { isAuthenticated, user, isBarber, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  // Si un barbero o admin intenta agendar citas como cliente, redirigir a su propio panel
  useEffect(() => {
    if (isAuthenticated) {
      if (isBarber?.() || user?.role === 'barbero' || user?.role === 'BARBER') {
        navigate('/barber', { replace: true });
      } else if (isAdmin?.() || user?.role === 'admin' || user?.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, isBarber, isAdmin]);

  if (isAuthenticated && (user?.role === 'barbero' || user?.role === 'BARBER' || user?.role === 'admin' || user?.role === 'ADMIN')) {
    return null;
  }

  return (
    <PageTransition>
      <Navbar />
      <div className="min-h-screen bg-pf-carbon text-pf-bone pt-28 pb-32 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <span className="text-[11px] font-mono tracking-widest text-pf-terracota font-bold uppercase inline-block mb-2">
              PUNTO FINO · VILLACOLOMBIA · SANTIAGO DE CALI
            </span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-pf-bone mb-2">
              Reservá tu Turno en la Silla
            </h1>
            <p className="text-pf-muted text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Elegí tus servicios, tu barbero de confianza y la franja horaria. Sin crear cuentas ni contraseñas.
            </p>
          </div>

          <PublicBookingView />
        </div>
      </div>
    </PageTransition>
  );
}