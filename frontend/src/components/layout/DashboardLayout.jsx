import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import { Bell, X, Repeat } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';

export default function DashboardLayout() {
  const { user, isAdmin } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  const userIsAdmin = isAdmin();
  const isBarberView = location.pathname.startsWith('/barber');

  // Cargar notificaciones reales del panel desde el backend
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/admin/notifications');
      if (data?.data?.notifications) {
        setNotifications(data.data.notifications);
      }
    } catch (e) {
      // Silencioso en caso de desconexión temporal
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {}
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getPageTitle = (path) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 1) {
      if (parts[0] === 'admin') return 'Resumen del día, Caja, Horarios & Nómina';
      if (parts[0] === 'barber') return 'Mi Silla Hoy & Comisiones';
      return 'Panel de Gestión';
    }
    const lastPart = parts[parts.length - 1];
    switch (lastPart) {
      case 'citas':
        return 'Agenda Maestra & Reasignación';
      case 'agenda':
        return 'Mi Agenda & Bloqueos de Horario';
      case 'servicios':
        return 'Catálogo de Servicios & Productos Rolda';
      case 'barberos':
        return 'Equipo de Barberos & Días de Descanso';
      case 'usuarios':
        return 'Directorio de Clientes & Mensajes Web';
      case 'perfil':
        return 'Mi Perfil Profesional';
      default:
        return 'Panel de Gestión';
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#F7F5F0] flex flex-col md:flex-row antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Encabezado Superior Independiente (Sin Navbar de web pública ni cajas de iniciales) */}
        <header className="h-16 border-b border-white/10 bg-[#111215]/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3 truncate mr-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <h1 className="text-sm sm:text-base font-display font-bold text-white truncate">
              {getPageTitle(location.pathname)}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[11px] font-sans font-semibold rounded bg-[#18191E] border border-white/10 text-[#B89758]">
              {userIsAdmin && !isBarberView
                ? 'Vista Administrador'
                : 'Vista Barbero'}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Botón rápido de cambio de vista para Juan David (Admin + Barbero) */}
            {userIsAdmin && (
              <button
                type="button"
                onClick={() => navigate(isBarberView ? '/admin' : '/barber')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18191E] hover:bg-[#22242B] border border-[#B89758]/40 text-xs font-sans font-semibold text-[#B89758] hover:text-white transition-all cursor-pointer"
                title="Cambiar entre Vista Administrador y Vista Barbero"
              >
                <Repeat size={13} />
                <span className="hidden sm:inline">
                  {isBarberView ? 'Ir a Vista Administrador' : 'Ir a Mi Silla (Barbero)'}
                </span>
              </button>
            )}

            {/* Campana de Notificaciones Reales del Panel */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative p-2 rounded-md border border-white/10 bg-[#18191E] text-[#cccccc] hover:text-white transition-colors cursor-pointer"
                aria-label="Abrir notificaciones del panel"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#E15233] text-white font-sans text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111215] border border-white/15 rounded-md shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/10 bg-[#16181D] flex items-center justify-between">
                      <span className="text-xs font-sans font-semibold text-white">
                        Notificaciones del panel
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="text-[#9B988F] hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-[#9B988F] text-xs font-sans">
                          No hay notificaciones nuevas en este momento.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              markAsRead(item.id);
                              if (item.linkUrl) {
                                navigate(item.linkUrl);
                                setShowNotifications(false);
                              }
                            }}
                            className={`p-3.5 transition-colors cursor-pointer ${
                              item.isRead
                                ? 'bg-transparent text-[#9B988F]'
                                : 'bg-[#18191E] text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-sans font-semibold text-white">
                                {item.title}
                              </p>
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#E15233] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs font-sans text-[#cccccc] mt-1 leading-relaxed">
                              {item.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Identidad Tipográfica del Usuario (Sin Foto ni Caja de Iniciales) */}
            <div className="hidden sm:flex flex-col text-right pl-3 border-l border-white/10">
              <span className="text-xs font-sans font-semibold text-white leading-tight">
                {user?.name || 'Personal Punto Fino'}
              </span>
              <span className="text-[11px] font-sans text-[#B89758]">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Área Principal de Contenido */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 bg-[#0b0c0e]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomBar />
    </div>
  );
}
