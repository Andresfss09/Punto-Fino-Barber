import React, { useState } from 'react';
import { 
  Palette, Smartphone, Monitor, Mail, Calendar, 
  Sparkles, CheckCircle2, ArrowRight, ExternalLink
} from 'lucide-react';

import DesignSystemView from './DesignSystemView';
import PublicBookingView from './PublicBookingView';
import BarberMobileView from './BarberMobileView';
import AdminDashboardView from './AdminDashboardView';
import CustomerEmailView from './CustomerEmailView';

export default function PrototypeHub() {
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) return tab;
    }
    return 'design-system';
  };

  const [activeView, setActiveView] = useState(getInitialTab);

  const handleSelectView = (id) => {
    setActiveView(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const views = [
    {
      id: 'design-system',
      name: '1. Design System',
      shortName: 'Design System',
      icon: Palette,
      desc: 'Tokens, paleta, tipografía y componentes'
    },
    {
      id: 'public-web',
      name: '2. Web Pública de Reservas',
      shortName: 'Web Clientes',
      icon: Calendar,
      desc: 'Flujo guiado en 5 pasos sin login obligatorio'
    },
    {
      id: 'barber-mobile',
      name: '3. App Móvil Barbero',
      shortName: 'App Barbero',
      icon: Smartphone,
      desc: 'En silla ahora, Walk-in en 2 toques y POS'
    },
    {
      id: 'admin-panel',
      name: '4. Panel Administrador',
      shortName: 'Panel Admin',
      icon: Monitor,
      desc: 'Tablero en vivo, arqueo de caja y sillas'
    },
    {
      id: 'customer-email',
      name: '5. Correo Confirmación',
      shortName: 'Email Transaccional',
      icon: Mail,
      desc: 'Plantilla Resend con .ics y token seguro'
    }
  ];

  return (
    <div className="min-h-screen bg-pf-carbon text-pf-bone">
      {/* Barra Superior Fija de Navegación entre Prototipos */}
      <header className="sticky top-0 z-40 bg-pf-surface/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo y Badge de Fase */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-pf-terracota flex items-center justify-center font-display font-black text-white text-base shadow-sm">
              PF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-tight text-white">PUNTO FINO</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pf-terracota/20 border border-pf-terracota/40 text-pf-terracota font-bold">
                  FASE 1: PROTOTIPOS
                </span>
              </div>
              <div className="text-[10px] text-pf-muted">Santiago de Cali, Colombia · Villacolombia</div>
            </div>
          </div>

          {/* Selector de Pantallas Prototipadas */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {views.map((v) => {
              const Icon = v.icon;
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => handleSelectView(v.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-pf-terracota text-white font-bold shadow-sm' 
                      : 'text-pf-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{v.name}</span>
                  <span className="md:hidden">{v.shortName}</span>
                </button>
              );
            })}
          </nav>

          {/* Enlace rápido a la web pública real */}
          <div className="hidden lg:flex items-center gap-2">
            <a 
              href="/reservar" 
              className="text-xs font-mono text-pf-terracota hover:underline flex items-center gap-1"
            >
              Probar flujo /reservar <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      </header>

      {/* Contenedor Principal de la Pantalla Activa */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {activeView === 'design-system' && <DesignSystemView />}
        {activeView === 'public-web' && <PublicBookingView />}
        {activeView === 'barber-mobile' && <BarberMobileView />}
        {activeView === 'admin-panel' && <AdminDashboardView />}
        {activeView === 'customer-email' && <CustomerEmailView />}
      </main>
    </div>
  );
}
