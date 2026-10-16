import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, MessageCircle, Clock, Calendar, ArrowRight, ExternalLink, Compass, ShieldCheck } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

// Estilo de mapa sobrio en tonos oscuros (Dark Barber Palette)
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [inView, setInView] = useState(false);

  const { location, contact, hours } = BUSINESS_CONFIG;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasValidApiKey = Boolean(apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' && !apiKey.includes('fake'));

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

        // Marcador personalizado de la marca Punto Fino (SVG sin el pin rojo genérico)
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

        if (isMounted) {
          setMapLoaded(true);
        }
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

  return (
    <section 
      ref={sectionRef} 
      id="como-llegar" 
      className="py-24 sm:py-32 bg-[#0b0c0e] border-b border-white/10 text-white scroll-mt-24 relative"
    >
      {/* Anchor de compatibilidad */}
      <span id="ubicacion" className="absolute -top-24 left-0"></span>

      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        {/* Encabezado de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 bg-[#E15233] rounded-none"></span>
              <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[#E15233] font-bold">
                06 · CÓMO LLEGAR & SEDE
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight leading-tight">
              Sede Villacolombia · Cali
            </h2>
          </div>
          <p className="font-sans text-sm sm:text-base text-[#9B988F] max-w-lg mt-4 md:mt-0 leading-relaxed">
            Te esperamos en nuestra sede de la Carrera 12 en el tradicional barrio Villacolombia. Espacio climatizado, música selecta y atención puntual con cita reservada.
          </p>
        </div>

        {/* Grid Principal: Info / Referencias / Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Tarjeta de Información y Referencias (5 columnas) */}
          <div className="lg:col-span-5 bg-[#111215] border border-white/10 rounded-md p-6 sm:p-8 flex flex-col justify-between space-y-7 shadow-xl">
            {/* Dirección y Sede */}
            <div className="space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#B89758] font-bold block">
                Dirección Oficial
              </span>
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
                    {location.neighborhood} · {location.city}, {location.department}
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={location.googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-[#EFECE4] text-black font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-md inline-flex items-center gap-2 transition-all shadow-sm"
                >
                  <ExternalLink size={13} />
                  <span>Abrir en Google Maps</span>
                </a>

                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#18191E] hover:bg-[#22242B] text-white border border-white/10 font-sans font-medium text-xs px-4 py-2.5 rounded-md inline-flex items-center gap-2 transition-all"
                >
                  <MessageCircle size={14} className="text-[#25D366]" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Referencias Editables para llegar a Villacolombia */}
            <div className="pt-5 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-[#B89758]" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#B89758] font-bold">
                  Referencias para llegar
                </span>
              </div>
              <ul className="space-y-2 text-xs font-sans text-[#cccccc]">
                {location.references.map((ref, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#E15233] font-bold shrink-0">•</span>
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Horarios de Atención */}
            <div className="pt-5 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#B89758]" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#B89758] font-bold">
                  Horarios de Atención
                </span>
              </div>
              <div className="divide-y divide-white/5 font-sans text-xs">
                <div className="py-2 flex justify-between items-center">
                  <span className="text-[#9B988F]">Lunes</span>
                  <span className="font-mono text-white font-medium bg-[#18191E] px-2.5 py-0.5 rounded border border-white/10">
                    {hours.monday}
                  </span>
                </div>
                <div className="py-2 flex justify-between items-center">
                  <span className="text-[#9B988F]">Martes a Sábado</span>
                  <span className="font-mono text-white font-medium bg-[#18191E] px-2.5 py-0.5 rounded border border-white/10">
                    {hours.tuesdayToSaturday}
                  </span>
                </div>
                <div className="py-2 flex justify-between items-center">
                  <span className="text-[#9B988F]">Domingos</span>
                  <span className="font-mono text-[#B89758] font-bold bg-[#18191E] px-2.5 py-0.5 rounded border border-[#B89758]/30">
                    {hours.sunday}
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso de Privacidad y Cookies de Terceros */}
            <div className="pt-3 border-t border-white/5 text-[11px] text-[#6A6862] flex items-center gap-2">
              <ShieldCheck size={13} className="shrink-0 text-[#9B988F]" />
              <span>Mapa interactivo con Google Maps. Sujeto a la política de cookies y privacidad.</span>
            </div>
          </div>

          {/* Contenedor del Mapa / Respaldo Elegante (7 columnas) */}
          <div className="lg:col-span-7 bg-[#111215] border border-white/10 rounded-md overflow-hidden relative min-h-[420px] lg:min-h-full flex flex-col shadow-2xl">
            {/* Si la API key está disponible y no hay error, renderiza el mapa de Google */}
            {hasValidApiKey && !mapError ? (
              <div 
                ref={mapContainerRef} 
                className="w-full h-full min-h-[460px] bg-[#16181d]" 
              />
            ) : (
              /* Respaldo elegante con coordenadas exactas, textura sobria y marcador de marca */
              <div className="w-full h-full min-h-[460px] p-8 sm:p-12 flex flex-col justify-between relative bg-gradient-to-br from-[#16181D] via-[#111215] to-[#0B0C0E]">
                {/* Patrón reticular de fondo */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Badge Superior */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#cccccc]">
                      Ubicación Verificada en Cali
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#B89758] bg-[#18191E] border border-white/10 px-2.5 py-1 rounded">
                    {location.coordinates.lat}° N, {Math.abs(location.coordinates.lng)}° W
                  </span>
                </div>

                {/* Marcador Central de Autor */}
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
                  <p className="font-mono text-xs text-[#B89758] mt-2">
                    Punto Fino · Corte & Cuidado Masculino
                  </p>
                </div>

                {/* Barra Inferior con CTA directo */}
                <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-[#9B988F] font-sans text-center sm:text-left">
                    ¿Vas en camino? Te guiamos paso a paso con Google Maps o Waze.
                  </span>
                  <a
                    href={location.googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-md inline-flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <span>Abrir Indicaciones</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
