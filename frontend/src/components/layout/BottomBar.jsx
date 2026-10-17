import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, Scissors, User, LayoutDashboard, Sparkles, Users } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const BottomBar = () => {
  const { isAdmin } = useAuthStore();
  const location = useLocation();
  const userIsAdmin = isAdmin();
  const isBarberView = location.pathname.startsWith('/barber');

  const links =
    userIsAdmin && !isBarberView
      ? [
          { icon: LayoutDashboard, label: 'Resumen', path: '/admin' },
          { icon: Calendar, label: 'Agenda', path: '/admin/citas' },
          { icon: Scissors, label: 'Barberos', path: '/admin/barberos' },
          { icon: Sparkles, label: 'Catálogo', path: '/admin/servicios' },
          { icon: Users, label: 'Clientes', path: '/admin/usuarios' },
        ]
      : [
          { icon: LayoutDashboard, label: 'Mi Silla', path: '/barber' },
          { icon: Calendar, label: 'Agenda', path: '/barber/agenda' },
          { icon: User, label: 'Perfil', path: '/barber/perfil' },
        ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111215] border-t border-white/10 pb-safe z-40">
      <div className="flex justify-around items-center h-16">
        {links.map((link, idx) => (
          <NavLink
            key={idx}
            to={link.path}
            end={link.path === '/barber' || link.path === '/admin'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors ${
                isActive
                  ? 'text-[#B89758] bg-[#18191E] border-t-2 border-[#B89758]'
                  : 'text-[#9B988F] hover:text-white border-t-2 border-transparent'
              }`
            }
          >
            <link.icon className="w-4 h-4 mb-1" />
            <span className="text-[11px] font-sans font-medium">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomBar;
