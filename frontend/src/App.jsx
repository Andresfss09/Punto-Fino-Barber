import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from './store/useAuthStore';
import DashboardLayout from './components/layout/DashboardLayout';
import Footer from './components/layout/Footer';
import PageTransition from './components/ui/PageTransition';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';

import BarberDashboard from './pages/barber/BarberDashboard';
import BarberSchedule from './pages/barber/BarberSchedule';
import BarberProfile from './pages/barber/BarberProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminServices from './pages/admin/AdminServices';
import AdminBarbers from './pages/admin/AdminBarbers';
import AdminUsers from './pages/admin/AdminUsers';
import PrototypeHub from './pages/prototypes/PrototypeHub';

// Rutas protegidas por rol con soporte dual para Juan David (ADMIN + BARBER)
function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const role = (user.role || '').toUpperCase();
  const isUserAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isUserBarber = role === 'BARBER' || role === 'BARBERO' || isUserAdmin;

  if (requireAdmin && !isUserAdmin) {
    // Si un barbero intenta entrar a /admin, enviarlo a su propio panel /barber
    return <Navigate to="/barber" replace />;
  }

  if (!requireAdmin && !isUserBarber) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Web Pública */}
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
              <Footer />
            </PageTransition>
          }
        />
        <Route path="/prototipos" element={<PrototypeHub />} />
        <Route path="/design-system" element={<Navigate to="/prototipos" replace />} />
        <Route
          path="/login"
          element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          }
        />
        <Route path="/register" element={<Navigate to="/#reservar" replace />} />
        <Route
          path="/reservar"
          element={
            <PageTransition>
              <BookingPage />
              <Footer />
            </PageTransition>
          }
        />

        {/* Rutas de cliente redirigidas a la web pública */}
        <Route path="/cliente/*" element={<Navigate to="/" replace />} />
        <Route path="/cliente" element={<Navigate to="/" replace />} />

        {/* Paneles Independientes de Gestión (Sin Navbar ni Footer de la web pública) */}
        <Route element={<DashboardLayout />}>
          {/* Panel del Barbero (/barber) */}
          <Route
            path="/barber"
            element={
              <PrivateRoute requireAdmin={false}>
                <PageTransition>
                  <BarberDashboard />
                </PageTransition>
              </PrivateRoute>
            }
          />
          <Route path="/barbero" element={<Navigate to="/barber" replace />} />
          <Route path="/barber/dashboard" element={<Navigate to="/barber" replace />} />
          <Route
            path="/barber/agenda"
            element={
              <PrivateRoute requireAdmin={false}>
                <PageTransition>
                  <BarberSchedule />
                </PageTransition>
              </PrivateRoute>
            }
          />
          <Route path="/barbero/agenda" element={<Navigate to="/barber/agenda" replace />} />
          <Route path="/barber/schedule" element={<Navigate to="/barber/agenda" replace />} />
          <Route
            path="/barber/perfil"
            element={
              <PrivateRoute requireAdmin={false}>
                <PageTransition>
                  <BarberProfile />
                </PageTransition>
              </PrivateRoute>
            }
          />
          <Route path="/barbero/perfil" element={<Navigate to="/barber/perfil" replace />} />

          {/* Panel del Administrador (/admin) */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin={true}>
                <PageTransition>
                  <AdminDashboard />
                </PageTransition>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/citas"
            element={
              <PrivateRoute requireAdmin={true}>
                <PageTransition>
                  <AdminAppointments />
                </PageTransition>
              </PrivateRoute>
            }
          />
          <Route path="/admin/appointments" element={<Navigate to="/admin/citas" replace />} />
          <Route
            path="/admin/servicios"
            element={
              <PrivateRoute requireAdmin={true}>
                <PageTransition>
                  <AdminServices />
                </PageTransition>
              </PrivateRoute>
            }
          />
          <Route path="/admin/services" element={<Navigate to="/admin/servicios" replace />} />
          <Route
            path="/admin/barberos"
            element={
              <PrivateRoute requireAdmin={true}>
                <PageTransition>
                  <AdminBarbers />
                </PageTransition>
              </PrivateRoute>
            }
          />
          <Route path="/admin/barbers" element={<Navigate to="/admin/barberos" replace />} />
          <Route
            path="/admin/usuarios"
            element={
              <PrivateRoute requireAdmin={true}>
                <PageTransition>
                  <AdminUsers />
                </PageTransition>
              </PrivateRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}