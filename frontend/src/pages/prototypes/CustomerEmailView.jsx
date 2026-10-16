import React, { useState } from 'react';
import { 
  Calendar, MapPin, Clock, Scissors, Download, ShieldCheck, 
  Mail, ExternalLink, Check, Copy
} from 'lucide-react';

export default function CustomerEmailView() {
  const [deviceMode, setDeviceMode] = useState('mobile'); // mobile | desktop
  const [copiedLink, setCopiedLink] = useState(false);

  const copySimulatedLink = () => {
    navigator.clipboard.writeText('https://puntofinobarberia.com/cita/token_secure_hmac_8492');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Controles de Vista Previa */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-mono text-pf-terracota uppercase tracking-widest font-semibold">
            SUPERFICIE 5: SISTEMA DE CORREO TRANSACCIONAL (RESEND + REACT EMAIL)
          </span>
          <h2 className="text-2xl font-display font-bold text-pf-bone">
            Plantilla Renderizada: Confirmación al Cliente
          </h2>
          <p className="text-xs text-pf-muted">
            Diseño responsivo probado para Gmail, Apple Mail y Outlook. Utiliza la identidad visual de la marca, tono caleño respetuoso y enlaces seguros sin login.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-pf-surface p-1.5 rounded-lg border border-white/10">
          <button 
            onClick={() => setDeviceMode('mobile')}
            className={`px-3 py-1 rounded text-xs font-mono transition-all ${
              deviceMode === 'mobile' ? 'bg-pf-terracota text-white font-bold' : 'text-pf-muted hover:text-white'
            }`}
          >
            Vista Móvil (380px)
          </button>
          <button 
            onClick={() => setDeviceMode('desktop')}
            className={`px-3 py-1 rounded text-xs font-mono transition-all ${
              deviceMode === 'desktop' ? 'bg-pf-terracota text-white font-bold' : 'text-pf-muted hover:text-white'
            }`}
          >
            Vista Desktop (640px)
          </button>
        </div>
      </div>

      {/* Cabecera del Cliente de Correo (Simulación de Gmail / Apple Mail) */}
      <div className={`mx-auto bg-pf-surface rounded-xl border border-white/10 overflow-hidden shadow-2xl transition-all ${
        deviceMode === 'mobile' ? 'max-w-md' : 'max-w-2xl'
      }`}>
        
        {/* Metadatos del Correo */}
        <div className="p-4 bg-pf-elevated border-b border-white/5 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-pf-muted">
            <span>De: <strong className="text-pf-bone">Punto Fino</strong> &lt;citas@puntofinobarberia.com&gt;</span>
            <span className="text-[10px] text-pf-available flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SPF / DKIM / DMARC Válido
            </span>
          </div>
          <div className="text-pf-muted">
            Para: <strong className="text-pf-bone">Mateo Holguín</strong> &lt;mateo.holguin@gmail.com&gt;
          </div>
          <div className="text-sm font-sans font-bold text-pf-bone pt-1">
            Asunto: Tu cita en Punto Fino está confirmada — [PF-8492]
          </div>
          <div className="text-[11px] text-pf-subtle flex items-center gap-2">
            <span>Adjunto:</span>
            <span className="px-2 py-0.5 rounded bg-white/5 text-pf-bone border border-white/10 inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-pf-terracota" /> cita-punto-fino-PF-8492.ics (3.2 KB)
            </span>
          </div>
        </div>

        {/* CUERPO DEL CORREO RENDERIZADO */}
        <div className="p-6 sm:p-8 bg-[#111215] text-[#F7F5F0] font-sans space-y-6">
          
          {/* Logo / Encabezado */}
          <div className="text-center border-b border-white/10 pb-6 space-y-1">
            <div className="text-xs font-mono tracking-widest text-[#E15233] uppercase font-bold">
              BARBERÍA DE BARRIO · SANTIAGO DE CALI
            </div>
            <div className="text-3xl font-display font-extrabold tracking-tight text-[#F7F5F0]">
              PUNTO FINO
            </div>
            <div className="text-xs text-[#9B988F]">
              Oficio, paciencia y corte al milímetro.
            </div>
          </div>

          {/* Saludo y Confirmación */}
          <div className="space-y-2">
            <h1 className="text-xl font-display font-bold text-[#F7F5F0]">
              ¡Qué hubo, Mateo! Tu cita está confirmada.
            </h1>
            <p className="text-xs text-[#9B988F] leading-relaxed">
              Te guardamos el puesto en la silla. Aquí tenés todos los detalles de tu turno para que llegués con calma y frescura.
            </p>
          </div>

          {/* Cuadro de Detalles de la Cita */}
          <div className="p-5 rounded-lg bg-[#18191E] border border-white/10 space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] font-mono text-[#E15233] uppercase font-bold">CÓDIGO DE RESERVA</span>
              <span className="text-base font-mono font-bold text-[#F7F5F0] tracking-widest">PF-8492</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#9B988F] uppercase">Fecha y Hora:</div>
                <div className="font-semibold text-[#F7F5F0] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#E15233]" />
                  Domingo 18 de Octubre · 03:30 p. m.
                </div>
                <div className="text-[10px] text-[#6A6862] font-mono">Hora de Colombia (America/Bogota)</div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#9B988F] uppercase">Barbero Asignado:</div>
                <div className="font-semibold text-[#F7F5F0] flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#B89758]" />
                  Brayan Murillo ("El Fino")
                </div>
                <div className="text-[10px] text-[#6A6862]">Silla #1</div>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-white/5">
                <div className="text-[10px] font-mono text-[#9B988F] uppercase">Servicios Solicitados:</div>
                <div className="space-y-1 pt-0.5 text-xs">
                  <div className="flex justify-between text-[#F7F5F0]">
                    <span>• Corte Clásico Punto Fino (40 min)</span>
                    <span className="font-mono text-[#9B988F]">$ 25.000 COP</span>
                  </div>
                  <div className="flex justify-between text-[#F7F5F0]">
                    <span>• Ritual Barba con Vapor de Ozono (35 min)</span>
                    <span className="font-mono text-[#9B988F]">$ 20.000 COP</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-white/5">
                <div className="text-[10px] font-mono text-[#9B988F] uppercase">Total en el local:</div>
                <div className="text-xl font-mono font-bold text-[#E15233]">$ 45.000 COP</div>
                <div className="text-[10px] text-[#6A6862]">Pagás al terminar: Efectivo, Nequi, Daviplata o Datáfono.</div>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-white/5">
                <div className="text-[10px] font-mono text-[#9B988F] uppercase">Dirección:</div>
                <div className="text-[#F7F5F0] flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#E15233] shrink-0" />
                  Calle 5ta #38-24, Barrio Tequendama, Santiago de Cali
                </div>
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[11px] text-[#E15233] underline inline-block pt-1"
                >
                  Abrir ubicación en Google Maps / Waze →
                </a>
              </div>
            </div>
          </div>

          {/* Botones de Acción dentro del Correo */}
          <div className="space-y-3 pt-2 text-center">
            <a 
              href="#calendar" 
              onClick={(e) => { e.preventDefault(); alert('Agregando evento con recordatorio a Google Calendar.'); }}
              className="inline-block w-full py-3 px-4 rounded bg-[#E15233] hover:bg-[#C44327] text-white font-bold text-xs uppercase tracking-wider text-center transition-all shadow-md"
            >
              📅 Guardar en mi Google Calendar
            </a>

            {/* Reprogramar y Cancelar con Token Seguro */}
            <div className="p-4 rounded bg-[#18191E] border border-white/5 text-xs text-[#9B988F] space-y-2">
              <div className="text-[#F7F5F0] font-semibold">¿Necesitás reprogramar o cancelar?</div>
              <p className="text-[11px] leading-relaxed">
                Podés gestionar tu cita sin contraseñas con estos enlaces seguros de un solo uso (válidos hasta 2 horas antes de tu turno):
              </p>
              <div className="flex justify-center gap-4 pt-1 font-mono text-xs">
                <button 
                  onClick={copySimulatedLink}
                  className="text-[#E15233] hover:underline flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                  Reprogramar mi Cita
                </button>
                <span className="text-[#6A6862]">|</span>
                <button 
                  onClick={() => alert('Simulación: Token de cancelación procesado. Cita cancelada y horario liberado para la comunidad.')}
                  className="text-rose-400 hover:underline"
                >
                  Cancelar mi Cita
                </button>
              </div>
            </div>
          </div>

          {/* Política de Cancelación y Contacto */}
          <div className="text-[11px] text-[#6A6862] space-y-2 border-t border-white/10 pt-4 leading-relaxed">
            <div>
              <strong>Política de cancelación:</strong> Si te surge un imprevisto, te agradecemos cancelar con al menos 2 horas de anticipación para que otro vecino pueda aprovechar el cupo.
            </div>
            <div>
              <strong>¿Preguntas o indicaciones?</strong> Escribinos directamente al WhatsApp de la barbería: <a href="https://wa.me/573158294012" className="text-[#9B988F] underline">+57 315 829 4012</a>.
            </div>
          </div>

          {/* Pie de Página Legal (Ley 1581) */}
          <div className="text-[10px] text-[#444] text-center pt-2 space-y-1 font-mono">
            <div>Punto Fino Barbería · NIT 901.482.110-3 · Santiago de Cali, Colombia</div>
            <div>Este es un correo transaccional estrictamente relacionado con tu reserva.</div>
          </div>

        </div>
      </div>
    </div>
  );
}

