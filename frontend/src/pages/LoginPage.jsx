import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
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

      const firstName = user.name ? user.name.split(' ')[0] : 'Colaborador';
      toast.success(`Bienvenido a Punto Fino, ${firstName}`);

      // Detección automática de rol y redirección inteligente
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'barbero') {
        navigate('/barber');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast.error(error.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#F7F5F0] flex flex-col md:grid md:grid-cols-12">
      
      {/* Columna Izquierda: Imagen de Oficio & Marca (Solo en pantallas medianas y grandes) */}
      <div className="hidden md:flex md:col-span-5 lg:col-span-6 relative flex-col justify-between p-10 lg:p-14 overflow-hidden border-r border-white/10 bg-black">
        {/* Fotografía de Fondo con atmósfera real de barbería */}
        <div className="absolute inset-0">
          <img
            src="/images/punto-fino/ritual-vapor-facial.png"
            alt="Oficio en Punto Fino Cali"
            className="w-full h-full object-cover filter brightness-[0.45] contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-black/40 to-[#0b0c0e]/80" />
        </div>

        {/* Encabezado Izquierdo */}
        <div className="relative z-10 flex items-center gap-3.5">
          <Link to="/" className="w-12 h-12 rounded-md bg-black/80 border border-white/15 p-1 flex items-center justify-center shadow-lg hover:border-[#E15233] transition-colors">
            <img
              src="/images/punto-fino/logo.png"
              alt="Punto Fino"
              className="w-full h-full object-contain"
            />
          </Link>
          <div>
            <h2 className="font-display font-bold text-2xl text-white tracking-wide leading-none">
              PUNTO FINO
            </h2>
            <span className="font-sans text-xs text-[#B89758] font-medium tracking-wide">
              {BUSINESS_CONFIG.location.neighborhood} · Cali
            </span>
          </div>
        </div>

        {/* Cita Editorial del Oficio */}
        <div className="relative z-10 space-y-4 max-w-lg">
          <span className="font-mono text-xs uppercase tracking-widest text-[#E15233] font-bold block">
            PORTAL DEL EQUIPO
          </span>
          <blockquote className="font-display text-2xl lg:text-3xl font-normal text-[#F7F5F0] leading-snug">
            “El verdadero oficio se nota en el detalle milimétrico, el respeto por el tiempo del cliente y la calidez en cada silla.”
          </blockquote>
          <p className="font-sans text-xs text-[#9B988F]">
            Administración central, agenda diaria de barberos y liquidación de servicios.
          </p>
        </div>

        {/* Footer Izquierdo */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#9B988F] font-mono border-t border-white/10 pt-4">
          <span>{BUSINESS_CONFIG.location.address}</span>
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
              <img src="/images/punto-fino/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Título y Presentación del Formulario */}
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[#B89758] font-semibold">
              Acceso Exclusivo de Personal
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="font-sans text-sm text-[#9B988F] leading-relaxed">
              Ingresa tus credenciales para acceder a la consola administrativa o a tu agenda de barbero.
            </p>
          </div>

          {/* Formulario Unificado */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            
            {/* Campo 1: Correo Electrónico */}
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
                  placeholder="ejemplo@puntofino.co"
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

            {/* Campo 2: Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="login-password" 
                  className="block text-xs font-sans font-medium text-[#cccccc]"
                >
                  Contraseña
                </label>
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

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E15233] hover:bg-[#C44327] disabled:bg-[#E15233]/60 text-white font-sans font-bold text-sm uppercase tracking-wider py-3.5 px-4 rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E15233] focus:ring-offset-2 focus:ring-offset-[#0b0c0e]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Enlace de Escape Amable para Clientes */}
          <div className="pt-6 border-t border-white/10 text-center space-y-3">
            <p className="text-xs text-[#9B988F] font-sans">
              ¿Eres cliente y quieres agendar un corte?
            </p>
            <Link
              to="/#reservar"
              className="inline-flex items-center gap-1.5 text-xs text-white hover:text-[#B89758] font-sans font-semibold underline underline-offset-4 transition-colors"
            >
              <span>Reserva tu cita aquí sin crear cuenta</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Garantía de Seguridad */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#6A6862] font-sans pt-2">
            <ShieldCheck size={14} className="text-[#B89758]" />
            <span>Acceso seguro protegido con tokens de sesión encriptados.</span>
          </div>

        </div>
      </div>

    </div>
  );
}