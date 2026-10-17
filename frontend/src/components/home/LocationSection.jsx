import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Mail,
  Clock,
  ArrowRight,
  ExternalLink,
  Compass,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  BUSINESS_CONFIG,
  OFFICIAL_SCHEDULES,
  formatTime12h,
  getShopStatus,
} from '../../config/businessConfig';
import api from '../../services/api';

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#16181d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#16181d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8d8b82' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c4a66a' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#77756f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1c221e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#25272e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1c22' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9b988f' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#32353e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2026' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1014' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#52545c' }],
  },
];

export default function LocationSection() {
  const mapContainerRef = useRef(null);
  const sectionRef = useRef(null);
  const [mapError, setMapError] = useState(false);
  const [inView, setInView] = useState(false);
  const [shopStatus, setShopStatus] = useState(() => getShopStatus());
  const [schedules, setSchedules] = useState(OFFICIAL_SCHEDULES);

  // Estado del Formulario de Contacto Web
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  const { location, contact } = BUSINESS_CONFIG;
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasValidApiKey = Boolean(
    apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' && !apiKey.includes('fake')
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setShopStatus(getShopStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api
      .get('/schedules')
      .then(({ data }) => {
        if (data?.data?.schedules?.length === 7) {
          setSchedules(data.data.schedules);
        }
      })
      .catch(() => {});
  }, []);

  // Lazy loading con IntersectionObserver para cuidar los datos móviles
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Carga e inicialización de Google Maps API
  useEffect(() => {
    if (!inView || !hasValidApiKey) return;

    let isMounted = true;

    const initMap = () => {
      if (!window.google || !window.google.maps || !mapContainerRef.current) {
        setMapError(true);
        return;
      }

      try {
        const center = {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng,
        };

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 16.5,
          styles: DARK_MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        });

        const markerSvg = `
          <svg width="44" height="54" viewBox="0 0 44 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 0C9.85 0 0 9.85 0 22C0 36.5 22 54 22 54C22 54 44 36.5 44 22C44 9.85 34.15 0 22 0Z" fill="#18191E" stroke="#E15233" stroke-width="2.5"/>
            <circle cx="22" cy="22" r="14" fill="#111215" stroke="#B89758" stroke-width="1.5"/>
            <path d="M17 19L27 25M27 19L17 25" stroke="#F7F5F0" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;

        const customMarkerIcon = {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
          scaledSize: new window.google.maps.Size(44, 54),
          anchor: new window.google.maps.Point(22, 54),
        };

        const marker = new window.google.maps.Marker({
          position: center,
          map,
          title: 'Punto Fino · Sede Villacolombia',
          icon: customMarkerIcon,
          animation: window.google.maps.Animation.DROP,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color: #111215; padding: 6px; font-family: sans-serif;">
              <strong style="font-size: 14px; color: #111215;">Punto Fino</strong>
              <p style="margin: 4px 0 0; font-size: 12px; color: #555;">Carrera 12 #53-51 · Villacolombia</p>
              <a href="${location.googleMapsDirectionsUrl}" target="_blank" style="display: inline-block; margin-top: 6px; font-size: 11px; color: #E15233; font-weight: bold; text-decoration: none;">Cómo llegar →</a>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      } catch (err) {
        console.error('Error inicializando Google Maps:', err);
        if (isMounted) setMapError(true);
      }
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        script.onerror = () => {
          if (isMounted) setMapError(true);
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initMap);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [inView, hasValidApiKey, location]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactError('');
    setContactSuccess('');

    if (
      !contactForm.name.trim() ||
      !contactForm.email.trim() ||
      !contactForm.subject.trim() ||
      !contactForm.message.trim()
    ) {
      setContactError('Por favor completa todos los campos del formulario.');
      return;
    }

    setContactLoading(true);
    try {
      const { data } = await api.post('/contact', contactForm);
      setContactSuccess(
        data?.message ||
          'Tu mensaje fue recibido por la administración de Punto Fino. Te responderemos a tu correo.'
      );
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setContactError(
        err.response?.data?.message ||
          'No pudimos enviar el mensaje en este momento. Intenta de nuevo en unos segundos.'
      );
    } finally {
      setContactLoading(false);
    }
  };

  // Ordenar horarios Lunes (1) -> Sábado (6) -> Domingo (0)
  const orderedSchedules = [...schedules].sort((a, b) => {
    const orderA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const orderB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return orderA - orderB;
  });

  return (
    <section
      ref={sectionRef}
      id="como-llegar"
      className="py-24 sm:py-32 bg-[#0b0c0e] border-b border-white/10 text-white scroll-mt-24 relative"
    >
      <span id="ubicacion" className="absolute -top-24 left-0"></span>

      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16 space-y-12">
        {/* Encabezado de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8">
          <div>
            <span className="font-sans text-xs text-[#E15233] font-semibold block mb-2">
              Ubicación, horarios oficiales y contacto
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white font-bold tracking-tight leading-tight">
              Cómo llegar a Punto Fino
            </h2>
          </div>
          <p className="font-sans text-sm sm:text-base text-[#9B988F] max-w-lg mt-4 md:mt-0 leading-relaxed">
            Te esperamos en nuestra sede única de la Carrera 12 #53-51 en el barrio Villacolombia, Santiago de Cali. Atención los 7 días de la semana.
          </p>
        </div>

        {/* Grid Principal: Info + Horarios / Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Tarjeta de Información y Horarios de los 7 Días (5 columnas) */}
          <div className="lg:col-span-5 bg-[#111215] border border-white/10 rounded-md p-6 sm:p-8 flex flex-col justify-between space-y-7 shadow-xl">
            {/* Dirección y Sede */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-xs text-[#B89758] font-semibold">
                  Dirección oficial
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-sans font-medium ${
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

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-md bg-[#18191E] border border-white/10 flex items-center justify-center text-[#E15233] shrink-0 mt-0.5">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-white font-bold leading-tight">
                    Punto Fino
                  </h3>
                  <p className="font-sans text-sm text-[#F7F5F0] font-medium mt-1">
                    {location.address}
                  </p>
                  <p className="font-sans text-xs text-[#9B988F]">
                    Barrio {location.neighborhood} · {location.city}, {location.department}
                  </p>
                </div>
              </div>

              {/* Botones de Acción (Google Maps y Correo) */}
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={location.googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-[#EFECE4] text-black font-sans font-semibold text-xs px-4 py-2.5 rounded-md inline-flex items-center gap-2 transition-all shadow-sm"
                >
                  <ExternalLink size={13} />
                  <span>Abrir en Google Maps</span>
                </a>

                <a
                  href="#contacto"
                  className="bg-[#18191E] hover:bg-[#22242B] text-white border border-white/10 font-sans font-medium text-xs px-4 py-2.5 rounded-md inline-flex items-center gap-2 transition-all"
                >
                  <Mail size={14} className="text-[#B89758]" />
                  <span>Escribir al administrador</span>
                </a>
              </div>
            </div>

            {/* Referencias Editables para llegar a Villacolombia */}
            <div className="pt-5 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-[#B89758]" />
                <span className="font-sans text-xs text-[#B89758] font-semibold">
                  Referencias para llegar a Villacolombia
                </span>
              </div>
              <ul className="space-y-2 text-xs font-sans text-[#cccccc]">
                {(location.references || location.arrivalReferences || []).map((ref, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#E15233] font-bold shrink-0">•</span>
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Horarios Oficiales (7 días con Hoy resaltado) */}
            <div className="pt-5 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#B89758]" />
                  <span className="font-sans text-xs text-[#B89758] font-semibold">
                    Horarios oficiales de atención
                  </span>
                </div>
                <span className="text-[11px] font-sans text-[#9B988F]">
                  {shopStatus.detail}
                </span>
              </div>

              <div className="divide-y divide-white/5 font-sans text-xs">
                {orderedSchedules.map((sched) => {
                  const isToday = shopStatus.todayDayOfWeek === sched.dayOfWeek;
                  return (
                    <div
                      key={sched.dayOfWeek}
                      className={`py-2 px-2.5 flex justify-between items-center rounded ${
                        isToday ? 'bg-[#18191E] border border-[#B89758]/40 text-white font-semibold' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={isToday ? 'text-white' : 'text-[#9B988F]'}>
                          {sched.dayName}
                        </span>
                        {isToday && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#B89758]/20 text-[#B89758] font-semibold">
                            Hoy
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums text-white font-medium">
                        {sched.isOpen
                          ? `${formatTime12h(sched.openTime)} a ${formatTime12h(sched.closeTime)}`
                          : 'Cerrado'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-[#9B988F] pt-1 leading-relaxed">
                Nota: Los días festivos abrimos en jornada de domingo (9:00 a. m. a 4:00 p. m.). Las excepciones y cierres especiales se gestionan desde el panel del administrador.
              </p>
            </div>

            {/* Aviso de Privacidad y Cookies de Terceros */}
            <div className="pt-3 border-t border-white/5 text-[11px] text-[#6A6862] flex items-center gap-2">
              <ShieldCheck size={13} className="shrink-0 text-[#9B988F]" />
              <span>Mapa interactivo con Google Maps. Sujeto a la política de cookies y privacidad.</span>
            </div>
          </div>

          {/* Contenedor del Mapa / Respaldo Elegante (7 columnas) */}
          <div className="lg:col-span-7 bg-[#111215] border border-white/10 rounded-md overflow-hidden relative min-h-[460px] lg:min-h-full flex flex-col shadow-2xl">
            {hasValidApiKey && !mapError ? (
              <div
                ref={mapContainerRef}
                className="w-full h-full min-h-[460px] bg-[#16181d]"
              />
            ) : (
              <div className="w-full h-full min-h-[460px] p-8 sm:p-12 flex flex-col justify-between relative bg-gradient-to-br from-[#16181D] via-[#111215] to-[#0B0C0E]">
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-sans text-xs text-[#cccccc] font-medium">
                      Ubicación verificada en Cali
                    </span>
                  </div>
                  <span className="font-sans text-xs text-[#B89758] bg-[#18191E] border border-white/10 px-2.5 py-1 rounded tabular-nums">
                    {location.coordinates.lat}° N, {Math.abs(location.coordinates.lng)}° W
                  </span>
                </div>

                <div className="relative z-10 my-auto text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-[#18191E] border-2 border-[#E15233] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(225,82,51,0.25)]">
                    <MapPin size={36} className="text-[#E15233]" />
                  </div>
                  <h3 className="font-display text-3xl font-bold text-white mb-2">
                    Carrera 12 #53-51
                  </h3>
                  <p className="font-sans text-sm text-[#9B988F] max-w-sm mx-auto leading-relaxed">
                    Barrio Villacolombia, Comuna 8 · Santiago de Cali
                  </p>
                  <p className="font-sans text-xs text-[#B89758] mt-2 font-medium">
                    Punto Fino · Corte & Cuidado Masculino
                  </p>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-[#9B988F] font-sans text-center sm:text-left">
                    ¿Vas en camino? Abre las indicaciones directas hacia Carrera 12 #53-51.
                  </span>
                  <a
                    href={location.googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-semibold text-xs px-5 py-3 rounded-md inline-flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <span>Abrir indicaciones</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Contacto Web Directo al Administrador */}
        <div
          id="contacto"
          className="bg-[#111215] border border-white/10 rounded-md p-6 sm:p-10 shadow-xl scroll-mt-28"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-3">
              <span className="font-sans text-xs text-[#B89758] font-semibold block">
                Canal oficial de comunicación
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Escríbenos directamente
              </h3>
              <p className="font-sans text-sm text-[#9B988F] leading-relaxed">
                ¿Tienes alguna consulta sobre tu cita, nuestros productos Rolda o el ejercicio de tus derechos de Habeas Data? Envíanos un mensaje y el administrador te responderá a tu correo electrónico.
              </p>
              <div className="pt-2 text-xs font-sans text-[#cccccc] space-y-1">
                <p>
                  <strong className="text-white">Correo de contacto:</strong> {contact.email}
                </p>
                <p>
                  <strong className="text-white">Sede:</strong> {location.fullAddress}
                </p>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="lg:col-span-7 space-y-4">
              {contactSuccess && (
                <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-sans flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                  <span>{contactSuccess}</span>
                </div>
              )}

              {contactError && (
                <div className="p-4 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-sans flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                  <span>{contactError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Ej. Andrés Felipe"
                    className="w-full bg-[#16181D] border border-white/15 focus:border-[#B89758] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#6A6862] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="tu@correo.com"
                    className="w-full bg-[#16181D] border border-white/15 focus:border-[#B89758] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#6A6862] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                  Asunto
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Consulta sobre reserva, horarios o productos"
                  className="w-full bg-[#16181D] border border-white/15 focus:border-[#B89758] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#6A6862] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#cccccc] mb-1.5">
                  Mensaje
                </label>
                <textarea
                  rows={3}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Escribe tu mensaje para el administrador de Punto Fino..."
                  className="w-full bg-[#16181D] border border-white/15 focus:border-[#B89758] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#6A6862] outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={contactLoading}
                  className="bg-[#E15233] hover:bg-[#C44327] disabled:opacity-50 text-white font-sans font-semibold text-xs px-6 py-3 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send size={14} />
                  <span>{contactLoading ? 'Enviando mensaje...' : 'Enviar mensaje al administrador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
