import React, { useState } from 'react';
import { 
  Scissors, Sparkles, Clock, CheckCircle2, AlertCircle, 
  Copy, Check, Phone, ShieldCheck, Calendar, ArrowRight, User
} from 'lucide-react';

export default function DesignSystemView() {
  const [copiedToken, setCopiedToken] = useState(null);

  const copyToClipboard = (text, tokenName) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const colors = [
    { name: 'Tinta Carbón (Base)', hex: '#111215', desc: 'Fondo mate profundo, inspirado en el interior del local', role: 'bg-pf-carbon' },
    { name: 'Superficie Studio', hex: '#18191E', desc: 'Cards, barras de navegación y modales', role: 'bg-pf-surface' },
    { name: 'Elevado / Inputs', hex: '#22242B', desc: 'Controles, inputs y bordes activos', role: 'bg-pf-elevated' },
    { name: 'Terracota Caleño', hex: '#E15233', desc: 'Acento primario vibrante, el calor de la tarde en Cali', role: 'bg-pf-terracota' },
    { name: 'Latón Ahumado', hex: '#B89758', desc: 'Acento noble de tijeras, cuchillas y herrajes', role: 'bg-pf-brass' },
    { name: 'Lino Hueso (Canvas)', hex: '#F7F5F0', desc: 'Texto principal y soporte de alta legibilidad', role: 'bg-pf-bone' },
    { name: 'Arena Suave', hex: '#EFECE4', desc: 'Fondos secundarios cálidos', role: 'bg-pf-sand' },
    { name: 'Gris Muted', hex: '#9B988F', desc: 'Textos secundarios, subtítulos y metadatos', role: 'bg-pf-muted' },
    { name: 'Verde Disponible', hex: '#2EA063', desc: 'Punto de estado libre, turnos abiertos', role: 'bg-pf-available' },
    { name: 'Ámbar En Silla', hex: '#D9822B', desc: 'Servicio en proceso, cliente en atención', role: 'bg-pf-busy' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Encabezado */}
      <div className="border-b border-white/10 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pf-terracota/10 border border-pf-terracota/30 text-pf-terracota text-xs font-mono mb-4">
          <span className="w-2 h-2 rounded-full bg-pf-terracota animate-pulse" />
          DESIGN SYSTEM DOCUMENTADO · V1.0
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-pf-bone tracking-tight">
          Sistema de Diseño <span className="text-pf-terracota">Punto Fino</span>
        </h1>
        <p className="mt-3 text-pf-muted max-w-3xl text-base leading-relaxed">
          Diseñado para una barbería de barrio en Santiago de Cali, Colombia. Transmite oficio, precisión milimétrica y cercanía de vecino, sin recurrir a clichés de plantilla, negro-dorado vintage ni estética corporativa fría.
        </p>
      </div>

      {/* 1. Manifiesto y Voz de Marca */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-pf-bone flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pf-terracota" />
            1. Manifiesto de Marca & Tono de Voz Caleño
          </h2>
          <span className="text-xs font-mono text-pf-muted uppercase tracking-wider">Identidad Verbal</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="pf-card p-5 bg-pf-surface/60 space-y-3">
            <span className="text-xs font-mono text-pf-terracota font-bold uppercase tracking-wider">Cercano pero con oficio</span>
            <h3 className="font-display font-bold text-base text-pf-bone">Trato de vecino de Cali</h3>
            <p className="text-xs text-pf-muted leading-relaxed">
              Hablamos como el caleño real: respetuoso, cálido, directo y seguro de lo que hace con las manos. Nada de lenguaje robótico ni fórmulas corporativas.
            </p>
            <div className="p-3 bg-pf-carbon rounded border border-white/5 text-xs font-mono text-pf-bone">
              <span className="text-pf-available">✔ Sí:</span> "¿Qué hubo, ve? Elegí tu barbero y tu hora. Te guardamos el puesto."
            </div>
          </div>

          <div className="pf-card p-5 bg-pf-surface/60 space-y-3">
            <span className="text-xs font-mono text-pf-brass font-bold uppercase tracking-wider">La precisión del detalle</span>
            <h3 className="font-display font-bold text-base text-pf-bone">El concepto "Punto Fino"</h3>
            <p className="text-xs text-pf-muted leading-relaxed">
              La línea exacta donde un degradado queda limpio, el ángulo correcto de la navaja y el ritual de vapor de ozono que prepara la piel con dedicación.
            </p>
            <div className="p-3 bg-pf-carbon rounded border border-white/5 text-xs font-mono text-pf-bone">
              <span className="text-pf-terracota">✔ Enfoque:</span> Cada corte se toma el tiempo que merece, sin afanes.
            </div>
          </div>

          <div className="pf-card p-5 bg-pf-surface/60 space-y-3">
            <span className="text-xs font-mono text-pf-available font-bold uppercase tracking-wider">Cero clichés de plantilla</span>
            <h3 className="font-display font-bold text-base text-pf-bone">Autenticidad Urbana</h3>
            <p className="text-xs text-pf-muted leading-relaxed">
              Prohibidos el dorado chillón, calaveras, postes tricolor o personitas de ilustración corporativa. Fotografía real del equipo y clientes en Cali.
            </p>
            <div className="p-3 bg-pf-carbon rounded border border-white/5 text-xs font-mono text-pf-bone">
              <span className="text-rose-400">✖ No:</span> "¡Bienvenido al club de caballeros más exclusivo de la ciudad!"
            </div>
          </div>
        </div>
      </section>

      {/* 2. Paleta Cromática y Tokens */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-pf-bone flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pf-brass" />
            2. Paleta de Color & Tokens Semánticos
          </h2>
          <span className="text-xs font-mono text-pf-muted uppercase tracking-wider">Tokens CSS & Tailwind</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {colors.map((c) => (
            <div 
              key={c.name}
              onClick={() => copyToClipboard(c.hex, c.name)}
              className="pf-card p-4 hover:border-pf-terracota/60 cursor-pointer group transition-all"
            >
              <div 
                className="w-full h-16 rounded-md mb-3 border border-white/10 shadow-inner flex items-end justify-end p-1.5"
                style={{ backgroundColor: c.hex }}
              >
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                  {copiedToken === c.name ? <Check className="w-3 h-3 text-pf-available inline" /> : c.hex}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-pf-bone truncate">{c.name}</div>
                <div className="text-[11px] font-mono text-pf-muted">{c.role}</div>
                <div className="text-[11px] text-pf-subtle line-clamp-2 leading-tight mt-1">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Tipografía */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-pf-bone flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pf-terracota" />
            3. Jerarquía Tipográfica de Autor
          </h2>
          <span className="text-xs font-mono text-pf-muted uppercase tracking-wider">Syne + Plus Jakarta Sans + JetBrains Mono</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="pf-card p-6 space-y-4">
            <div className="text-xs font-mono text-pf-terracota uppercase tracking-wider font-semibold">Titulares & Display</div>
            <div className="text-2xl font-display font-extrabold text-pf-bone">Syne (Bold / ExtraBold)</div>
            <p className="text-xs text-pf-muted leading-relaxed">
              Corte tipográfico contemporáneo con carácter escultórico. Transmite destreza técnica, filo y orgullo barbero.
            </p>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="font-display text-xl font-bold">Punto Fino Barbería</div>
              <div className="font-display text-sm font-semibold text-pf-muted">El arte del degradado en Cali</div>
            </div>
          </div>

          <div className="pf-card p-6 space-y-4">
            <div className="text-xs font-mono text-pf-brass uppercase tracking-wider font-semibold">Interfaz & Lectura</div>
            <div className="text-2xl font-sans font-bold text-pf-bone">Plus Jakarta Sans</div>
            <p className="text-xs text-pf-muted leading-relaxed">
              Geometría ultra-limpia con altura de x generosa, garantizando legibilidad inmediata en celulares bajo la luz del sol en Cali.
            </p>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="font-sans text-sm font-medium">Seleccioná tu horario y barbero de confianza</div>
              <div className="font-sans text-xs text-pf-muted">Sin necesidad de crear cuenta ni instalar aplicaciones.</div>
            </div>
          </div>

          <div className="pf-card p-6 space-y-4">
            <div className="text-xs font-mono text-pf-available uppercase tracking-wider font-semibold">Datos, Horas & Moneda COP</div>
            <div className="text-2xl font-mono font-bold text-pf-bone">JetBrains Mono</div>
            <p className="text-xs text-pf-muted leading-relaxed">
              Cifras tabulares con alineación perfecta para precios en pesos colombianos, timestamps y códigos de reserva.
            </p>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="font-mono text-lg font-semibold text-pf-terracota">$ 35.000 COP</div>
              <div className="font-mono text-xs text-pf-muted">Turno: 03:30 p. m. · Código PF-8912</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Componentes UI Artesanales */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-pf-bone flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pf-terracota" />
            4. Componentes de Interfaz & Microinteracciones
          </h2>
          <span className="text-xs font-mono text-pf-muted uppercase tracking-wider">Controles Táctiles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Botones */}
          <div className="pf-card p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-pf-bone">Variantes de Botones</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <button className="pf-btn-primary">
                Agendar mi Cita <ArrowRight className="w-4 h-4" />
              </button>
              <button className="pf-btn-brass">
                <Scissors className="w-4 h-4" /> Finalizar Servicio
              </button>
              <button className="pf-btn-secondary">
                Ver Portafolio
              </button>
              <button className="pf-btn-outline">
                Reprogramar
              </button>
            </div>
            <p className="text-[11px] text-pf-muted">
              Touch targets de mínimo 44px de altura, compresión física <code className="text-pf-terracota">active:scale-[0.98]</code> y contraste WCAG AA.
            </p>
          </div>

          {/* Badges e Indicadores de Estado */}
          <div className="pf-card p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-pf-bone">El Sistema de "Puntos" e Indicadores</h3>
            <div className="flex flex-wrap gap-2.5 items-center">
              <span className="pf-badge-available">
                <span className="pf-dot-live" /> 4 Cupos Libres Hoy
              </span>
              <span className="pf-badge-terracota">
                <span className="pf-dot-terracota" /> Reserva en Curso (07:45)
              </span>
              <span className="pf-badge-brass">
                <Sparkles className="w-3 h-3" /> Vapor de Ozono
              </span>
              <span className="pf-badge">
                <Clock className="w-3 h-3 text-pf-muted" /> 45 min
              </span>
            </div>
            <p className="text-[11px] text-pf-muted">
              Micro-señales de estado en vivo para transmitir confianza inmediata sin saturar visualmente.
            </p>
          </div>

          {/* Controles de Formulario */}
          <div className="pf-card p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-pf-bone">Campos con Validación Colombiana</h3>
            <div className="space-y-3">
              <div>
                <label className="pf-label">Número de Celular (WhatsApp)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pf-muted text-xs font-mono">
                    🇨🇴 +57
                  </div>
                  <input 
                    type="tel" 
                    defaultValue="315 829 4012" 
                    className="pf-input pl-16 font-mono text-xs" 
                    placeholder="300 000 0000"
                  />
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  id="demo-habeas" 
                  className="mt-0.5 rounded border-pf-border bg-pf-surface text-pf-terracota focus:ring-pf-terracota"
                />
                <label htmlFor="demo-habeas" className="text-[11px] text-pf-muted leading-snug">
                  Autorizo el tratamiento de mis datos personales para la gestión de mi cita (Ley 1581 de 2012).
                </label>
              </div>
            </div>
          </div>

          {/* Tarjeta de Barbero Editorial */}
          <div className="pf-card p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-pf-bone">Card de Barbero (Ritmo Editorial)</h3>
            <div className="flex gap-4 items-center p-3.5 bg-pf-elevated rounded-lg border border-pf-terracota/40 shadow-fine-terracota">
              <div className="w-14 h-14 rounded-md overflow-hidden bg-pf-carbon border border-white/10 shrink-0">
                <img 
                  src="/images/punto-fino/ritual-vapor-ozono.png" 
                  alt="Barbero Punto Fino" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-display font-bold text-pf-bone">Brayan "El Fino"</div>
                  <span className="text-[10px] font-mono text-pf-available font-semibold">DISPONIBLE HOY</span>
                </div>
                <div className="text-xs text-pf-muted">Especialista en degradado milimétrico & navaja</div>
                <div className="text-[11px] font-mono text-pf-terracota">★ 4.9 · 340 cortes</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

