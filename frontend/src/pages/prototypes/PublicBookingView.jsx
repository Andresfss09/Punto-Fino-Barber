import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
  ShieldCheck,
  Check,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Sun,
  SunMedium,
  Moon,
} from 'lucide-react';
import api from '../../services/api';
import {
  BUSINESS_CONFIG,
  OFFICIAL_SERVICES,
  OFFICIAL_BARBERS,
  OFFICIAL_PRODUCTS,
  DAY_NAMES_ES,
  DAY_SHORT_ES,
  getShopStatus,
} from '../../config/businessConfig';

// Genera los próximos N días en zona horaria America/Bogota
function generateUpcomingDays(count = 10) {
  const days = [];
  const nowBogotaStr = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Bogota',
  });
  const [y, m, d] = nowBogotaStr.split('-').map(Number);

  for (let i = 0; i < count; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i, 12, 0, 0));
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = dt.getUTCDay();
    const monthShort = dt.toLocaleDateString('es-CO', {
      month: 'short',
      timeZone: 'UTC',
    });

    days.push({
      dateStr,
      dayOfWeek,
      dayShort: DAY_SHORT_ES[dayOfWeek],
      dayName: DAY_NAMES_ES[dayOfWeek],
      dayNumber: dd,
      monthShort: monthShort.replace('.', ''),
      isToday: i === 0,
    });
  }
  return days;
}

