import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Calendar,
  Scissors,
  User,
  LayoutDashboard,
  Sparkles,
  Users,
  LogOut,
  Repeat,
  ExternalLink,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../services/authService';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const userIsAdmin = isAdmin();
  const isBarberView = location.pathname.startsWith('/barber');

  const adminLinks = [
    { icon: LayoutDashboard, label: 'Resumen, Caja & Nómina', path: '/admin' },
    { icon: Calendar, label: 'Agenda Maestra', path: '/admin/citas' },
    { icon: Scissors, label: 'Barberos & Descansos', path: '/admin/barberos' },
    { icon: Sparkles, label: 'Servicios & Productos', path: '/admin/servicios' },
    { icon: Users, label: 'Clientes & Mensajes', path: '/admin/usuarios' },
  ];

  const barberLinks = [
    { icon: LayoutDashboard, label: 'Mi Silla Hoy & Ingresos', path: '/barber' },
    { icon: Calendar, label: 'Mi Agenda Semanal', path: '/barber/agenda' },
    { icon: User, label: 'Mi Perfil & Descanso', path: '/barber/perfil' },
  ];

  const links = userIsAdmin && !isBarberView ? adminLinks : barberLinks;

  const handleLogout = async () => {
    await authService.logout();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-[#111215] border-r border-white/10 flex-shrink-0 z-40 relative">
      {/* Marca Punto Fino */}
      <div className="h-16 py-3 flex items-center justify-between px-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/images/punto-fino/logo.png"
            alt="Punto Fino"
            className="w-8 h-8 object-contain rounded border border-white/15 p-0.5 bg-[#0b0c0e]"
          />
          <div>
            <h2 className="font-display font-bold text-sm text-white leading-none">
              Punto Fino
            </h2>
            <span className="text-[11px] text-[#B89758] font-sans block mt-0.5">
              {userIsAdmin && !isBarberView ? 'Consola Administrador' : 'Panel del Barbero'}
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Vista Dual para Juan David (Administrador y Barbero) */}
      {userIsAdmin && (
        <div className="p-3 border-b border-white/10 bg-[#16181D]">
          <span className="text-[10px] font-sans font-semibold text-[#9B988F] block mb-2 px-1">
            Cambiar modo de trabajo ({user?.name?.split(' ')[0]})
          </span>
          <div className="grid grid-cols-2 gap-1.5 bg-[#0b0c0e] p-1 rounded-md border border-white/10">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className={`py-1.5 px-2 rounded text-[11px] font-sans font-semibold transition-all cursor-pointer ${
                !isBarberView
                  ? 'bg-[#E15233] text-white shadow-sm'
                  : 'text-[#9B988F] hover:text-white'
              }`}
            >
              Administrador
            </button>
            <button
              type="button"
              onClick={() => navigate('/barber')}
              className={`py-1.5 px-2 rounded text-[11px] font-sans font-semibold transition-all cursor-pointer ${
                isBarberView
                  ? 'bg-[#B89758] text-black shadow-sm'
                  : 'text-[#9B988F] hover:text-white'
              }`}
            >
              Mi Silla
            </button>
          </div>
        </div>
      )}

      {/* Enlaces de Navegación */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {links.map((link, idx) => (
          <NavLink
            key={idx}
            to={link.path}
            end={link.path === '/barber' || link.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center px-3.5 py-2.5 rounded-md text-xs font-sans font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#18191E] border border-[#B89758]/40 text-white font-semibold shadow-sm'
                  : 'text-[#9B988F] hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <link.icon className="w-4 h-4 mr-3 flex-shrink-0 text-[#B89758]" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Pie del Sidebar: Ir a web pública y Cerrar sesión */}
      <div className="p-3 border-t border-white/10 space-y-1.5">
        <Link
          to="/"
          className="flex items-center px-3.5 py-2 rounded-md text-xs font-sans text-[#9B988F] hover:text-white hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-3 flex-shrink-0" />
          <span>Ver web pública</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center px-3.5 py-2.5 rounded-md text-xs font-sans font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors w-full text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
