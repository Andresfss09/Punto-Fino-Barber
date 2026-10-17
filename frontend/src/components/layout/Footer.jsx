import React, { useState, useEffect } from 'react';
import { MapPin, Mail, Clock, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BUSINESS_CONFIG, OFFICIAL_SCHEDULES, formatTime12h, getShopStatus } from '../../config/businessConfig';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shopStatus, setShopStatus] = useState(() => getShopStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setShopStatus(getShopStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${targetId}`);
      }
    } else {
      navigate(`/#${targetId}`);
    }
  };

  return (
    <footer className="bg-[#0b0c0e] border-t border-white/10 pt-20 pb-14 text-white">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-16 border-b border-white/10">
          {/* Columna 1 - Marca y Filosofía (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/images/punto-fino/logo.png"
                alt="Punto Fino"
                className="w-12 h-12 object-contain rounded-md border border-white/15 p-1 bg-[#111215] shadow-md"
              />
              <div>
                <h3 className="font-display text-xl font-bold text-white leading-tight">
                  Punto Fino
                </h3>
                <span className="font-sans text-xs text-[#B89758] font-medium block mt-0.5">
                  Villacolombia · Cali
                </span>
              </div>
            </div>
            <p className="text-[#9B988F] text-xs sm:text-sm leading-relaxed font-sans">
              Barbería en Santiago de Cali dedicada al buen oficio: cortes clásicos, degradados limpios, rituales tradicionales de barba y atención puntual con cita previa.
            </p>
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-sans font-medium ${
                  shopStatus.isOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/5 text-[#9B988F] border border-white/10'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    shopStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-[#6A6862]'
                  }`}
                />
                {shopStatus.label} · {shopStatus.detail}
              </span>
            </div>
          </div>

          {/* Columna 2 - Navegación (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-sans text-xs font-semibold text-[#B89758]">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs font-sans">
              <li>
                <a
                  href="#servicios"
                  onClick={(e) => handleNavClick(e, 'servicios')}
                  className="text-[#aaaaaa] hover:text-white transition-colors"
                >
                  Cortes & Servicios
                </a>
              </li>
              <li>
                <a
                  href="#bebidas"
                  onClick={(e) => handleNavClick(e, 'bebidas')}
                  className="text-[#aaaaaa] hover:text-white transition-colors"
                >
                  Lo que usamos contigo
                </a>
              </li>
              <li>
                <a
                  href="#barberos"
                  onClick={(e) => handleNavClick(e, 'barberos')}
                  className="text-[#aaaaaa] hover:text-white transition-colors"
                >
                  Los Barberos
                </a>
              </li>
              <li>
                <a
                  href="#como-llegar"
                  onClick={(e) => handleNavClick(e, 'como-llegar')}
                  className="text-[#aaaaaa] hover:text-white transition-colors"
                >
                  Cómo llegar & Contacto
                </a>
              </li>
              <li>
                <a
                  href="#reservar"
                  onClick={(e) => handleNavClick(e, 'reservar')}
                  className="text-[#E15233] hover:text-white transition-colors font-semibold"
                >
                  Agenda tu cita
                </a>
              </li>
              <li className="pt-1">
                <Link to="/login" className="text-[#88888F] hover:text-white transition-colors text-[11px]">
                  Acceso personal & administración
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3 - Horarios Oficiales de los 7 días (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-sans text-xs font-semibold text-[#B89758] flex items-center gap-1.5">
              <Clock size={13} className="text-[#B89758]" /> Horarios Oficiales (Abierto los 7 días)
            </h4>
            <ul className="space-y-1.5 text-xs font-sans text-[#aaaaaa]">
              {OFFICIAL_SCHEDULES.map((sched) => {
                const isToday = shopStatus.todayDayOfWeek === sched.dayOfWeek;
                return (
                  <li
                    key={sched.dayOfWeek}
                    className={`flex justify-between items-center py-1 px-2.5 rounded ${
                      isToday
                        ? 'bg-[#18191E] border border-[#B89758]/40 text-white font-semibold'
                        : 'border-b border-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{sched.dayName}</span>
                      {isToday && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#B89758]/20 text-[#B89758] font-semibold">
                          Hoy
                        </span>
                      )}
                    </span>
                    <span className={`tabular-nums ${isToday ? 'text-[#F7F5F0]' : 'text-[#cccccc]'}`}>
                      {formatTime12h(sched.openTime)} a {formatTime12h(sched.closeTime)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Columna 4 - Sede Única & Canales Oficiales (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-sans text-xs font-semibold text-[#B89758] flex items-center gap-1.5">
              <MapPin size={13} className="text-[#E15233]" /> Sede Única & Contacto
            </h4>
            <ul className="space-y-3 text-xs font-sans text-[#aaaaaa]">
              <li>
                <span className="text-white block font-medium">Sede Villacolombia</span>
                <span className="text-[#9B988F] inline-block mt-0.5">
                  {BUSINESS_CONFIG.location.address} · {BUSINESS_CONFIG.location.city}, {BUSINESS_CONFIG.location.department}
                </span>
              </li>
              <li>
                <span className="text-[#9B988F] block text-[11px] mb-0.5">Correo electrónico oficial:</span>
                <a
                  href={`mailto:${BUSINESS_CONFIG.contact.email}`}
                  className="hover:text-[#B89758] transition-colors flex items-center gap-2 text-white font-medium"
                >
                  <Mail size={13} className="text-[#B89758]" /> {BUSINESS_CONFIG.contact.email}
                </a>
              </li>
              <li>
                <a
                  href="#contacto"
                  onClick={(e) => handleNavClick(e, 'contacto')}
                  className="text-xs text-[#B89758] hover:text-white underline underline-offset-4 inline-flex items-center gap-1.5 transition-colors font-medium"
                >
                  Escribir mediante el formulario web →
                </a>
              </li>
              <li className="pt-2 border-t border-white/5 text-[11px] text-[#6A6862] leading-relaxed">
                <ShieldCheck size={12} className="inline mr-1 text-[#9B988F]" />
                Habeas Data (Ley 1581 de 2012): puedes ejercer tus derechos de conocer, actualizar o suprimir tus datos escribiendo a {BUSINESS_CONFIG.contact.privacyEmail} o mediante el formulario de contacto de la plataforma.
              </li>
            </ul>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-sans text-[#6A6862]">
          <p className="text-[11px]">
            © {new Date().getFullYear()} Punto Fino · {BUSINESS_CONFIG.location.city}, Colombia. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs text-[#9B988F]">
              Corte & Cuidado Masculino · Villacolombia · Cali
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
