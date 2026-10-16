import React from 'react';
import { Phone, MapPin, MessageCircle, Clock } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

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
    <footer className="bg-[#000000] border-t border-[#1e1e1e] pt-20 pb-14">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-10 pb-16 border-b border-[#1e1e1e]">
          {/* Column 1 - Brand & Philosophy */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/images/punto-fino/logo.png"
                alt="Punto Fino Barbería"
                className="w-12 h-12 object-contain rounded-none border border-[#333333] p-1 bg-[#0d0d0d] shadow-md"
              />
              <div>
                <h3 className="font-sans text-lg font-bold tracking-[0.2em] uppercase text-white leading-tight">
                  Punto Fino
                </h3>
                <span className="font-mono text-xs text-[#B89758] tracking-[0.22em] font-semibold uppercase block mt-0.5">
                  Barbería · Cali
                </span>
              </div>
            </div>
            <p className="text-[#999999] text-sm leading-relaxed max-w-sm font-sans">
              Barbería de barrio en Santiago de Cali dedicada al buen oficio: degradados milimétricos, rituales de barba con toalla caliente y atención cercana.
            </p>
          </div>

          {/* Column 2 - Navigation */}
          <div className="space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-[0.22em] text-[#B89758] font-bold">
              Explorar
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <a
                  href="#servicios"
                  onClick={(e) => handleNavClick(e, 'servicios')}
                  className="text-[#888888] hover:text-white transition-colors uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Cortes & Servicios
                </a>
              </li>
              <li>
                <a
                  href="#barberos"
                  onClick={(e) => handleNavClick(e, 'barberos')}
                  className="text-[#888888] hover:text-white transition-colors uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Los Barberos
                </a>
              </li>
              <li>
                <a
                  href="#reservar"
                  onClick={(e) => handleNavClick(e, 'reservar')}
                  className="text-[#B89758] hover:text-white transition-colors uppercase tracking-wider text-[11px] cursor-pointer font-bold"
                >
                  Agendar Cita en Línea
                </a>
              </li>
              <li>
                <Link to="/login" className="text-[#888888] hover:text-white transition-colors uppercase tracking-wider text-[11px]">
                  Acceso Barberos & Administración
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Schedule */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#B89758] font-bold flex items-center gap-1.5">
              <Clock size={13} className="text-[#B89758]" /> Horarios de Atención
            </h4>
            <ul className="space-y-2 text-xs font-sans text-[#888888]">
              <li className="flex justify-between max-w-[240px] pb-1 border-b border-[#1e1e1e]">
                <span>Lunes</span>
                <span className="font-mono text-white">08:00 - 20:30</span>
              </li>
              <li className="flex justify-between max-w-[240px] pb-1 border-b border-[#1e1e1e]">
                <span>Martes a Sábado</span>
                <span className="font-mono text-white">09:00 - 20:30</span>
              </li>
              <li className="flex justify-between max-w-[240px] pb-1 border-b border-[#1e1e1e]">
                <span>Domingos</span>
                <span className="font-mono text-[#B89758] font-bold">09:00 - 16:00</span>
              </li>
              <li className="text-[10px] text-[#666666] pt-1 uppercase tracking-wider">
                Atención con cita previa online
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact & Location */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#B89758] font-bold flex items-center gap-1.5">
              <MapPin size={13} className="text-[#B89758]" /> Ubicación & Citas
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-[#888888]">
              <li>
                <span className="text-white block font-medium uppercase tracking-wider text-[11px]">Sede Tequendama</span>
                <span className="text-[#aaaaaa] inline-block">
                  Calle 5ta #38-24 · Santiago de Cali, Valle del Cauca
                </span>
              </li>
              <li>
                <a 
                  href="tel:+573122398964" 
                  className="font-mono hover:text-[#B89758] transition-colors flex items-center gap-2 text-white font-bold"
                >
                  <Phone size={13} className="text-[#B89758]" /> +57 312 239 8964
                </a>
              </li>
              <li className="pt-1">
                <a
                  href="https://wa.me/573122398964?text=Hola,%20me%20gustar%C3%ADa%20agendar%20una%20cita%20en%20Punto%20Fino"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#B89758] hover:text-white underline underline-offset-4 flex items-center gap-1.5 transition-colors font-bold"
                >
                  <MessageCircle size={14} /> WhatsApp Barbería
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-sans text-[#666666]">
          <p className="font-mono text-[11px]">© {new Date().getFullYear()} PUNTO FINO BARBERÍA · CALI, VALLE DEL CAUCA. TODOS LOS DERECHOS RESERVADOS.</p>
          <div className="flex items-center gap-3">
            <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-[#888888]">
              Oficio de Barrio · Corte Fino · Buena Vibra
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
