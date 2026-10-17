import React, { useState } from 'react';
import { 
  Calendar, MapPin, Scissors, ShieldCheck, 
  ExternalLink, Check
} from 'lucide-react';

export default function CustomerEmailView() {
  const [deviceMode, setDeviceMode] = useState('mobile');
  const [copiedLink, setCopiedLink] = useState(false);

  const copySimulatedLink = () => {
    navigator.clipboard.writeText('https://puntofinobarberia.com/cita/token_secure_hmac_8492');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-sans text-pf-terracota font-semibold">
            Sistema de Correo Transaccional (Resend + React Email)
          </span>
          <h2 className="text-2xl font-display font-bold text-pf-bone">
            Plantilla Renderizada: Confirmación al Cliente
          </h2>
          <p className="text-xs text-pf-muted">
            Diseño responsivo probado para Gmail, Apple Mail y Outlook con enlaces firmados de un solo uso y cero teléfonos.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-pf-surface p-1.5 rounded-lg border border-white/10">
          <button 
            onClick={() => setDeviceMode('mobile')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              deviceMode === 'mobile' ? 'bg-pf-terracota text-white font-bold' : 'text-pf-muted hover:text-white'
            }`}
          >
            Vista Móvil (380px)
          </button>
          <button 
            onClick={() => setDeviceMode('desktop')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              deviceMode === 'desktop' ? 'bg-pf-terracota text-white font-bold' : 'text-pf-muted hover:text-white'
            }`}
          >
            Vista Desktop (640px)
          </button>
        </div>
      </div>

      <div className={`mx-auto bg-pf-surface rounded-xl border border-white/10 overflow-hidden shadow-2xl transition-all ${
        deviceMode === 'mobile' ? 'max-w-md' : 'max-w-2xl'
      }`}>
        <div className="p-4 bg-pf-elevated border-b border-white/5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-pf-muted">
            <span>De: <strong className="text-pf-bone">Punto Fino</strong> &lt;citas@puntofino.com&gt;</span>
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
        </div>

        <div className="p-6 sm:p-8 bg-[#111215] text-[#F7F5F0] font-sans space-y-6">
          <div className="text-center border-b border-white/10 pb-6 space-y-1">
            <div className="text-xs text-[#C8A97E] font-semibold">
              Villacolombia · Cali
            </div>
            <div className="text-3xl font-display font-extrabold tracking-tight text-[#F7F5F0]">
              Punto Fino
            </div>
            <div className="text-xs text-[#9B988F]">
              Oficio, paciencia y corte al milímetro.
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-display font-bold text-[#F7F5F0]">
              Hola, Mateo. Tu cita está confirmada.
            </h1>
            <p className="text-xs text-[#9B988F] leading-relaxed">
              Te guardamos el puesto en la silla. Aquí tienes todos los detalles de tu cita para que llegues con tranquilidad.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#18191E] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[11px] text-[#C8A97E] font-bold">Código de reserva</span>
              <span className="text-base tabular-nums font-bold text-[#F7F5F0]">PF-8492</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="text-[11px] text-[#9B988F]">Fecha y Hora:</div>
                <div className="font-semibold text-[#F7F5F0] flex items-center gap-1.5 tabular-nums">
                  <Calendar className="w-3.5 h-3.5 text-[#C8A97E]" />
                  Domingo 18 de Octubre · 2:30 p. m.
                </div>
                <div className="text-[10px] text-[#6A6862]">Hora de Colombia (America/Bogota)</div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-[#9B988F]">Barbero Asignado:</div>
                <div className="font-semibold text-[#F7F5F0] flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#C8A97E]" />
                  Juan David
                </div>
                <div className="text-[10px] text-[#6A6862]">Inmutable una vez confirmada</div>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-white/5">
                <div className="text-[11px] text-[#9B988F]">Servicio Reservado:</div>
                <div className="space-y-1 pt-0.5 text-xs">
                  <div className="flex justify-between text-[#F7F5F0]">
                    <span>• Experiencia Punto Fino + Ritual de Barba (45 min)</span>
                    <span className="tabular-nums text-[#9B988F]">$34.000 COP</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-white/5">
                <div className="text-[11px] text-[#9B988F]">Total en el local:</div>
                <div className="text-xl tabular-nums font-bold text-[#C8A97E]">$34.000 COP</div>
                <div className="text-[10px] text-[#6A6862]">Pagas al terminar: Efectivo, Nequi, Daviplata o Datáfono.</div>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-white/5">
                <div className="text-[11px] text-[#9B988F]">Dirección:</div>
                <div className="text-[#F7F5F0] flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#C8A97E] shrink-0" />
                  Carrera 12 #53-51, barrio Villacolombia, Cali, Valle del Cauca
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-center">
            <div className="p-4 rounded bg-[#18191E] border border-white/5 text-xs text-[#9B988F] space-y-2">
              <div className="text-[#F7F5F0] font-semibold">¿Necesitas reprogramar o cancelar?</div>
              <p className="text-[11px] leading-relaxed">
                Puedes gestionar tu cita con el mismo barbero mediante estos enlaces firmados de un solo uso (válidos hasta 3 horas antes de tu cita):
              </p>
              <div className="flex justify-center gap-4 pt-1 text-xs">
                <button 
                  onClick={copySimulatedLink}
                  className="text-[#C8A97E] hover:underline flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                  Reprogramar mi cita
                </button>
                <span className="text-[#6A6862]">|</span>
                <button 
                  onClick={() => alert('Cita cancelada y horario liberado.')}
                  className="text-rose-400 hover:underline"
                >
                  Cancelar mi cita
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#6A6862] space-y-2 border-t border-white/10 pt-4 leading-relaxed">
            <div>
              <strong>Política de cancelación:</strong> Si tienes un imprevisto, puedes cancelar o reprogramar hasta 3 horas antes de la hora agendada.
            </div>
            <div>
              <strong>Contacto:</strong> Escríbenos a <span className="text-[#9B988F]">contacto@puntofino.com</span> o desde el formulario de contacto en nuestra plataforma web.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
