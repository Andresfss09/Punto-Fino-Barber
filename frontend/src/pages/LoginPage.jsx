import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft, KeyRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import useAuthStore from '../store/useAuthStore';
import { BUSINESS_CONFIG } from '../config/businessConfig';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // Estado de recuperación de contraseña por correo
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryData, setRecoveryData] = useState({
    email: '',
    code: '',
    newPassword: '',
  });
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      const user = response.user;
      setAuth(user, response.token);

      const firstName = user?.name ? user.name.split(' ')[0] : 'Colaborador';
      toast.success(`Bienvenido a Punto Fino, ${firstName}`);

      const normalizedRole = (user?.role || '').toUpperCase();
      if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN') {
        navigate('/admin', { replace: true });
      } else if (normalizedRole === 'BARBER' || normalizedRole === 'BARBERO') {
        navigate('/barber', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Credenciales incorrectas. Verifica tu correo y contraseña.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRecoveryCode = async (e) => {
    e.preventDefault();
    if (!recoveryData.email.trim()) {
      toast.error('Ingresa tu correo electrónico registrado.');
      return;
    }
    setRecoveryLoading(true);
    try {
      const res = await authService.forgotPassword(recoveryData.email.trim().toLowerCase());
      if (res?.data?.devCode) {
        setRecoveryData((prev) => ({ ...prev, code: res.data.devCode }));
      }
      toast.success(res?.message || 'Código enviado a tu correo electrónico.');
      setRecoveryStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar el código.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!recoveryData.code || recoveryData.newPassword.length < 6) {
      toast.error('Ingresa el código de 6 dígitos y una nueva contraseña de al menos 6 caracteres.');
      return;
    }
    setRecoveryLoading(true);
    try {
      const res = await authService.resetPassword({
        email: recoveryData.email.trim().toLowerCase(),
        code: recoveryData.code.trim(),
        newPassword: recoveryData.newPassword,
      });
      toast.success(res?.message || 'Contraseña actualizada exitosamente.');
      setShowRecoveryModal(false);
      setRecoveryStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Código inválido o expirado.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#F7F5F0] flex flex-col md:grid md:grid-cols-12">
      {/* Columna Izquierda: Imagen de Oficio & Marca */}
      <div className="hidden md:flex md:col-span-5 lg:col-span-6 relative flex-col justify-between p-10 lg:p-14 overflow-hidden border-r border-white/10 bg-black">
        <div className="absolute inset-0">
          <img
            src="/images/punto-fino/ritual-vapor-facial.png"
            alt="Oficio en Punto Fino Cali"
            className="w-full h-full object-cover filter brightness-[0.45] contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-black/40 to-[#0b0c0e]/80" />
        </div>

        {/* Encabezado Izquierdo */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              to="/"
              className="w-12 h-12 rounded-md bg-black/80 border border-white/15 p-1 flex items-center justify-center shadow-lg hover:border-[#E15233] transition-colors"
            >
              <img
                src="/images/punto-fino/logo.png"
                alt="Punto Fino"
                className="w-full h-full object-contain"
              />
            </Link>
            <div>
              <h2 className="font-display font-bold text-2xl text-white tracking-tight leading-none">
                Punto Fino
              </h2>
              <span className="font-sans text-xs text-[#B89758] font-medium block mt-1">
                {BUSINESS_CONFIG.location.neighborhood} · Cali
              </span>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-[#cccccc] hover:text-white bg-black/50 border border-white/10 px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Volver a la web</span>
          </Link>
        </div>

        {/* Cita Editorial del Oficio */}
        <div className="relative z-10 space-y-4 max-w-lg">
          <span className="font-sans text-xs text-[#E15233] font-semibold block">
            Portal exclusivo del equipo
          </span>
          <blockquote className="font-display text-2xl lg:text-3xl font-normal text-[#F7F5F0] leading-snug">
            “El verdadero oficio se nota en el detalle milimétrico, el respeto por el tiempo del cliente y la calidez en cada silla.”
          </blockquote>
          <p className="font-sans text-xs text-[#9B988F]">
            Consola de administración, agenda diaria por barbero, liquidación de comisiones y catálogo.
          </p>
        </div>

        {/* Footer Izquierdo */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#9B988F] font-sans border-t border-white/10 pt-4">
          <span>{BUSINESS_CONFIG.location.address} · Villacolombia</span>
          <span>© {new Date().getFullYear()} Punto Fino</span>
        </div>
      </div>

      {/* Columna Derecha: Formulario Unificado Limpio y Accesible */}
      <div className="flex-1 md:col-span-7 lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Enlace de regreso en móvil */}
          <div className="flex items-center justify-between md:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#9B988F] hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Volver a la web</span>
            </Link>
            <div className="w-8 h-8 rounded bg-black border border-white/10 p-0.5">
              <img
                src="/images/punto-fino/logo.png"
                alt="Punto Fino"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Título y Presentación del Formulario */}
          <div className="space-y-2">
            <span className="font-sans text-xs text-[#B89758] font-semibold block">
              Acceso de personal y administración
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Iniciar sesión
            </h1>
            <p className="font-sans text-sm text-[#9B988F] leading-relaxed">
              Ingresa con tu correo electrónico y contraseña para abrir tu panel de trabajo en Punto Fino.
            </p>
          </div>

          {/* Formulario Unificado */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-sans font-medium text-[#cccccc]"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6A6862]">
                  <Mail size={16} />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="juandavid@puntofino.co"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                  className={`w-full bg-[#18191E] border ${
                    errors.email ? 'border-rose-500' : 'border-white/10 hover:border-white/20'
                  } text-white text-sm rounded-md pl-10 pr-4 py-3 placeholder-[#6A6862] focus:outline-none focus:border-[#E15233] focus:ring-1 focus:ring-[#E15233] transition-colors`}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-rose-400 mt-1 font-sans">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-sans font-medium text-[#cccccc]"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  className="text-xs font-sans text-[#B89758] hover:text-white transition-colors cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6A6862]">
                  <Lock size={16} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                  className={`w-full bg-[#18191E] border ${
                    errors.password ? 'border-rose-500' : 'border-white/10 hover:border-white/20'
                  } text-white text-sm rounded-md pl-10 pr-11 py-3 placeholder-[#6A6862] focus:outline-none focus:border-[#E15233] focus:ring-1 focus:ring-[#E15233] transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9B988F] hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-rose-400 mt-1 font-sans">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E15233] hover:bg-[#C44327] disabled:bg-[#E15233]/60 text-white font-sans font-semibold text-sm py-3.5 px-4 rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a mi panel</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Enlace para Clientes */}
          <div className="pt-6 border-t border-white/10 text-center space-y-2">
            <p className="text-xs text-[#9B988F] font-sans">
              ¿Eres cliente y deseas agendar una cita?
            </p>
            <Link
              to="/#reservar"
              className="inline-flex items-center gap-1.5 text-xs text-white hover:text-[#B89758] font-sans font-semibold underline underline-offset-4 transition-colors"
            >
              <span>Agenda tu cita aquí sin crear cuenta</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-[#6A6862] font-sans pt-2">
            <ShieldCheck size={14} className="text-[#B89758]" />
            <span>Sesión protegida por rol (Administrador y Barberos).</span>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña por Correo */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111215] border border-white/15 rounded-md p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-[#B89758]" />
                <h3 className="font-display font-bold text-base text-white">
                  Recuperar contraseña
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(false);
                  setRecoveryStep(1);
                }}
                className="text-[#9B988F] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {recoveryStep === 1 ? (
              <form onSubmit={handleRequestRecoveryCode} className="space-y-4">
                <p className="text-xs font-sans text-[#9B988F] leading-relaxed">
                  Ingresa tu correo electrónico registrado en Punto Fino y te enviaremos un código de 6 dígitos para restablecer tu contraseña.
                </p>
                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={recoveryData.email}
                    onChange={(e) =>
                      setRecoveryData({ ...recoveryData, email: e.target.value })
                    }
                    placeholder="tu@puntofino.co"
                    className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#B89758]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-semibold text-xs py-3 rounded-md cursor-pointer"
                >
                  {recoveryLoading ? 'Enviando código...' : 'Enviar código de recuperación'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs font-sans text-[#9B988F]">
                  Ingresa el código de 6 dígitos enviado a <strong className="text-white">{recoveryData.email}</strong> y tu nueva contraseña.
                </p>
                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={recoveryData.code}
                    onChange={(e) =>
                      setRecoveryData({
                        ...recoveryData,
                        code: e.target.value.replace(/\D/g, '').slice(0, 6),
                      })
                    }
                    placeholder="000000"
                    className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm font-bold tracking-widest text-white tabular-nums outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Nueva contraseña (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    value={recoveryData.newPassword}
                    onChange={(e) =>
                      setRecoveryData({ ...recoveryData, newPassword: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-semibold text-xs py-3 rounded-md cursor-pointer"
                >
                  {recoveryLoading ? 'Actualizando...' : 'Guardar nueva contraseña'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}