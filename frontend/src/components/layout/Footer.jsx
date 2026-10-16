import React from 'react';
import { Phone, MapPin, MessageCircle, Clock } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-10 pb-16 border-b border-white/10">
          
          {/* Columna 1 - Marca y Filosofía */}
          <div className="md:col-span-1 space-y-4">
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
            <p className="text-[#9B988F] text-xs sm:text-sm leading-relaxed max-w-sm font-sans">
              Barbería en Santiago de Cali dedicada al buen oficio: degradados milimétricos, rituales tradicionales de barba con toalla caliente y atención cercana.
            </p>
          </div>

          {/* Columna 2 - Navegación */}
          <div className="space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#B89758] font-bold">
              Explorar
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
                  Cómo llegar (Sede Villacolombia)
                </a>
              </li>
              <li>
                <a
                  href="#reservar"
                  onClick={(e) => handleNavClick(e, 'reservar')}
                  className="text-[#E15233] hover:text-white transition-colors font-semibold"
                >
                  Agendar Cita en Línea
                </a>
              </li>
              <li className="pt-1">
                <Link to="/login" className="text-[#888888] hover:text-white transition-colors text-[11px]">
                  Acceso personal & administración
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3 - Horarios */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#B89758] font-bold flex items-center gap-1.5">
              <Clock size={13} className="text-[#B89758]" /> Horarios de Atención
            </h4>
            <ul className="space-y-2 text-xs font-sans text-[#aaaaaa]">
              <li className="flex justify-between max-w-[240px] pb-1 border-b border-white/5">
                <span>Lunes</span>
                <span className="font-mono text-white">{BUSINESS_CONFIG.hours.monday}</span>
              </li>
              <li className="flex justify-between max-w-[240px] pb-1 border-b border-white/5">
                <span>Martes a Sábado</span>
                <span className="font-mono text-white">{BUSINESS_CONFIG.hours.tuesdayToSaturday}</span>
              </li>
              <li className="flex justify-between max-w-[240px] pb-1 border-b border-white/5">
                <span>Domingos</span>
                <span className="font-mono text-[#B89758] font-bold">{BUSINESS_CONFIG.hours.sunday}</span>
              </li>
              <li className="text-[11px] text-[#6A6862] pt-1">
                Atención puntual con cita previa online
              </li>
            </ul>
          </div>

          {/* Columna 4 - Ubicación & Contacto */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#B89758] font-bold flex items-center gap-1.5">
              <MapPin size={13} className="text-[#E15233]" /> Sede Única & Contacto
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-[#aaaaaa]">
              <li>
                <span className="text-white block font-medium">Sede Villacolombia</span>
                <span className="text-[#888888] inline-block">
                  {BUSINESS_CONFIG.location.address} · {BUSINESS_CONFIG.location.city}
                </span>
              </li>
              <li>
                <a 
                  href={`tel:${BUSINESS_CONFIG.contact.phoneRaw}`} 
                  className="font-mono hover:text-[#B89758] transition-colors flex items-center gap-2 text-white font-bold"
                >
                  <Phone size={13} className="text-[#B89758]" /> {BUSINESS_CONFIG.contact.phone}
                </a>
              </li>
              <li className="pt-1">
                <a
                  href={BUSINESS_CONFIG.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#25D366] hover:text-white underline underline-offset-4 flex items-center gap-1.5 transition-colors font-semibold"
                >
                  <MessageCircle size={14} /> WhatsApp Directo
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-sans text-[#6A6862]">
          <p className="font-mono text-[11px]">
            © {new Date().getFullYear()} PUNTO FINO · {BUSINESS_CONFIG.location.city.toUpperCase()}, COLOMBIA. TODOS LOS DERECHOS RESERVADOS.
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
