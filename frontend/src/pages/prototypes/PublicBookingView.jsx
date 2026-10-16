import React, { useState, useEffect } from 'react';
import { 
  Scissors, Sparkles, Clock, CheckCircle2, ChevronRight, ChevronLeft,
  Calendar, User, Phone, Mail, MapPin, Download, AlertTriangle, ShieldCheck,
  Check, Info
} from 'lucide-react';

export default function PublicBookingView() {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState(['exp-punto-fino']);
  const [selectedBarber, setSelectedBarber] = useState('juan-david');
  const [selectedDate, setSelectedDate] = useState('2026-10-18');
  const [selectedTime, setSelectedTime] = useState('03:30 PM');
  const [holdTimer, setHoldTimer] = useState(480); // 8 minutos en segundos
  const [formData, setFormData] = useState({
    name: 'Mateo Holguín',
    phone: '3157894210',
    email: 'mateo.holguin@gmail.com',
    notes: 'Degradado medio a navaja, mantener volumen arriba.',
    acceptHabeas: true,
    acceptMarketing: false
  });
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Servicios disponibles oficiales de Punto Fino
  const services = [
    {
      id: 'exp-punto-fino',
      name: 'Experiencia Punto Fino (Corte + Cejas)',
      desc: 'Degradado a navaja milimétrico, perfilado de cerquillo, diseño y limpieza de cejas con acabado profesional.',
      duration: 35,
      price: 24000,
      badge: 'Popular · Recomendado'
    },
    {
      id: 'exp-pf-barba',
      name: 'Experiencia Punto Fino + Ritual de Barba',
      desc: 'Corte completo con perfilado de cerquillo y cejas, combinado con ritual de barba, toalla caliente y aceites.',
      duration: 45,
      price: 34000,
      badge: 'Popular'
    },
    {
      id: 'exp-platinium',
      name: 'Experiencia Platinium (VIP Todo Incluido)',
      desc: 'Servicio VIP integral: corte a tijera o degradado, ritual completo de barba, perfilado de cejas y exfoliación.',
      duration: 60,
      price: 55000,
      badge: '15% OFF'
    },
    {
      id: 'ritual-barba',
      name: 'Ritual de Barba',
      desc: 'Toalla caliente aromatizada, vapor de ozono, perfilado a navaja tradicional y bálsamo hidratante para piel fresca.',
      duration: 25,
      price: 12000,
      badge: 'Popular'
    },
    {
      id: 'cejas',
      name: 'Cejas',
      desc: 'Limpieza, diseño milimétrico y perfilado con navaja fina para resaltar la mirada con máxima precisión.',
      duration: 15,
      price: 5000,
      badge: 'Detalle Rápido'
    }
  ];

  // Barberos del equipo real de Punto Fino
  const barbers = [
    {
      id: 'any',
      name: 'El primero disponible',
      nickname: 'Asignación inteligente',
      specialty: 'Cualquier barbero del equipo según tu hora preferida',
      rating: '5.0',
      cutsCount: '1.2k',
      image: '/images/punto-fino/corte-fade-real.png'
    },
    {
      id: 'juan-david',
      name: 'Juan David',
      nickname: 'Barbero & Administrador',
      monogram: 'Jd',
      specialty: 'Especialista en Experiencia Punto Fino, visagismo masculino y degradados pulidos',
      rating: '4.9',
      cutsCount: '650+',
      image: '/images/punto-fino/equipo-barberos-real.png'
    },
    {
      id: 'emanuel-torres',
      name: 'Emanuel Torres',
      nickname: 'Barbero Profesional',
      monogram: 'et',
      specialty: 'Especialista en Ritual de Barba tradicional con toalla caliente y fade en tendencia',
      rating: '4.9',
      cutsCount: '480+',
      image: '/images/punto-fino/ritual-vapor-real.png'
    },
    {
      id: 'juan-diego',
      name: 'Juan Diego',
      nickname: 'Barbero Máster',
      monogram: 'JD',
      specialty: 'Especialista en Experiencia Platinium VIP, corte a tijera y perfilado de cejas',
      rating: '5.0',
      cutsCount: '520+',
      image: '/images/punto-fino/servicios-catalogo-real.png'
    }
  ];

  // Franjas horarias
  const timeSlots = [
    { time: '10:00 AM', available: true },
    { time: '10:45 AM', available: true },
    { time: '11:30 AM', available: false },
    { time: '12:15 PM', available: true },
    { time: '02:00 PM', available: true },
    { time: '02:45 PM', available: true },
    { time: '03:30 PM', available: true, isCurrentSelected: true },
    { time: '04:15 PM', available: false },
    { time: '05:00 PM', available: true },
    { time: '05:45 PM', available: true },
    { time: '06:30 PM', available: true },
  ];

  // Timer de retención
  useEffect(() => {
    if (step >= 3 && holdTimer > 0 && !bookingConfirmed) {
      const interval = setInterval(() => setHoldTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, holdTimer, bookingConfirmed]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleService = (id) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const selectedServicesList = services.filter((s) => selectedServices.includes(s.id));
  const totalDuration = selectedServicesList.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = selectedServicesList.reduce((acc, s) => acc + s.price, 0);
  const currentBarber = barbers.find((b) => b.id === selectedBarber) || barbers[0];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Banner de Estado en Vivo de la Barbería */}
      <div className="pf-card p-4 bg-pf-surface/80 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-pf-available">
        <div className="flex items-center gap-2.5">
          <span className="pf-dot-live" />
          <span className="text-xs font-semibold text-pf-bone">Barbería Abierta Hoy en Cali</span>
          <span className="text-xs text-pf-muted">· 4 cupos disponibles para la tarde</span>
        </div>
        <div className="text-xs font-mono text-pf-muted flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-pf-terracota" /> Santiago de Cali · Tequendama
        </div>
      </div>

      {/* Indicador de Pasos Tipo "Línea Fina con Puntos" */}
      <div className="pf-card p-5 bg-pf-surface/60">
        <div className="flex items-center justify-between text-xs font-mono text-pf-muted mb-3">
          <span className="text-pf-terracota font-bold">PASO {step} DE 5</span>
          {step >= 3 && !bookingConfirmed && (
            <span className="text-pf-terracota flex items-center gap-1.5 font-semibold animate-pulse">
              <Clock className="w-3.5 h-3.5" /> Cupo apartado: {formatTimer(holdTimer)} min
            </span>
          )}
        </div>
        
        {/* Barra de progreso con puntos */}
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/10" />
          {[1, 2, 3, 4, 5].map((s) => {
            const isDone = s < step || bookingConfirmed;
            const isCurrent = s === step && !bookingConfirmed;
            return (
              <div 
                key={s} 
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  isDone 
                    ? 'bg-pf-available text-pf-carbon' 
                    : isCurrent 
                    ? 'bg-pf-terracota text-white ring-4 ring-pf-terracota/20' 
                    : 'bg-pf-elevated text-pf-subtle border border-white/10'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between text-[10px] font-sans text-pf-muted mt-2 px-1">
          <span>Servicio</span>
          <span>Barbero</span>
          <span>Horario</span>
          <span>Tus Datos</span>
          <span>Listo</span>
        </div>
      </div>

      {/* CONTENIDO DEL PASO */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-pf-bone">1. Elegí el servicio que necesitás</h2>
            <p className="text-xs text-pf-muted">Podés combinar varios servicios (ejemplo: corte + barba) y calculamos el tiempo y precio total.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((s) => {
              const isSelected = selectedServices.includes(s.id);
              return (
                <div 
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`pf-card p-5 cursor-pointer transition-all relative ${
                    isSelected 
                      ? 'border-pf-terracota bg-pf-elevated shadow-fine-terracota' 
                      : 'hover:border-white/20'
                  }`}
                >
                  {s.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full bg-pf-terracota/10 border border-pf-terracota/30 text-pf-terracota">
                      {s.badge}
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-all ${
                      isSelected ? 'bg-pf-terracota border-pf-terracota text-white' : 'border-white/20 bg-pf-carbon'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div className="space-y-1.5 flex-1 pr-6">
                      <div className="text-sm font-display font-bold text-pf-bone">{s.name}</div>
                      <p className="text-xs text-pf-muted leading-relaxed">{s.desc}</p>
                      <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                        <span className="text-pf-terracota font-bold">$ {s.price.toLocaleString('es-CO')} COP</span>
                        <span className="text-pf-subtle flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {s.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen del paso */}
          <div className="pf-card p-4 bg-pf-surface/60 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-pf-muted font-mono">Total seleccionado: </span>
              <span className="text-sm font-mono font-bold text-pf-terracota">$ {totalPrice.toLocaleString('es-CO')} COP</span>
              <span className="text-pf-subtle ml-2">({totalDuration} min)</span>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="pf-btn-primary"
            >
              Continuar con Barbero <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-pf-bone">2. ¿Con quién querés atenderte?</h2>
            <p className="text-xs text-pf-muted">Elegí tu barbero de confianza o la opción "El primero disponible" si buscás la hora más rápida.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {barbers.map((b) => {
              const isSelected = selectedBarber === b.id;
              return (
                <div 
                  key={b.id}
                  onClick={() => setSelectedBarber(b.id)}
                  className={`pf-card p-4 cursor-pointer transition-all flex gap-3.5 items-center ${
                    isSelected 
                      ? 'border-pf-terracota bg-pf-elevated shadow-fine-terracota' 
                      : 'hover:border-white/20'
                  }`}
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-pf-carbon border border-white/10 shrink-0">
                    <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-display font-bold text-pf-bone truncate">{b.name}</div>
                      <div className="text-[11px] font-mono text-pf-terracota font-bold">★ {b.rating}</div>
                    </div>
                    <div className="text-xs font-semibold text-pf-brass truncate">{b.nickname}</div>
                    <div className="text-[11px] text-pf-muted line-clamp-1">{b.specialty}</div>
                    <div className="text-[10px] font-mono text-pf-subtle">{b.cutsCount} cortes realizados</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(1)} className="pf-btn-secondary">
              <ChevronLeft className="w-4 h-4" /> Volver a Servicios
            </button>
            <button onClick={() => setStep(3)} className="pf-btn-primary">
              Ver Horarios Disponibles <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-pf-bone">3. Elegí el día y la hora exacta</h2>
            <p className="text-xs text-pf-muted">Disponibilidad en tiempo real según la agenda de {currentBarber.nickname}. Franja con bloqueo transaccional de 8 minutos.</p>
          </div>

          {/* Días cercanos */}
          <div className="flex gap-2.5 overflow-x-auto pb-2">
            {[
              { day: 'Vie 16', date: '2026-10-16', note: 'Lleno' },
              { day: 'Sáb 17', date: '2026-10-17', note: '2 cupos' },
              { day: 'Dom 18', date: '2026-10-18', note: 'Disponible' },
              { day: 'Lun 19', date: '2026-10-19', note: 'Disponible' },
              { day: 'Mar 20', date: '2026-10-20', note: 'Disponible' },
            ].map((d) => (
              <button 
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`px-4 py-3 rounded-md text-xs font-mono text-center shrink-0 border transition-all ${
                  selectedDate === d.date 
                    ? 'border-pf-terracota bg-pf-elevated text-white' 
                    : 'border-white/10 bg-pf-surface text-pf-muted hover:border-white/20'
                }`}
              >
                <div className="font-bold">{d.day}</div>
                <div className={`text-[10px] mt-1 ${d.note === 'Lleno' ? 'text-pf-danger' : 'text-pf-available'}`}>
                  {d.note}
                </div>
              </button>
            ))}
          </div>

          {/* Grilla de Franjas Horarias */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-pf-muted">
              <span>Turnos para el Domingo 18 de Octubre:</span>
              <span className="text-[11px] text-pf-available flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pf-available" /> 8 cupos libres
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {timeSlots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-3 px-2 rounded-md text-xs font-mono text-center border transition-all ${
                      isSelected
                        ? 'border-pf-terracota bg-pf-terracota text-white font-bold shadow-fine-terracota'
                        : slot.available
                        ? 'border-white/10 bg-pf-surface hover:border-pf-terracota/50 text-pf-bone'
                        : 'border-white/5 bg-pf-carbon text-pf-subtle opacity-35 cursor-not-allowed line-through'
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerta de Retención de Cupo */}
          <div className="p-3.5 rounded-md bg-pf-terracota/10 border border-pf-terracota/30 flex items-start gap-2.5 text-xs text-pf-bone">
            <Info className="w-4 h-4 text-pf-terracota shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-pf-terracota">Cupo protegido temporalmente: </span>
              Hemos reservado la franja de las {selectedTime} con {currentBarber.name} por <span className="font-mono font-bold text-white">{formatTimer(holdTimer)}</span> minutos para que completes tus datos sin que nadie te quite el turno.
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(2)} className="pf-btn-secondary">
              <ChevronLeft className="w-4 h-4" /> Cambiar Barbero
            </button>
            <button onClick={() => setStep(4)} className="pf-btn-primary">
              Completar mis Datos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-pf-bone">4. Tus datos para confirmar la cita</h2>
            <p className="text-xs text-pf-muted">Sin crear contraseñas. Te enviaremos la confirmación directa a tu WhatsApp y a tu correo.</p>
          </div>

          <div className="pf-card p-6 space-y-4">
            <div>
              <label className="pf-label">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pf-subtle" />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pf-input pl-10" 
                  placeholder="Ej: Mateo Holguín"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="pf-label">Número de WhatsApp (Cali / Colombia)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-mono text-pf-muted">
                    🇨🇴 +57
                  </div>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pf-input pl-16 font-mono text-xs" 
                    placeholder="300 000 0000"
                  />
                </div>
              </div>

              <div>
                <label className="pf-label">Correo Electrónico (Para archivo .ics y recibo)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pf-subtle" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pf-input pl-10 text-xs" 
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="pf-label">Indicaciones para el barbero (Opcional)</label>
              <textarea 
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="pf-input text-xs"
                placeholder="Ej: Llevo foto de referencia, piel sensible a la navaja en el cuello..."
              />
            </div>

            {/* Checkboxes de Ley 1581 (Habeas Data) en Colombia */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="habeas"
                  checked={formData.acceptHabeas}
                  onChange={(e) => setFormData({ ...formData, acceptHabeas: e.target.checked })}
                  className="mt-1 rounded border-pf-border bg-pf-surface text-pf-terracota focus:ring-pf-terracota"
                />
                <label htmlFor="habeas" className="text-xs text-pf-muted leading-relaxed">
                  <span className="text-pf-bone font-medium">Obligatorio:</span> Autorizo el tratamiento de mis datos personales según la <button type="button" onClick={() => setShowLegalModal(true)} className="text-pf-terracota underline hover:text-white">Política de Privacidad y Habeas Data (Ley 1581 de 2012)</button> exclusivamente para la reserva y recordatorio de mi cita.
                </label>
              </div>

              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="marketing"
                  checked={formData.acceptMarketing}
                  onChange={(e) => setFormData({ ...formData, acceptMarketing: e.target.checked })}
                  className="mt-1 rounded border-pf-border bg-pf-surface text-pf-terracota focus:ring-pf-terracota"
                />
                <label htmlFor="marketing" className="text-xs text-pf-muted leading-relaxed">
                  Opcional: Acepto recibir promociones y recordatorios de corte cada 15 días por WhatsApp.
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(3)} className="pf-btn-secondary">
              <ChevronLeft className="w-4 h-4" /> Cambiar Horario
            </button>
            <button 
              disabled={!formData.acceptHabeas || !formData.name || !formData.phone}
              onClick={() => setStep(5)} 
              className="pf-btn-primary"
            >
              Revisar y Confirmar Cita <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 5 && !bookingConfirmed && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-pf-bone">5. Resumen final de tu cita</h2>
            <p className="text-xs text-pf-muted">Revisá los detalles antes de sellar el turno. Podrás reprogramar o cancelar gratis hasta 2 horas antes.</p>
          </div>

          {/* Ticket de Resumen Estilo Sastre */}
          <div className="pf-card p-6 bg-pf-surface/90 space-y-5 border-t-4 border-t-pf-terracota">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-mono text-pf-terracota font-bold tracking-wider uppercase">PUNTO FINO · CALI</span>
                <div className="text-lg font-display font-bold text-pf-bone">Reserva para {formData.name}</div>
              </div>
              <span className="pf-badge-available">
                <span className="pf-dot-live" /> Cupo Asignado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-pf-muted font-mono uppercase tracking-wider text-[10px]">Barbero:</span>
                <div className="font-semibold text-pf-bone flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-pf-carbon shrink-0">
                    <img src={currentBarber.image} alt={currentBarber.name} className="w-full h-full object-cover" />
                  </div>
                  {currentBarber.name} ({currentBarber.nickname})
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-pf-muted font-mono uppercase tracking-wider text-[10px]">Fecha y Hora:</span>
                <div className="font-semibold text-pf-bone flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-pf-terracota" />
                  Domingo 18 de Octubre · {selectedTime}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-pf-muted font-mono uppercase tracking-wider text-[10px]">Servicios:</span>
                <div className="space-y-1 pt-1">
                  {selectedServicesList.map((s) => (
                    <div key={s.id} className="flex justify-between text-pf-bone">
                      <span>• {s.name} ({s.duration} min)</span>
                      <span className="font-mono text-pf-muted">$ {s.price.toLocaleString('es-CO')} COP</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-white/5">
                <span className="text-pf-muted font-mono uppercase tracking-wider text-[10px]">Lugar de atención:</span>
                <div className="text-pf-bone flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-pf-terracota shrink-0" />
                  Calle 5ta #38-24, Barrio Tequendama, Santiago de Cali
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-pf-muted uppercase tracking-wider">Total a pagar en el local:</div>
                <div className="text-2xl font-mono font-bold text-pf-terracota">$ {totalPrice.toLocaleString('es-CO')} COP</div>
                <div className="text-[11px] text-pf-subtle">Aceptamos Efectivo, Nequi, Daviplata y Datáfono</div>
              </div>
              <button 
                onClick={() => setBookingConfirmed(true)}
                className="pf-btn-primary px-8 py-3.5 text-base shadow-lg"
              >
                Confirmar mi Cita <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-pf-muted">
            <button onClick={() => setStep(4)} className="pf-btn-secondary">
              <ChevronLeft className="w-4 h-4" /> Modificar Datos
            </button>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-pf-available" /> Conexión Segura & Sin Spam
            </span>
          </div>
        </div>
      )}

      {/* PANTALLA DE ÉXITO FINAL */}
      {bookingConfirmed && (
        <div className="pf-card p-8 bg-pf-surface text-center space-y-6 border-t-4 border-t-pf-available animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-pf-available/10 border border-pf-available/30 text-pf-available flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-pf-terracota uppercase tracking-widest font-semibold">CITA CONFIRMADA EXITOSAMENTE</span>
            <h2 className="text-3xl font-display font-bold text-pf-bone">¡Listo, Mateo! Te esperamos en la silla.</h2>
            <p className="text-xs text-pf-muted max-w-md mx-auto">
              Te guardamos el turno con <span className="text-white font-semibold">{currentBarber.nickname}</span> para el <span className="text-white font-semibold">Domingo 18 de Octubre a las {selectedTime}</span>.
            </p>
          </div>

          {/* Código de Cita */}
          <div className="inline-block p-4 rounded-lg bg-pf-elevated border border-white/10 font-mono">
            <div className="text-[10px] text-pf-muted uppercase tracking-wider">Código de Reserva</div>
            <div className="text-2xl font-bold text-pf-terracota tracking-widest">PF-8492</div>
          </div>

          {/* Acciones de Calendario y Ubicación */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a 
              href="#google-cal" 
              onClick={(e) => { e.preventDefault(); alert('Enlace directo generado para Google Calendar con fecha y hora de Punto Fino.'); }}
              className="pf-btn-primary"
            >
              <Calendar className="w-4 h-4" /> Agregar a Google Calendar
            </a>
            <a 
              href="#ics-download" 
              onClick={(e) => { e.preventDefault(); alert('Descargando archivo .ics para Apple Calendar / Outlook.'); }}
              className="pf-btn-secondary"
            >
              <Download className="w-4 h-4" /> Descargar .ics
            </a>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noreferrer"
              className="pf-btn-outline"
            >
              <MapPin className="w-4 h-4 text-pf-terracota" /> Cómo llegar (Google Maps)
            </a>
          </div>

          {/* Autogestión sin cuenta */}
          <div className="p-4 rounded-md bg-pf-carbon border border-white/5 text-xs text-pf-muted max-w-lg mx-auto space-y-2">
            <div className="font-semibold text-pf-bone">¿Cambió tu horario o necesitás cancelar?</div>
            <p className="text-[11px] leading-relaxed">
              No necesitás crear cuenta ni llamarnos. Te enviamos un enlace seguro a tu correo <code className="text-pf-bone font-mono">{formData.email}</code> para reprogramar o cancelar con un solo clic.
            </p>
            <div className="flex justify-center gap-3 pt-1">
              <button onClick={() => alert('Simulación: Token seguro verificado para reprogramar turno.')} className="text-pf-terracota hover:underline font-mono text-[11px]">
                Reprogramar Cita →
              </button>
              <span className="text-pf-subtle">·</span>
              <button onClick={() => alert('Simulación: Turno cancelado y horario liberado para otro cliente.')} className="text-pf-danger hover:underline font-mono text-[11px]">
                Cancelar Cita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Habeas Data Ley 1581 */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-lg w-full bg-pf-surface space-y-4 border border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-sm text-pf-bone">Tratamiento de Datos Personales (Ley 1581 de 2012)</h3>
              <button onClick={() => setShowLegalModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>
            <div className="text-xs text-pf-muted space-y-3 max-h-64 overflow-y-auto pr-2 leading-relaxed">
              <p>
                <strong>Punto Fino Barbería (Santiago de Cali, Colombia)</strong> informa que los datos personales recopilados (nombre, teléfono y correo electrónico) serán tratados en estricto cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013.
              </p>
              <p>
                <strong>Finalidad:</strong> Agendamiento de la cita, envío del correo transaccional de confirmación, enlace de autogestión, recordatorios de asistencia y contacto operativo del barbero.
              </p>
              <p>
                <strong>Canal de Derechos:</strong> El titular podrá consultar, actualizar o solicitar la supresión de sus datos escribiendo a <code>contacto@puntofinobarberia.com</code>.
              </p>
              <p className="text-[10px] text-pf-subtle">
                [NOTA DE CUMPLIMIENTO: BORRADOR EDITABLE - REVISAR CON ABOGADO].
              </p>
            </div>
            <button onClick={() => setShowLegalModal(false)} className="pf-btn-primary w-full">
              Entendido y Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

