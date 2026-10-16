import React, { useState } from 'react';
import { 
  Scissors, Sparkles, Clock, CheckCircle2, User, Phone, 
  DollarSign, Plus, AlertCircle, Wifi, WifiOff, Camera, 
  ChevronRight, ArrowRight, Shield, Award, Check
} from 'lucide-react';

export default function BarberMobileView() {
  const [activeTab, setActiveTab] = useState('jornada'); // jornada | cliente | cierre | ingresos
  const [isOnline, setIsOnline] = useState(true);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('nequi');
  const [tipAmount, setTipAmount] = useState(5000);
  const [walkInData, setWalkInData] = useState({ name: '', service: 'Corte Clásico' });
  const [inChairTime, setInChairTime] = useState(24); // minutos transcurridos

  // Citas del día del barbero
  const [appointments, setAppointments] = useState([
    {
      id: 'apt-1',
      time: '10:00 AM',
      client: 'Andrés Felipe Caicedo',
      service: 'Corte Clásico + Barba Vaporizada',
      price: 45000,
      status: 'in_progress', // in_progress | confirmed | completed
      isWalkIn: false,
      notes: 'Fade #0.5 en sienes, toalla bien caliente en cuello.'
    },
    {
      id: 'apt-2',
      time: '11:15 AM',
      client: 'Mateo Holguín (Web)',
      service: 'Corte Clásico Punto Fino',
      price: 25000,
      status: 'confirmed',
      isWalkIn: false,
      notes: 'Lleva foto de referencia para degradado medio.'
    },
    {
      id: 'apt-3',
      time: '12:00 PM',
      client: 'Carlos "El Mono" (Vecino)',
      service: 'Perfilado de Barba',
      price: 22000,
      status: 'confirmed',
      isWalkIn: true,
      notes: 'Cliente de cada 8 días. Barba cuadrada.'
    },
    {
      id: 'apt-4',
      time: '01:00 PM',
      client: 'ALMUERZO / DESCANSO',
      service: 'Bloqueo personal',
      price: 0,
      status: 'break',
      isWalkIn: false
    },
    {
      id: 'apt-5',
      time: '02:30 PM',
      client: 'Sebastián Varela',
      service: 'Combo Completo + Mascarilla',
      price: 45000,
      status: 'confirmed',
      isWalkIn: false,
      notes: 'Piel sensible a la navaja en papada.'
    }
  ]);

  const handleAddWalkIn = (e) => {
    e.preventDefault();
    if (!walkInData.name) return;
    const newApt = {
      id: `walkin-${Date.now()}`,
      time: 'Ahora',
      client: `${walkInData.name} (Sin Cita)`,
      service: walkInData.service,
      price: 25000,
      status: 'confirmed',
      isWalkIn: true,
      notes: 'Cliente que acaba de llegar al local.'
    };
    setAppointments([newApt, ...appointments]);
    setShowWalkInModal(false);
    setWalkInData({ name: '', service: 'Corte Clásico' });
  };

  const handleFinishCheckout = () => {
    setAppointments(appointments.map((a) => a.id === 'apt-1' ? { ...a, status: 'completed' } : a));
    setShowCheckoutModal(false);
    alert('Servicio cobrado con éxito. Ingreso registrado en caja y comisión sumada a tu liquidación.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Explicación del Contexto Móvil */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-mono text-pf-terracota uppercase tracking-widest font-semibold">
            SUPERFICIE 2: APP MÓVIL INTERNA (EXPO / REACT NATIVE)
          </span>
          <h2 className="text-2xl font-display font-bold text-pf-bone">
            Simulador de la App de Barberos & Administrador
          </h2>
          <p className="text-xs text-pf-muted">
            Diseñada exclusivamente para el personal. Cómoda de usar de pie, con una sola mano, alto contraste para luz fuerte y modo offline para caídas de red.
          </p>
        </div>

        {/* Toggle de Conectividad para demostrar Modo Offline */}
        <div className="flex items-center gap-3 bg-pf-surface p-2.5 rounded-lg border border-white/10 text-xs">
          <span className="text-pf-muted">Simular red del local:</span>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              isOnline ? 'bg-pf-available/20 text-pf-available border border-pf-available/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'ONLINE' : 'OFFLINE (SQLite Local)'}
          </button>
        </div>
      </div>

      {/* Frame de Celular Fiel a React Native */}
      <div className="max-w-sm mx-auto bg-pf-carbon rounded-[40px] p-3 border-4 border-pf-elevated shadow-2xl relative overflow-hidden">
        {/* Notch / Dynamic Island */}
        <div className="w-28 h-4 bg-pf-surface rounded-full mx-auto mb-2" />

        {/* Pantalla del Teléfono */}
        <div className="bg-[#0D0E11] rounded-[32px] overflow-hidden border border-white/5 min-h-[640px] flex flex-col text-pf-bone text-xs">
          
          {/* Header de la App Móvil */}
          <div className="p-4 bg-pf-surface/90 border-b border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-pf-terracota bg-pf-carbon">
                  <img src="/images/punto-fino/ritual-vapor-ozono.png" alt="Brayan" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-display font-bold text-xs text-pf-bone">Brayan "El Fino"</div>
                  <div className="text-[10px] text-pf-muted">Silla #1 · Santiago de Cali</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isOnline && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    OFFLINE
                  </span>
                )}
                <span className="pf-dot-live" />
              </div>
            </div>

            {/* Fecha y Banner de Ingresos Rápidos */}
            <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
              <span className="text-pf-muted">Hoy: 5 Citas programadas</span>
              <span className="text-pf-terracota font-bold">Comisión: $ 92.500 COP</span>
            </div>
          </div>

          {/* CUERPO PRINCIPAL DEL TELÉFONO */}
          <div className="p-3.5 flex-1 overflow-y-auto space-y-4">
            
            {/* Tarjeta: EN SILLA AHORA */}
            <div className="p-3.5 rounded-xl bg-pf-surface border border-pf-terracota/50 shadow-fine-terracota space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-pf-terracota font-bold tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pf-terracota animate-ping" /> EN SILLA AHORA
                </span>
                <span className="text-[10px] font-mono text-pf-muted">Lleva {inChairTime} min</span>
              </div>

              <div>
                <div className="text-sm font-display font-bold text-pf-bone">Andrés Felipe Caicedo</div>
                <div className="text-xs text-pf-muted">Corte Clásico + Barba Vaporizada</div>
                <div className="text-[11px] font-mono text-pf-terracota font-bold mt-0.5">$ 45.000 COP</div>
              </div>

              {/* Ficha rápida de corte */}
              <div className="p-2 rounded bg-pf-carbon text-[10px] text-pf-muted border border-white/5 space-y-1">
                <div className="text-pf-brass font-semibold">Ficha privada del cliente:</div>
                <div>• Fade #0.5 en sienes, cerquillo recto a navaja.</div>
                <div>• Piel del cuello sensible (usar loción sin alcohol).</div>
              </div>

              {/* Botón de Cobro Rápido */}
              <button 
                onClick={() => setShowCheckoutModal(true)}
                className="w-full pf-btn-primary py-2.5 text-xs font-bold"
              >
                <Scissors className="w-3.5 h-3.5" /> Finalizar Servicio & Cobrar
              </button>
            </div>

            {/* Botones de Acción Rápida del Barbero */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowWalkInModal(true)}
                className="p-2.5 rounded-lg bg-pf-elevated border border-white/10 text-left hover:border-pf-terracota/40 transition-all"
              >
                <Plus className="w-4 h-4 text-pf-terracota mb-1" />
                <div className="text-xs font-bold text-pf-bone">+ Cliente Walk-in</div>
                <div className="text-[10px] text-pf-muted">Llegó sin cita (2 toques)</div>
              </button>

              <button 
                onClick={() => alert('Descanso de 20 min programado. La web pública bloqueará turnos en este lapso.')}
                className="p-2.5 rounded-lg bg-pf-elevated border border-white/10 text-left hover:border-pf-brass/40 transition-all"
              >
                <Clock className="w-4 h-4 text-pf-brass mb-1" />
                <div className="text-xs font-bold text-pf-bone">Pausa / Descanso</div>
                <div className="text-[10px] text-pf-muted">Bloqueo de 20 min</div>
              </button>
            </div>

            {/* AGENDA DEL DÍA (Timeline) */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-pf-muted uppercase tracking-wider flex items-center justify-between">
                <span>Próximas Citas</span>
                <span className="text-[10px] text-pf-terracota">Hoy</span>
              </div>

              <div className="space-y-2">
                {appointments.slice(1).map((apt) => (
                  <div 
                    key={apt.id}
                    className="p-2.5 rounded-lg bg-pf-surface border border-white/5 flex items-center justify-between hover:border-white/15 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-pf-bone">{apt.time}</span>
                        {apt.isWalkIn && (
                          <span className="text-[9px] font-mono px-1 rounded bg-pf-brass/20 text-pf-brass-light">
                            Sin Cita
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-pf-muted">{apt.client}</div>
                      <div className="text-[10px] text-pf-subtle">{apt.service}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-pf-bone">$ {apt.price.toLocaleString('es-CO')}</div>
                      <span className="text-[9px] font-mono text-pf-available">Confirmado</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Barra de Navegación Inferior Móvil */}
          <div className="p-2 bg-pf-surface border-t border-white/5 flex items-center justify-around text-center text-[10px] font-mono text-pf-muted">
            <button className="text-pf-terracota font-bold flex flex-col items-center">
              <Scissors className="w-4 h-4" />
              <span>Mi Día</span>
            </button>
            <button onClick={() => alert('Historial de comisiones quincenales y cortes realizados')} className="hover:text-white flex flex-col items-center">
              <DollarSign className="w-4 h-4" />
              <span>Ingresos</span>
            </button>
            <button onClick={() => alert('Cámara para capturar antes/después y subir a portafolio web')} className="hover:text-white flex flex-col items-center">
              <Camera className="w-4 h-4" />
              <span>Portafolio</span>
            </button>
            <button onClick={() => alert('Ajuste de horarios, descansos y vacaciones')} className="hover:text-white flex flex-col items-center">
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </button>
          </div>

        </div>
      </div>

      {/* MODAL WALK-IN (Cliente que llega sin cita) */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-sm w-full bg-pf-surface space-y-4 border border-pf-terracota/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-sm text-pf-bone">+ Agregar Cliente Sin Cita (Walk-in)</h3>
              <button onClick={() => setShowWalkInModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddWalkIn} className="space-y-3 text-xs">
              <div>
                <label className="pf-label">Nombre o Apodo del Cliente</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ej: Don Jaime / Carlos"
                  value={walkInData.name}
                  onChange={(e) => setWalkInData({ ...walkInData, name: e.target.value })}
                  className="pf-input"
                />
              </div>
              <div>
                <label className="pf-label">Servicio a Realizar</label>
                <select 
                  value={walkInData.service}
                  onChange={(e) => setWalkInData({ ...walkInData, service: e.target.value })}
                  className="pf-input"
                >
                  <option value="Corte Clásico">Corte Clásico ($ 25.000 COP - 40 min)</option>
                  <option value="Perfilado Barba">Perfilado de Barba ($ 22.000 COP - 35 min)</option>
                  <option value="Combo Completo">Combo Corte + Barba ($ 45.000 COP - 70 min)</option>
                </select>
              </div>
              <p className="text-[10px] text-pf-muted">
                Al guardar, la franja se bloqueará de inmediato en la web pública para evitar doble reserva.
              </p>
              <button type="submit" className="pf-btn-primary w-full py-2.5">
                Sentar en la Silla (2 toques)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COBRO POS & CIERRE DE SERVICIO */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-sm w-full bg-pf-surface space-y-4 border border-pf-available/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-pf-available font-bold">COBRO POS · PUNTO FINO</span>
                <h3 className="font-display font-bold text-sm text-pf-bone">Cierre de Servicio: Andrés Caicedo</h3>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-pf-carbon rounded border border-white/5 text-center space-y-1">
              <div className="text-[10px] text-pf-muted uppercase font-mono">Total Servicio</div>
              <div className="text-2xl font-mono font-bold text-pf-bone">$ 45.000 COP</div>
              <div className="text-[10px] text-pf-brass font-mono">Tu comisión ganada: $ 22.500 COP (50%)</div>
            </div>

            {/* Selector de Método de Pago de Barrio */}
            <div className="space-y-2 text-xs">
              <label className="pf-label">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'efectivo', name: '💵 Efectivo' },
                  { id: 'nequi', name: '📱 Nequi' },
                  { id: 'daviplata', name: '🔴 Daviplata' },
                  { id: 'datafono', name: '💳 Datáfono' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedPayment(m.id)}
                    className={`p-2.5 rounded text-xs font-medium border text-center transition-all ${
                      selectedPayment === m.id 
                        ? 'border-pf-terracota bg-pf-elevated text-white font-bold' 
                        : 'border-white/10 bg-pf-surface text-pf-muted hover:border-white/20'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Propina */}
            <div className="space-y-1 text-xs">
              <label className="pf-label">Propina del Cliente</label>
              <div className="flex gap-2">
                {[0, 2000, 5000, 10000].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipAmount(t)}
                    className={`flex-1 py-1.5 rounded text-[11px] font-mono border transition-all ${
                      tipAmount === t ? 'border-pf-brass bg-pf-brass/20 text-pf-brass-light font-bold' : 'border-white/10 bg-pf-surface text-pf-muted'
                    }`}
                  >
                    {t === 0 ? '$0' : `+$${t/1000}k`}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleFinishCheckout}
              className="pf-btn-primary w-full py-3 text-sm font-bold shadow-lg"
            >
              Registrar Cobro (${(45000 + tipAmount).toLocaleString('es-CO')} COP)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

