import React, { useState } from 'react';
import { 
  Scissors, Sparkles, Clock, Check, Mail, ArrowRight
} from 'lucide-react';

export default function DesignSystemView() {
  const [copiedToken, setCopiedToken] = useState(null);

  const copyToClipboard = (text, tokenName) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const colors = [
    { name: 'Carbón Mate (Base)', hex: '#111210', desc: 'Fondo mate profundo, inspirado en el interior del local', role: 'bg-pf-carbon' },
    { name: 'Superficie Pizarra', hex: '#181A17', desc: 'Cards, barras de navegación y modales', role: 'bg-pf-surface' },
    { name: 'Elevado / Inputs', hex: '#232621', desc: 'Controles, inputs y bordes activos', role: 'bg-pf-elevated' },
    { name: 'Latón Cálido', hex: '#C8A97E', desc: 'Acento noble de tijeras, cuchillas y herrajes', role: 'bg-pf-brass' },
    { name: 'Papel Hueso', hex: '#F4F1EA', desc: 'Texto principal y soporte de alta legibilidad', role: 'bg-pf-bone' },
    { name: 'Verde Disponible', hex: '#2EA063', desc: 'Punto de estado libre, citas abiertas', role: 'bg-pf-available' },
  ];

  return (
    <div className="space-y-12 pb-16">
      <div className="border-b border-white/10 pb-8">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-pf-bone tracking-tight">
          Sistema de Diseño <span className="text-pf-brass">Punto Fino</span>
        </h1>
        <p className="mt-3 text-pf-muted max-w-3xl text-base leading-relaxed">
          Diseñado para Punto Fino en Villacolombia · Cali, Colombia. Transmite oficio, precisión milimétrica y cercanía con tuteo colombiano.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-display font-bold text-pf-bone">
          1. Tono de Voz y Posicionamiento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="pf-card p-5 bg-pf-surface/60 space-y-3">
            <h3 className="font-display font-bold text-base text-pf-bone">Tuteo Colombiano Sobrio</h3>
            <p className="text-xs text-pf-muted leading-relaxed">
              Usamos tuteo colombiano claro y respetuoso («Elige tu servicio», «Agenda tu cita») y siempre hablamos de «cita».
            </p>
            <div className="p-3 bg-pf-carbon rounded border border-white/5 text-xs text-pf-bone">
              <span className="text-pf-available">✔ Sí:</span> "Elige tu barbero y tu hora. Te guardamos el puesto en la silla."
            </div>
          </div>

          <div className="pf-card p-5 bg-pf-surface/60 space-y-3">
            <h3 className="font-display font-bold text-base text-pf-bone">Cero Teléfono · Verificación por Correo</h3>
            <p className="text-xs text-pf-muted leading-relaxed">
              Toda la comunicación se gestiona por correo electrónico con verificación de 6 dígitos y enlaces firmados de un solo uso.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-display font-bold text-pf-bone">
          2. Paleta de Color
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {colors.map((c) => (
            <div 
              key={c.name}
              onClick={() => copyToClipboard(c.hex, c.name)}
              className="pf-card p-4 cursor-pointer transition-all"
            >
              <div 
                className="w-full h-16 rounded-md mb-3 border border-white/10 flex items-end justify-end p-1.5"
                style={{ backgroundColor: c.hex }}
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                  {copiedToken === c.name ? <Check className="w-3 h-3 text-pf-available inline" /> : c.hex}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-pf-bone truncate">{c.name}</div>
                <div className="text-[11px] text-pf-subtle line-clamp-2 leading-tight mt-1">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-display font-bold text-pf-bone">
          3. Componentes de Reserva sin Teléfono
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="pf-card p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-pf-bone">Verificación por Correo Electrónico</h3>
            <div className="space-y-3">
              <div>
                <label className="pf-label">Correo electrónico del cliente</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pf-muted text-xs">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="email" 
                    defaultValue="cliente@correo.com" 
                    className="pf-input pl-10 text-xs" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pf-card p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-pf-bone">Tarjeta Tipográfica de Barbero (Sin Foto)</h3>
            <div className="p-4 bg-pf-elevated rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-display font-bold text-pf-bone">Juan David</div>
                <span className="text-[11px] text-pf-available font-semibold">Disponible hoy</span>
              </div>
              <div className="text-xs text-pf-muted">Ofrece todos los servicios del catálogo · Descanso: Miércoles</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
