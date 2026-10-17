import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, LogOut, Settings, LayoutDashboard, Mail, MapPin, ArrowRight, Clock } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useAppStore from '../../store/useAppStore';
import { BUSINESS_CONFIG, getShopStatus } from '../../config/businessConfig';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [shopStatus, setShopStatus] = useState(() => getShopStatus());
  const { user, isAuthenticated, logout, isAdmin, isBarber } = useAuthStore();
  const { unreadCount } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setShopStatus(getShopStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const getDashboardLink = () => {
    if (isAdmin()) return '/admin';
    if (isBarber()) return '/barber';
    return '/';
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setIsOpen(false);
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

  const navLinks = [
    { label: 'Cortes & Servicios', targetId: 'servicios' },
    { label: 'Lo que usamos contigo', targetId: 'bebidas' },
    { label: 'Los Barberos', targetId: 'barberos' },
    { label: 'Cómo llegar & Contacto', targetId: 'como-llegar' },
    { label: 'Opiniones', targetId: 'resenas' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#111215]">
      {/* Franja Superior — Dirección Oficial, Estado en Tiempo Real y Horarios */}
      <div className="bg-[#0b0c0e] text-[#9B988F] text-xs font-sans py-2 px-4 sm:px-8 lg:px-12 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Ubicación Oficial */}
          <div className="flex items-center gap-3 text-[#EFECE4] truncate">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin size={13} className="text-[#E15233] shrink-0" />
              <span className="font-sans text-xs tracking-normal truncate">
                {BUSINESS_CONFIG.location.shortAddress}
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${
                shopStatus.isOpen
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/5 text-[#9B988F] border border-white/10'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  shopStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-[#6A6862]'
                }`}
              />
              {shopStatus.label}
            </span>
          </div>

          {/* Horario Oficial y Canal de Contacto Web */}
          <div className="flex items-center gap-5 shrink-0">
            <span className="hidden xl:inline font-sans text-[11px] text-[#9B988F] tabular-nums">
              {BUSINESS_CONFIG.hours.summaryShort}
            </span>
            <a
              href="#contacto"
              onClick={(e) => handleNavClick(e, 'contacto')}
              className="flex items-center gap-1.5 font-sans text-xs text-[#F7F5F0] hover:text-[#B89758] transition-colors cursor-pointer"
            >
              <Mail size={13} className="text-[#B89758] shrink-0" />
              <span>Contacto en línea</span>
            </a>
          </div>
        </div>
      </div>

      {/* Barra Principal de Navegación */}
      <div className="bg-[#111215]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo e Identidad de Marca */}
            <Link to="/" className="flex items-center gap-3.5 group shrink-0">
              <div className="w-11 h-11 rounded-md bg-black border border-white/10 flex items-center justify-center p-1 overflow-hidden group-hover:border-[#E15233] transition-colors shadow-md">
                <img
                  src="/images/punto-fino/logo.png"
                  alt="Punto Fino"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-2xl text-[#F7F5F0] tracking-tight leading-none group-hover:text-[#E15233] transition-colors">
                  Punto Fino
                </span>
                <span className="text-[11px] text-[#B89758] font-sans tracking-normal mt-1">
                  Villacolombia · Cali
                </span>
              </div>
            </Link>

            {/* Menú de Navegación en Fila Única Limpia */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((link) => (
                <a
                  key={link.targetId}
                  href={`#${link.targetId}`}
                  onClick={(e) => handleNavClick(e, link.targetId)}
                  className={`px-3.5 py-2 text-xs font-sans font-medium transition-colors cursor-pointer ${
                    location.pathname === '/' && location.hash === `#${link.targetId}`
                      ? 'text-white font-semibold'
                      : 'text-[#aaaaaa] hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Acciones del Header */}
            <div className="flex items-center gap-4 shrink-0">
              {isAuthenticated ? (
                <>
                  {/* Notificaciones */}
                  <Link
                    to={getDashboardLink()}
                    className="relative p-2 text-[#888888] hover:text-white transition-all cursor-pointer"
                    aria-label="Notificaciones"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#E15233] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Menú de Usuario (Tipográfico - Sin Cajas de Iniciales ni Fotos) */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-white/10 hover:border-white/30 bg-[#18191E] transition-all cursor-pointer"
                    >
                      <div className="text-left">
                        <p className="text-xs font-sans font-semibold text-white leading-none truncate max-w-[140px]">
                          {user?.name}
                        </p>
                        <p className="text-[10px] text-[#B89758] font-sans leading-none mt-1">
                          {isAdmin() ? 'Administrador' : 'Barbero'}
                        </p>
                      </div>
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="absolute right-0 mt-2 w-56 bg-[#18191E] border border-white/10 rounded-md shadow-2xl overflow-hidden z-50"
                        >
                          <div className="p-3 border-b border-white/10">
                            <p className="font-sans font-medium text-white text-xs leading-tight">{user?.name}</p>
                            <p className="text-[11px] text-[#9B988F] font-sans truncate mt-0.5">{user?.email}</p>
                          </div>
                          <div className="p-1 space-y-0.5 font-sans">
                            <Link
                              to={getDashboardLink()}
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#cccccc] hover:text-white hover:bg-white/5 rounded transition-all"
                            >
                              <LayoutDashboard size={14} />
                              Ir a mi panel
                            </Link>
                            {isAdmin() && (
                              <Link
                                to="/barber"
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#B89758] hover:text-white hover:bg-white/5 rounded transition-all"
                              >
                                <Clock size={14} />
                                Vista Barbero (Mi Silla)
                              </Link>
                            )}
                          </div>
                          <div className="p-1 border-t border-white/10">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-sans text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-all cursor-pointer text-left"
                            >
                              <LogOut size={14} />
                              Cerrar sesión
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 sm:gap-6">
                  <Link
                    to="/login"
                    className="font-sans text-xs text-[#9B988F] hover:text-white transition-colors"
                  >
                    Acceso personal
                  </Link>

                  <a
                    href="#reservar"
                    onClick={(e) => handleNavClick(e, 'reservar')}
                    className="bg-white hover:bg-[#EFECE4] text-black font-sans font-semibold text-xs px-5 py-2.5 rounded-md transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Agenda tu cita</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              )}

              {/* Botón de Menú Móvil */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-[#888888] hover:text-white rounded-md cursor-pointer"
                aria-label="Abrir menú"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#111215] border-b border-white/10 overflow-hidden"
          >
            <div className="px-6 py-5 space-y-3 font-sans">
              {navLinks.map((link) => (
                <a
                  key={link.targetId}
                  href={`#${link.targetId}`}
                  onClick={(e) => handleNavClick(e, link.targetId)}
                  className="block text-sm text-[#cccccc] hover:text-white py-2 cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                <a
                  href="#reservar"
                  onClick={(e) => handleNavClick(e, 'reservar')}
                  className="w-full bg-white text-black font-semibold text-xs py-3 px-4 rounded-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Agenda tu cita</span>
                  <ArrowRight size={13} />
                </a>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-center text-xs text-[#9B988F] hover:text-white py-2"
                  >
                    Acceso personal
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}