export default function PublicBookingView({ preselectedBarber, preselectedProduct }) {
  const [step, setStep] = useState(1);

  // Catálogos cargados desde el backend (con respaldo inmediato de la configuración oficial)
  const [services, setServices] = useState(OFFICIAL_SERVICES);
  const [barbers, setBarbers] = useState(OFFICIAL_BARBERS);
  const [products, setProducts] = useState(OFFICIAL_PRODUCTS);

  // Selecciones del cliente (Un solo servicio obligatorio + productos opcionales)
  const [selectedServiceId, setSelectedServiceId] = useState(OFFICIAL_SERVICES[0].id);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState('any');

  // Fechas y disponibilidad real desde el backend
  const upcomingDays = useMemo(() => generateUpcomingDays(10), []);
  const [selectedDate, setSelectedDate] = useState(upcomingDays[0]?.dateStr || '');
  const [availabilityData, setAvailabilityData] = useState({
    slots: [],
    loading: false,
    reason: null,
    schedule: null,
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPeriodTab, setSelectedPeriodTab] = useState('manana'); // 'manana' | 'tarde' | 'noche'

  // Retención temporal discreta (8 minutos)
  const [holdTimer, setHoldTimer] = useState(480);
  const [holdAppointmentId, setHoldAppointmentId] = useState(null);
  const [bookingSessionId] = useState(() => {
    let sid = typeof window !== 'undefined' ? sessionStorage.getItem('pf_booking_session') : null;
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      if (typeof window !== 'undefined') sessionStorage.setItem('pf_booking_session', sid);
    }
    return sid;
  });

  // Datos del cliente
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    acceptHabeas: true,
  });
  const [otpState, setOtpState] = useState({
    sent: false,
    Sending: false,
    code: '',
    devHint: null,
    error: '',
    message: '',
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);
  const [showLegalModal, setShowLegalModal] = useState(false);

  const shopStatus = useMemo(() => getShopStatus(), []);

  // Cargar servicios, barberos y productos reales del backend
  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      api.get('/services'),
      api.get('/barbers'),
      api.get('/products'),
    ]).then(([srvRes, brbRes, prdRes]) => {
      if (!mounted) return;

      if (srvRes.status === 'fulfilled') {
        const dbServices = srvRes.value?.services || srvRes.value?.data?.services;
        if (dbServices && dbServices.length > 0) {
          setServices(dbServices);
          setSelectedServiceId(dbServices[0].id);
        }
      }

      if (brbRes.status === 'fulfilled') {
        const dbBarbers = brbRes.value?.barbers || brbRes.value?.data?.barbers;
        if (dbBarbers && dbBarbers.length > 0) {
          setBarbers(dbBarbers);
        }
      }

      if (prdRes.status === 'fulfilled') {
        const dbProducts = prdRes.value?.products || prdRes.value?.data?.products;
        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Sincronizar si el usuario hizo clic en "Agendar con..." o "Agregar a mi cita" en la landing
  useEffect(() => {
    if (preselectedBarber) {
      const match = barbers.find(
        (b) =>
          b.id === preselectedBarber.id ||
          b.name?.toLowerCase() === preselectedBarber.name?.toLowerCase() ||
          b.nickname?.toLowerCase() === preselectedBarber.name?.toLowerCase()
      );
      if (match) {
        setSelectedBarberId(match.id);
      }
    }
  }, [preselectedBarber, barbers]);

  useEffect(() => {
    if (preselectedProduct) {
      const match = products.find(
        (p) =>
          p.id === preselectedProduct.id ||
          p.sku === preselectedProduct.sku ||
          p.name?.toLowerCase() === preselectedProduct.name?.toLowerCase()
      );
      const targetId = match ? match.id : preselectedProduct.id;
      if (targetId && !selectedProductIds.includes(targetId)) {
        setSelectedProductIds((prev) => [...prev, targetId]);
      }
    }
  }, [preselectedProduct, products]);

  // Servicio activo (estrictamente 1 servicio por reserva)
  const activeService = useMemo(() => {
    return (
      services.find((s) => s.id === selectedServiceId || s.slug === selectedServiceId) ||
      services[0]
    );
  }, [services, selectedServiceId]);

  const serviceDuration = activeService?.durationMinutes ?? activeService?.duration ?? 35;
  const servicePrice = activeService?.priceCOP ?? activeService?.price ?? 24000;

  // Productos opcionales seleccionados
  const selectedProductsList = useMemo(() => {
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  const productsTotalCOP = useMemo(() => {
    return selectedProductsList.reduce((sum, p) => sum + (p.priceCOP ?? p.price ?? 0), 0);
  }, [selectedProductsList]);

  const totalPriceCOP = servicePrice + productsTotalCOP;

  // Barbero seleccionado
  const barberOptions = useMemo(() => {
    const normalizedBarbers = barbers.map((b) => ({
      id: b.id,
      name: b.user?.name || b.nickname || b.name,
      roleLabel:
        b.user?.role === 'ADMIN' || b.isAdmin
          ? 'Barbero y Administrador'
          : 'Barbero',
      weeklyRestDay: b.weeklyRestDay,
      restDayLabel:
        b.restDayLabel ||
        (b.weeklyRestDay !== null && b.weeklyRestDay !== undefined
          ? `Descansa los ${DAY_NAMES_ES[b.weeklyRestDay].toLowerCase()}`
          : 'Atiende toda la semana'),
      bio:
        b.bio ||
        'Atiende todos los servicios del catálogo con la misma duración y el mismo precio.',
    }));

    return [
      {
        id: 'any',
        name: 'El primero disponible',
        roleLabel: 'Asignación automática sin cruces',
        weeklyRestDay: null,
        restDayLabel: 'Se asigna al barbero libre en tu horario elegido',
        bio: 'Ideal si priorizas el horario. El sistema asigna automáticamente al profesional disponible (lunes: Juan David o Juan Diego; martes: Juan David o Emanuel Torres; miércoles: Emanuel Torres o Juan Diego).',
      },
      ...normalizedBarbers,
    ];
  }, [barbers]);

  const currentBarber = useMemo(() => {
    return barberOptions.find((b) => b.id === selectedBarberId) || barberOptions[0];
  }, [barberOptions, selectedBarberId]);

  // Consultar disponibilidad real al backend cuando cambia fecha, barbero o servicio
  useEffect(() => {
    if (!selectedDate || !activeService) return;

    let mounted = true;
    setAvailabilityData((prev) => ({ ...prev, loading: true, reason: null }));
    setSelectedSlot(null);

    api
      .get(`/barbers/${selectedBarberId}/availability`, {
        params: {
          date: selectedDate,
          serviceId: activeService.id,
          duration: serviceDuration,
        },
      })
      .then((res) => {
        const payload = res?.slots ? res : (res?.data?.slots ? res.data : (res?.data || res || {}));
        const rawSlots = payload.slots || payload.availableSlots || [];
        const firstAvailable = rawSlots.find((s) => s.available);

        setAvailabilityData({
          slots: rawSlots,
          loading: false,
          reason: payload.reason || null,
          schedule: payload.schedule || null,
        });

        if (firstAvailable) {
          setSelectedSlot(firstAvailable);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setAvailabilityData({
          slots: [],
          loading: false,
          reason:
            err.response?.data?.message ||
            'No fue posible consultar las franjas horarias en este momento.',
          schedule: null,
        });
      });

    return () => {
      mounted = false;
    };
  }, [selectedDate, selectedBarberId, activeService, serviceDuration]);

  // Temporizador discreto de 8 minutos en pasos 3 y 4
  useEffect(() => {
    if ((step === 3 || step === 4) && holdTimer > 0 && !confirmedAppointment) {
      const interval = setInterval(() => setHoldTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, holdTimer, confirmedAppointment]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Agrupar franjas horarias por Mañana, Tarde y Noche
  const groupedSlots = useMemo(() => {
    const groups = {
      manana: [],
      tarde: [],
      noche: [],
    };
    for (const slot of availabilityData.slots) {
      const p = String(slot.period || '').toLowerCase();
      if (p.includes('morn') || p.includes('mañ') || p.includes('man')) {
        groups.manana.push(slot);
      } else if (p.includes('after') || p.includes('tard')) {
        groups.tarde.push(slot);
      } else {
        groups.noche.push(slot);
      }
    }
    return groups;
  }, [availabilityData.slots]);

  const availableSlotsCount = useMemo(() => {
    return availabilityData.slots.filter((s) => s.available).length;
  }, [availabilityData.slots]);

  const currentPeriodSlots = useMemo(() => {
    return groupedSlots[selectedPeriodTab] || [];
  }, [groupedSlots, selectedPeriodTab]);

  const currentPeriodTitle = useMemo(() => {
    if (selectedPeriodTab === 'manana') return 'Mañana';
    if (selectedPeriodTab === 'tarde') return 'Tarde';
    return 'Noche';
  }, [selectedPeriodTab]);

  useEffect(() => {
    if (groupedSlots[selectedPeriodTab]?.length === 0) {
      if (groupedSlots.manana?.length > 0) setSelectedPeriodTab('manana');
      else if (groupedSlots.tarde?.length > 0) setSelectedPeriodTab('tarde');
      else if (groupedSlots.noche?.length > 0) setSelectedPeriodTab('noche');
    }
  }, [groupedSlots, selectedPeriodTab]);

  useEffect(() => {
    if (selectedSlot?.period) {
      const p = String(selectedSlot.period).toLowerCase();
      if (p.includes('morn') || p.includes('mañ')) setSelectedPeriodTab('manana');
      else if (p.includes('after') || p.includes('tard')) setSelectedPeriodTab('tarde');
      else setSelectedPeriodTab('noche');
    }
  }, [selectedSlot]);

  const selectedDayObj = useMemo(() => {
    return upcomingDays.find((d) => d.dateStr === selectedDate) || upcomingDays[0];
  }, [upcomingDays, selectedDate]);

  // Paso 3 -> Paso 4: Crear retención temporal si aplica
  const handleProceedToCustomerData = async () => {
    if (!selectedSlot) return;
    setBookingError('');
    setHoldTimer(480);

    try {
      const res = await api.post('/appointments/hold', {
        barberId: selectedBarberId,
        serviceId: activeService.id,
        startTime: selectedSlot.isoStartTime || selectedSlot.startTimeUTC || selectedSlot.time,
        sessionId: bookingSessionId,
        durationMinutes: serviceDuration,
      });
      const payload = res?.data || res;
      if (payload?.holdId) {
        setHoldAppointmentId(payload.holdId);
      }
    } catch (e) {
      // Si la retención suave falla o no es necesaria, validaremos transaccionalmente al confirmar
    }

    setStep(4);
  };

  // Enviar código OTP de 6 dígitos al correo del cliente
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setOtpState((prev) => ({ ...prev, error: '', message: '' }));
    setBookingError('');

    if (!formData.name.trim()) {
      setOtpState((prev) => ({ ...prev, error: 'Por favor ingresa tu nombre completo.' }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setOtpState((prev) => ({
        ...prev,
        error: 'Ingresa un correo electrónico válido para recibir tu código de verificación.',
      }));
      return;
    }

    if (!formData.acceptHabeas) {
      setOtpState((prev) => ({
        ...prev,
        error: 'Debes autorizar el tratamiento de datos personales (Ley 1581 de 2012) para continuar.',
      }));
      return;
    }

    setOtpState((prev) => ({ ...prev, Sending: true, error: '' }));
    try {
      const { data } = await api.post('/appointments/send-otp', {
        email: formData.email.trim().toLowerCase(),
        clientName: formData.name.trim(),
      });

      const devCode = data?.data?.devCode || null;
      setOtpState({
        sent: true,
        Sending: false,
        code: devCode || '',
        devHint: devCode,
        error: '',
        message:
          data?.message ||
          `Enviamos un código de 6 dígitos a ${formData.email.trim().toLowerCase()}.`,
      });
    } catch (err) {
      setOtpState((prev) => ({
        ...prev,
        Sending: false,
        error:
          err.response?.data?.message ||
          'No pudimos enviar el código de verificación. Verifica tu correo e inténtalo de nuevo.',
      }));
    }
  };

  // Confirmar cita directamente (Nombre, celular y correo — Sin código OTP)
  const handleConfirmBooking = async (e) => {
    if (e) e.preventDefault();
    setBookingError('');

    if (!formData.name.trim()) {
      setBookingError('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!formData.phone.trim()) {
      setBookingError('Por favor ingresa tu número de celular.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setBookingError('Ingresa un correo electrónico válido para recibir los detalles de tu cita.');
      return;
    }

    if (!formData.acceptHabeas) {
      setBookingError('Debes autorizar el tratamiento de datos personales para confirmar tu cita.');
      return;
    }

    setSubmittingBooking(true);
    try {
      const res = await api.post('/appointments', {
        barberId: selectedBarberId,
        serviceId: activeService.id,
        startTime: selectedSlot.isoStartTime || selectedSlot.startTimeUTC || selectedSlot.time,
        clientName: formData.name.trim(),
        clientPhone: formData.phone.trim(),
        phone: formData.phone.trim(),
        clientEmail: formData.email.trim().toLowerCase(),
        clientNotes: formData.notes.trim(),
        holdAppointmentId,
        holdId: holdAppointmentId,
        sessionId: bookingSessionId,
        productIds: selectedProductIds,
        acceptHabeasData: formData.acceptHabeas,
        privacyPolicyAccepted: formData.acceptHabeas,
      });

      const apt = res?.appointment || res?.data?.appointment || res?.data || res;
      setConfirmedAppointment(apt);
      setStep(5);
    } catch (err) {
      setBookingError(
        err.message || err.response?.data?.message ||
          'No fue posible confirmar la cita. Verifica tus datos o selecciona otro horario.'
      );
    } finally {
      setSubmittingBooking(false);
    }
  };

  const stepLabels = [
    { num: 1, label: 'Servicio' },
    { num: 2, label: 'Barbero' },
    { num: 3, label: 'Fecha y hora' },
    { num: 4, label: 'Verificación' },
    { num: 5, label: 'Confirmación' },
  ];

  return (
    <div className="max-w-[1320px] mx-auto pb-20 lg:pb-12">
      {/* Franja de Progreso "Línea de Punto Fino" — Sin numeración redundante en títulos */}
      <div className="bg-[#111215] border border-white/10 rounded-md p-5 sm:p-6 mb-8 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-[#9B988F] mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                shopStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-[#B89758]'
              }`}
            />
            <span className="font-semibold text-white">{shopStatus.label}</span>
            <span className="hidden sm:inline text-[#9B988F]">· {shopStatus.detail}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#cccccc]">
            <MapPin size={13} className="text-[#E15233]" />
            <span>{BUSINESS_CONFIG.location.shortAddress}</span>
          </div>
        </div>

        {/* Línea continua con puntos de cierre */}
        <div className="relative flex items-center justify-between pt-2">
          <div className="absolute left-0 right-0 top-[19px] h-[1px] bg-white/10" />
          <div
            className="absolute left-0 top-[19px] h-[1px] bg-[#B89758] transition-all duration-300"
            style={{ width: `${((Math.min(step, 5) - 1) / 4) * 100}%` }}
          />
          {stepLabels.map((item) => {
            const isDone = item.num < step || Boolean(confirmedAppointment);
            const isCurrent = item.num === step && !confirmedAppointment;
            return (
              <div key={item.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-sans font-semibold tabular-nums transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-black'
                      : isCurrent
                        ? 'bg-[#E15233] text-white ring-4 ring-[#E15233]/20'
                        : 'bg-[#18191E] text-[#9B988F] border border-white/15'
                  }`}
                >
                  {isDone ? <Check size={13} strokeWidth={2.5} /> : item.num}
                </div>
                <span
                  className={`text-[11px] font-sans mt-2 ${
                    isCurrent
                      ? 'text-white font-semibold'
                      : isDone
                        ? 'text-[#cccccc]'
                        : 'text-[#6A6862]'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Layout Principal: 2 Columnas en Escritorio (Paso activo a la izquierda + Recibo fijo a la derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Paso Activo (8 columnas) */}
        <div className="lg:col-span-8 space-y-6">
          {/* PASO 1: SELECCIÓN DE UN ÚNICO SERVICIO + PRODUCTOS OPCIONALES */}
          {step === 1 && (
            <div className="bg-[#111215] border border-white/10 rounded-md p-6 sm:p-8 space-y-8 shadow-xl">
              <div className="space-y-1.5 border-b border-white/10 pb-5">
                <span className="text-xs font-sans font-semibold text-[#B89758]">
                  Selección de servicio
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Elige tu servicio
                </h3>
                <p className="text-xs sm:text-sm font-sans text-[#9B988F]">
                  Selecciona el servicio que deseas agendar hoy. Cada reserva corresponde a un servicio individual o compuesto del catálogo.
                </p>
              </div>

              {/* Lista de Servicios (Radio Selection — Un solo servicio por reserva) */}
              <div className="space-y-3.5">
                {services.map((srv) => {
                  const isSelected = activeService?.id === srv.id;
                  const price = srv.priceCOP ?? srv.price ?? 24000;
                  const duration = srv.durationMinutes ?? srv.duration ?? 35;
                  const desc = srv.description || srv.desc;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedServiceId(srv.id)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedServiceId(srv.id);
                        }
                      }}
                      className={`p-5 rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#18191E] border-[#E15233] shadow-[0_0_0_1px_rgba(225,82,51,0.3)]'
                          : 'bg-[#14161A] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Radio circular */}
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border shrink-0 transition-all ${
                            isSelected
                              ? 'border-[#E15233] bg-[#E15233]'
                              : 'border-white/30 bg-[#0b0c0e]'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Fila superior sin superposición de etiquetas */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <h4 className="text-base sm:text-lg font-display font-bold text-white leading-snug">
                              {srv.name}
                            </h4>
                            {srv.badge && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-sans font-medium bg-[#B89758]/15 text-[#B89758] border border-[#B89758]/30 shrink-0">
                                {srv.badge}
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm font-sans text-[#9B988F] leading-relaxed mb-3">
                            {desc}
                          </p>

                          <div className="flex items-center gap-4 text-xs sm:text-sm font-sans tabular-nums">
                            <span className="font-bold text-white">
                              ${Number(price).toLocaleString('es-CO')} COP
                            </span>
                            <span className="text-[#9B988F] flex items-center gap-1">
                              <Clock size={13} className="text-[#B89758]" />
                              {duration} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Adicionales opcionales: "Lo que usamos contigo" (Rolda & Nevera) */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-sans font-semibold text-[#B89758] flex items-center gap-1.5">
                      <Sparkles size={13} /> Opcional · Lo que usamos contigo
                    </span>
                    <p className="text-xs font-sans text-[#9B988F] mt-0.5">
                      ¿Deseas apartar algún producto Rolda o bebida fría para tu cita?
                    </p>
                  </div>
                  {selectedProductIds.length > 0 && (
                    <span className="text-xs font-sans font-semibold text-emerald-400">
                      {selectedProductIds.length} seleccionado(s)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {products.map((prod) => {
                    const isAdded = selectedProductIds.includes(prod.id);
                    const pPrice = prod.priceCOP ?? prod.price ?? 0;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleProductSelection(prod.id)}
                        className={`p-3 rounded-md border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-[#18191E] border-[#B89758] text-white'
                            : 'bg-[#14161A] border-white/10 text-[#cccccc] hover:border-white/20'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-sans font-semibold text-white truncate">
                            {prod.name}
                          </div>
                          <div className="text-[11px] font-sans text-[#B89758] tabular-nums">
                            +${Number(pPrice).toLocaleString('es-CO')} COP
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            isAdded
                              ? 'bg-[#B89758] text-black'
                              : 'bg-white/5 text-[#9B988F]'
                          }`}
                        >
                          {isAdded ? <Check size={13} /> : <Plus size={13} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>Continuar con el barbero</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: SELECCIÓN DE BARBERO (Tipográfico, sin fotos ni cajas de iniciales ni estadísticas inventadas) */}
          {step === 2 && (
            <div className="bg-[#111215] border border-white/10 rounded-md p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-1.5 border-b border-white/10 pb-5">
                <span className="text-xs font-sans font-semibold text-[#B89758]">
                  Profesional a cargo
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  ¿Con quién te quieres atender?
                </h3>
                <p className="text-xs sm:text-sm font-sans text-[#9B988F]">
                  Elige a tu barbero o selecciona &ldquo;El primero disponible&rdquo; para ver todas las horas abiertas del equipo. Todos los barberos realizan todos los servicios al mismo precio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {barberOptions.map((b) => {
                  const isSelected = selectedBarberId === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBarberId(b.id)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedBarberId(b.id);
                        }
                      }}
                      className={`p-5 rounded-md border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#18191E] border-[#E15233] shadow-[0_0_0_1px_rgba(225,82,51,0.3)]'
                          : 'bg-[#14161A] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-sans font-medium text-[#B89758] block">
                              {b.roleLabel}
                            </span>
                            <h4 className="text-lg font-display font-bold text-white mt-0.5">
                              {b.name}
                            </h4>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-1 ${
                              isSelected
                                ? 'border-[#E15233] bg-[#E15233]'
                                : 'border-white/30 bg-[#0b0c0e]'
                            }`}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>

                        <p className="text-xs font-sans text-[#9B988F] leading-relaxed">
                          {b.bio}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-sans">
                        <span className="text-[#cccccc] flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#B89758]" />
                          {b.restDayLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-[#18191E] hover:bg-[#22242B] text-white border border-white/10 font-sans font-medium text-xs sm:text-sm px-5 py-3 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Volver a servicios</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>Ver horarios disponibles</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: FECHA Y HORA EN TIEMPO REAL (Agrupadas en Mañana, Tarde y Noche) */}
          {step === 3 && (
            <div className="bg-[#111215] border border-white/10 rounded-md p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-1.5 border-b border-white/10 pb-5">
                <span className="text-xs font-sans font-semibold text-[#B89758]">
                  Agenda en tiempo real · Zona horaria Cali
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Elige el día y la hora
                </h3>
                <p className="text-xs sm:text-sm font-sans text-[#9B988F]">
                  Horarios calculados según la duración de {activeService?.name} ({serviceDuration} min) y la agenda de {currentBarber.name}. Ninguna cita termina después del cierre del día.
                </p>
              </div>

              {/* Carrusel de Días */}
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {upcomingDays.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  const isBarberRestDay =
                    currentBarber.weeklyRestDay !== null &&
                    currentBarber.weeklyRestDay !== undefined &&
                    currentBarber.weeklyRestDay === d.dayOfWeek;

                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`px-4 py-3 rounded-md text-xs font-sans text-center shrink-0 border transition-all cursor-pointer min-w-[92px] ${
                        isSelected
                          ? 'border-[#E15233] bg-[#18191E] text-white shadow-sm'
                          : 'border-white/10 bg-[#14161A] text-[#9B988F] hover:border-white/25'
                      }`}
                    >
                      <div className="text-[11px] font-medium text-[#B89758]">
                        {d.isToday ? 'Hoy' : d.dayShort}
                      </div>
                      <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                        {d.dayNumber} {d.monthShort}
                      </div>
                      <div
                        className={`text-[10px] mt-1 font-medium ${
                          isBarberRestDay ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {isBarberRestDay ? 'Descanso' : 'Abierto'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Estado de carga o día de descanso */}
              {availabilityData.loading ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw size={22} className="animate-spin text-[#B89758] mx-auto" />
                  <p className="text-xs font-sans text-[#9B988F]">
                    Consultando disponibilidad real en sede Villacolombia...
                  </p>
                </div>
              ) : availabilityData.reason && availableSlotsCount === 0 ? (
                <div className="p-6 rounded-md bg-[#16181D] border border-amber-500/30 text-center space-y-3">
                  <p className="text-sm font-sans font-semibold text-amber-300">
                    {availabilityData.reason}
                  </p>
                  <p className="text-xs font-sans text-[#9B988F]">
                    Selecciona otro día en el calendario superior o cambia a &ldquo;El primero disponible&rdquo; para ver los horarios de los demás barberos del equipo.
                  </p>
                  {selectedBarberId !== 'any' && (
                    <button
                      type="button"
                      onClick={() => setSelectedBarberId('any')}
                      className="mt-2 bg-white text-black font-sans font-semibold text-xs px-4 py-2 rounded-md cursor-pointer"
                    >
                      Ver horarios con El primero disponible
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-[#9B988F]">
                    <span>
                      Franjas para el{' '}
                      <strong className="text-white">
                        {selectedDayObj?.dayName} {selectedDayObj?.dayNumber} de {selectedDayObj?.monthShort}
                      </strong>
                      {availabilityData.schedule?.openTime12h && (
                        <span>
                          {' '}
                          (Horario del local: {availabilityData.schedule.openTime12h} a{' '}
                          {availabilityData.schedule.closeTime12h})
                        </span>
                      )}
                    </span>
                    <span className="text-emerald-400 font-medium tabular-nums">
                      {availableSlotsCount} horarios disponibles
                    </span>
                  </div>

                  {/* Selector de Turno: Mañana, Tarde, Noche */}
                  <div className="bg-[#14161A] border border-white/10 rounded-xl p-1.5 flex items-center gap-2">
                    {[
                      { key: 'manana', label: 'Mañana', icon: Sun, list: groupedSlots.manana },
                      { key: 'tarde', label: 'Tarde', icon: SunMedium, list: groupedSlots.tarde },
                      { key: 'noche', label: 'Noche', icon: Moon, list: groupedSlots.noche },
                    ].map((tab) => {
                      const isActive = selectedPeriodTab === tab.key;
                      const Icon = tab.icon;
                      const count = tab.list.length;

                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setSelectedPeriodTab(tab.key)}
                          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-sans font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#22242B] text-white shadow-sm border border-white/15'
                              : 'text-[#9B988F] hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <Icon size={14} className={isActive ? 'text-[#B89758]' : 'text-[#6A6862]'} />
                          <span>{tab.label}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-bold ${
                              isActive ? 'bg-[#B89758] text-black' : 'bg-white/10 text-[#cccccc]'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Encabezado del turno activo con duración del servicio */}
                  <div className="flex items-center justify-between pt-1 border-b border-white/5 pb-2">
                    <h4 className="text-sm font-sans font-bold text-white">
                      {currentPeriodSlots.length} Horarios disponibles: {currentPeriodTitle}
                    </h4>
                    <span className="text-xs font-sans text-[#B89758] font-semibold tabular-nums">
                      Duración {serviceDuration} min
                    </span>
                  </div>

                  {/* Grilla de horarios del turno activo */}
                  {currentPeriodSlots.length === 0 ? (
                    <div className="py-8 text-center text-xs font-sans text-[#9B988F] border border-dashed border-white/10 rounded-lg">
                      No hay horarios disponibles en el turno de {currentPeriodTitle.toLowerCase()} para este día.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {currentPeriodSlots.map((slot) => {
                        const isSelected = selectedSlot?.time24 === slot.time24;
                        return (
                          <button
                            key={slot.time24}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 px-2 rounded-lg text-sm font-sans font-bold tabular-nums text-center border transition-all ${
                              isSelected
                                ? 'border-[#E15233] bg-[#E15233] text-white shadow-md cursor-pointer'
                                : slot.available
                                  ? 'border-white/10 bg-[#16181D] hover:border-[#B89758] hover:bg-[#202228] text-white cursor-pointer'
                                  : 'border-white/5 bg-[#0e1014] text-[#6A6862] opacity-40 cursor-not-allowed line-through'
                            }`}
                          >
                            {slot.time24}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Nota discreta de reserva temporal (Sin alarmas ni jerga de base de datos) */}
              {selectedSlot && (
                <div className="pt-2 flex items-center justify-between text-xs font-sans text-[#9B988F]">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-[#B89758]" />
                    Guardamos este horario por <strong className="text-white tabular-nums">{formatTimer(holdTimer)}</strong> mientras completas tus datos.
                  </span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#18191E] hover:bg-[#22242B] text-white border border-white/10 font-sans font-medium text-xs sm:text-sm px-5 py-3 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Cambiar barbero</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={handleProceedToCustomerData}
                  className="bg-[#E15233] hover:bg-[#C44327] disabled:opacity-40 text-white font-sans font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>Continuar con mis datos</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: DATOS DEL CLIENTE (NOMBRE, CELULAR Y CORREO) — CONFIRMACIÓN DIRECTA SIN OTP */}
          {step === 4 && !confirmedAppointment && (
            <div className="bg-[#111215] border border-white/10 rounded-md p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-1.5 border-b border-white/10 pb-5">
                <span className="text-xs font-sans font-semibold text-[#B89758]">
                  Confirmación de cita
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Tus datos para confirmar la cita
                </h3>
                <p className="text-xs sm:text-sm font-sans text-[#9B988F]">
                  Sin crear cuentas ni contraseñas. Completa tus datos para confirmar tu lugar en la silla. Te enviaremos de inmediato los detalles de tu cita y tu archivo .ics por correo electrónico.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B988F]" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#16181D] border border-white/15 focus:border-[#B89758] rounded-md pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6A6862] outline-none"
                      placeholder="Ej. Mateo Holguín"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Número de celular / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B988F]" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#16181D] border border-white/15 focus:border-[#B89758] rounded-md pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6A6862] outline-none"
                      placeholder="Ej. 312 345 6789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Correo electrónico (Recibirás la confirmación y tu cita .ics)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B988F]" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-[#16181D] border border-white/15 focus:border-[#B89758] rounded-md pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6A6862] outline-none"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Notas opcionales para tu barbero
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#16181D] border border-white/15 focus:border-[#B89758] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#6A6862] outline-none resize-none"
                    placeholder="Ej. Degradado medio con tijera arriba, piel sensible en el cuello..."
                  />
                </div>

                {/* Autorización Habeas Data Ley 1581 de 2012 */}
                <div className="pt-3 border-t border-white/10">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.acceptHabeas}
                      onChange={(e) =>
                        setFormData({ ...formData, acceptHabeas: e.target.checked })
                      }
                      className="mt-1 rounded border-white/20 bg-[#16181D] text-[#E15233] focus:ring-[#E15233]"
                    />
                    <span className="text-xs font-sans text-[#9B988F] leading-relaxed">
                      <strong className="text-white">Autorización Habeas Data:</strong> Autorizo el tratamiento de mis datos personales (nombre, celular y correo electrónico) conforme a la{' '}
                      <button
                        type="button"
                        onClick={() => setShowLegalModal(true)}
                        className="text-[#B89758] underline hover:text-white"
                      >
                        Política de Privacidad (Ley 1581 de 2012)
                      </button>{' '}
                      exclusivamente para la gestión y recordatorios de mi cita en Punto Fino.
                    </span>
                  </label>
                </div>

                {bookingError && (
                  <div className="p-3.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-sans flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{bookingError}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setHoldAppointmentId(null);
                    setBookingError('');
                    setStep(3);
                  }}
                  className="bg-[#18191E] hover:bg-[#22242B] text-white border border-white/10 font-sans font-medium text-xs sm:text-sm px-5 py-3 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Cambiar horario</span>
                </button>

                <button
                  type="button"
                  disabled={submittingBooking}
                  onClick={handleConfirmBooking}
                  className="bg-[#E15233] hover:bg-[#C44327] disabled:opacity-40 text-white font-sans font-semibold text-xs sm:text-sm px-7 py-3.5 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {submittingBooking ? 'Confirmando cita...' : 'Confirmar mi cita'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* PASO 5: CITA CONFIRMADA EXITOSAMENTE */}
          {(step === 5 || confirmedAppointment) && (
            <div className="bg-[#111215] border border-emerald-500/30 rounded-md p-6 sm:p-10 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-sans font-semibold text-emerald-400">
                  Cita confirmada en Punto Fino
                </span>
                <h3 className="text-3xl font-display font-bold text-white">
                  ¡Te esperamos, {formData.name.split(' ')[0]}!
                </h3>
                <p className="text-xs sm:text-sm font-sans text-[#9B988F] max-w-md mx-auto leading-relaxed">
                  Tu cita ha quedado agendada con{' '}
                  <strong className="text-white">
                    {confirmedAppointment?.barberNickname ||
                      confirmedAppointment?.barberName ||
                      confirmedAppointment?.appointment?.barberNickname ||
                      confirmedAppointment?.appointment?.barberName ||
                      currentBarber.name}
                  </strong>{' '}
                  para el{' '}
                  <strong className="text-white">
                    {selectedDayObj?.dayName} {selectedDayObj?.dayNumber} de{' '}
                    {selectedDayObj?.monthShort} a las{' '}
                    {selectedSlot?.time12 ||
                      selectedSlot?.time ||
                      selectedSlot?.label12h ||
                      selectedSlot?.time24}
                  </strong>
                  .
                </p>
              </div>

              {/* Código de Reserva (Único lugar donde se usa fuente monoespaciada) */}
              <div className="inline-block px-6 py-4 rounded-md bg-[#16181D] border border-white/10">
                <div className="text-[11px] font-sans text-[#9B988F]">Código de reserva</div>
                <div className="text-2xl font-mono font-bold text-[#B89758] tracking-widest mt-0.5">
                  {confirmedAppointment?.bookingCode ||
                    confirmedAppointment?.appointment?.bookingCode ||
                    'PF-CONFIRMADA'}
                </div>
              </div>

              {/* Acciones de Calendario y Cómo Llegar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {confirmedAppointment?.calendar?.googleCalendarUrl && (
                  <a
                    href={confirmedAppointment.calendar.googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-semibold text-xs px-5 py-3 rounded-md inline-flex items-center gap-2 transition-all"
                  >
                    <Calendar size={14} />
                    <span>Agregar a Google Calendar</span>
                  </a>
                )}

                <a
                  href={BUSINESS_CONFIG.location.googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#18191E] hover:bg-[#22242B] text-white border border-white/15 font-sans font-medium text-xs px-5 py-3 rounded-md inline-flex items-center gap-2 transition-all"
                >
                  <MapPin size={14} className="text-[#E15233]" />
                  <span>Cómo llegar (Carrera 12 #53-51)</span>
                </a>
              </div>

              {/* Política de Cancelación de 3 Horas y Autogestión por Correo */}
              <div className="p-4 rounded-md bg-[#16181D] border border-white/10 text-xs font-sans text-[#9B988F] max-w-lg mx-auto space-y-1.5 text-left">
                <div className="font-semibold text-white">
                  Confirmación y autogestión enviada a {formData.email}
                </div>
                <p className="leading-relaxed">
                  Enviamos a tu correo electrónico el comprobante con el archivo de calendario (`.ics`) y un enlace seguro de un solo uso. Puedes reprogramar tu cita (conservando el mismo barbero) o cancelarla sin costo hasta{' '}
                  <strong className="text-white">3 horas antes</strong> de la hora agendada.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Resumen Vivo (Recibo Fijo en Escritorio — 4 columnas) */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-28">
          <div className="bg-[#111215] border border-white/10 rounded-md p-6 space-y-5 shadow-xl">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[11px] font-sans font-semibold text-[#B89758] block">
                Resumen de tu cita
              </span>
              <h4 className="font-display text-lg font-bold text-white mt-0.5">
                Punto Fino · Villacolombia
              </h4>
              <p className="text-xs font-sans text-[#9B988F] mt-0.5">
                {BUSINESS_CONFIG.location.address}, Cali
              </p>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* Servicio seleccionado */}
              <div>
                <span className="text-[#9B988F] block mb-1">Servicio seleccionado</span>
                <div className="flex items-start justify-between gap-2 text-white font-semibold">
                  <span>{activeService?.name}</span>
                  <span className="tabular-nums shrink-0">
                    ${Number(servicePrice).toLocaleString('es-CO')}
                  </span>
                </div>
                <span className="text-[11px] text-[#B89758] tabular-nums">
                  Duración: {serviceDuration} minutos
                </span>
              </div>

              {/* Productos adicionales opcionales */}
              {selectedProductsList.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-1.5">
                  <span className="text-[#9B988F] block">Lo que usamos contigo</span>
                  {selectedProductsList.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between text-[#cccccc]"
                    >
                      <span className="truncate pr-2">+ {prod.name}</span>
                      <span className="tabular-nums shrink-0">
                        ${Number(prod.priceCOP ?? prod.price ?? 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Barbero */}
              <div className="pt-3 border-t border-white/5">
                <span className="text-[#9B988F] block mb-0.5">Barbero</span>
                <div className="text-white font-semibold">{currentBarber.name}</div>
                <div className="text-[11px] text-[#9B988F]">{currentBarber.restDayLabel}</div>
              </div>

              {/* Fecha y hora */}
              <div className="pt-3 border-t border-white/5">
                <span className="text-[#9B988F] block mb-0.5">Fecha y hora</span>
                {selectedSlot ? (
                  <div className="text-white font-semibold tabular-nums">
                    {selectedDayObj?.dayName} {selectedDayObj?.dayNumber} de{' '}
                    {selectedDayObj?.monthShort} · {selectedSlot.label12h || selectedSlot.time}
                  </div>
                ) : (
                  <div className="text-[#6A6862]">Pendiente de elegir horario</div>
                )}
              </div>
            </div>

            {/* Total en COP */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-sans text-[#9B988F]">Total a pagar en sede</span>
                <span className="text-xl font-sans font-bold text-white tabular-nums">
                  ${Number(totalPriceCOP).toLocaleString('es-CO')} COP
                </span>
              </div>
              <p className="text-[11px] font-sans text-[#6A6862] mt-1">
                Solo Efectivo o Transacción presencial en sede tras recibir tu servicio. Sin cobros anticipados ni facturación electrónica.
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 text-[11px] font-sans text-[#9B988F] flex items-start gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Cancelación o reprogramación gratuita hasta 3 horas antes desde tu correo.
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Barra Inferior Fija de Resumen en Móvil (375px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#111215]/95 backdrop-blur-md border-t border-white/15 px-4 py-3 shadow-2xl">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-sans font-semibold text-white truncate">
              {activeService?.name}
            </div>
            <div className="text-[11px] font-sans text-[#9B988F] tabular-nums truncate">
              {currentBarber.name}
              {selectedSlot ? ` · ${selectedSlot.label12h || selectedSlot.time}` : ` · ${serviceDuration} min`}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-sans font-bold text-[#B89758] tabular-nums">
              ${Number(totalPriceCOP).toLocaleString('es-CO')} COP
            </div>
            <div className="text-[10px] font-sans text-[#9B988F]">Paso {step} de 5</div>
          </div>
        </div>
      </div>

      {/* Modal de Habeas Data Ley 1581 */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111215] border border-white/20 rounded-md p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-base text-white">
                Política de Tratamiento de Datos (Ley 1581 de 2012)
              </h3>
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                className="text-[#9B988F] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="text-xs font-sans text-[#cccccc] space-y-3 max-h-64 overflow-y-auto pr-2 leading-relaxed">
              <p>
                <strong>Punto Fino (Carrera 12 #53-51, Barrio Villacolombia, Cali, Colombia)</strong> informa que los datos personales recolectados (nombre completo y correo electrónico) serán tratados conforme a la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013.
              </p>
              <p>
                <strong>Finalidad:</strong> Gestión de la reserva en agenda, envío del código único de verificación, despacho del comprobante transaccional con archivo de calendario (`.ics`) y recordatorios por correo electrónico.
              </p>
              <p>
                <strong>Ejercicio de Derechos (Habeas Data):</strong> Como titular puedes conocer, actualizar, rectificar o suprimir tus datos escribiendo al correo oficial{' '}
                <code>{BUSINESS_CONFIG.contact.privacyEmail}</code> o mediante el formulario de contacto en línea de la plataforma.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLegalModal(false)}
              className="w-full bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-semibold text-xs py-3 rounded-md cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
