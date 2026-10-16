import React, { useState, useEffect } from 'react';
import { 
  Scissors, Sparkles, Clock, CheckCircle2, User, Phone, 
  DollarSign, Plus, AlertCircle, Wifi, WifiOff, Camera, 
  ChevronRight, ArrowRight, Shield, Award, Check, RefreshCw,
  Fingerprint, Lock, ShieldCheck, Wallet, Receipt, FileText
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function BarberMobileView() {
  const getParams = () => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  };

  const params = getParams();
  const initialScreen = ['silla', 'arqueo', 'login'].includes(params.get('screen')) ? params.get('screen') : 'silla';
  const initialOnline = params.get('offline') !== 'true';
  const initialWalkIn = params.get('modal') === 'walkin';
  const initialCheckout = params.get('modal') === 'checkout';

  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState(params.get('offline') === 'true' ? [{ type: 'WALK_IN', data: { name: 'Cliente Offline SQLite' } }] : []);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modales
  const [showWalkInModal, setShowWalkInModal] = useState(initialWalkIn);
  const [showCheckoutModal, setShowCheckoutModal] = useState(initialCheckout);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Temporizador en Silla
  const [inChairMinutes, setInChairMinutes] = useState(28);

  // Formulario Walk-in
  const [walkInData, setWalkInData] = useState({
    name: '',
    phone: '',
    serviceName: 'Corte Clásico Punto Fino',
    priceCOP: 25000,
  });

  // Estado POS Cobro
  const [selectedPayment, setSelectedPayment] = useState('NEQUI');
  const [tipAmount, setTipAmount] = useState(5000);
  const [cashReceived, setCashReceived] = useState(50000);

  // Ficha técnica editable
  const [clientFormula, setClientFormula] = useState(
    'Fade #0.5 en sienes con transición suave a tijera arriba. Cerquillo recto a navaja de un solo filo. Toalla al vapor tibia en nuca y cuello, evitar loción con alcohol por piel sensible.'
  );

  // Citas del día del barbero Brayan Murillo "El Fino"
  const [appointments, setAppointments] = useState([
    {
      id: 'apt-chair-1',
      clientId: 'usr-client-andres',
      time: 'Ahora',
      client: 'Andrés Felipe Caicedo',
      phone: '315 489 1234',
      service: 'Corte Clásico + Barba Vaporizada',
      price: 45000,
      status: 'IN_PROGRESS',
      isWalkIn: false,
      technicalNotes: 'Fade #0.5 en sienes, toalla bien tibia, evitar alcohol.',
    },
    {
      id: 'apt-2',
      clientId: 'usr-client-mateo',
      time: '11:15 AM',
      client: 'Mateo Holguín (Web)',
      phone: '312 901 2345',
      service: 'Corte Clásico Punto Fino',
      price: 25000,
      status: 'CONFIRMED',
      isWalkIn: false,
      technicalNotes: 'Degradado medio clásico.',
    },
    {
      id: 'apt-3',
      clientId: 'usr-client-mono',
      time: '12:00 PM',
      client: 'Carlos "El Mono" (Vecino)',
      phone: '318 456 7890',
      service: 'Perfilado de Barba',
      price: 22000,
      status: 'CONFIRMED',
      isWalkIn: true,
      technicalNotes: 'Barba cuadrada con navaja.',
    },
    {
      id: 'apt-4',
      time: '01:00 PM',
      client: 'ALMUERZO / DESCANSO',
      service: 'Bloqueo personal',
      price: 0,
      status: 'BREAK',
      isWalkIn: false,
    },
    {
      id: 'apt-5',
      clientId: 'usr-client-sebas',
      time: '02:30 PM',
      client: 'Sebastián Varela',
      phone: '300 123 4567',
      service: 'Combo Completo + Mascarilla',
      price: 45000,
      status: 'CONFIRMED',
      isWalkIn: false,
      technicalNotes: 'Piel reactiva en garganta.',
    },
  ]);

  // Lista de completados para cálculo de comisiones
  const [completedList, setCompletedList] = useState([
    { id: 'done-1', client: 'Julián Morales', service: 'Corte Clásico', price: 25000, tip: 3000, method: 'EFECTIVO' },
    { id: 'done-2', client: 'Esteban Rios', service: 'Perfilado Barba', price: 22000, tip: 2000, method: 'NEQUI' },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Enviar Walk-In
  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInData.name.trim()) return;

    const newApt = {
      id: `walkin-${Date.now()}`,
      time: 'Ahora',
      client: `${walkInData.name.trim()} (Walk-in)`,
      phone: walkInData.phone || '300 000 0000',
      service: walkInData.serviceName,
      price: walkInData.priceCOP,
      status: 'IN_PROGRESS',
      isWalkIn: true,
      technicalNotes: 'Cliente que acaba de sentarse en silla.',
    };

    if (isOnline) {
      try {
        const payload = {
          barberId: '24a50b5e-ee54-4618-9d97-4fbb55b61939', // Brayan Murillo en Neon DB
          clientName: walkInData.name.trim(),
          clientPhone: walkInData.phone || '310 999 8877',
          serviceName: walkInData.serviceName,
          priceCOP: walkInData.priceCOP,
        };
        const res = await axios.post(`${API_BASE}/appointments/walk-in`, payload);
        if (res.data?.success) {
          showToast(`✅ Walk-in creado en Neon DB (${res.data.appointment?.bookingCode || 'PF-WALK'})`);
        }
      } catch (err) {
        console.warn('API error en walk-in, encolando offline:', err.message);
        setOfflineSyncQueue((prev) => [...prev, { type: 'WALK_IN', data: newApt }]);
        showToast('⚠️ Sin respuesta de API. Guardado en SQLite Local.');
      }
    } else {
      setOfflineSyncQueue((prev) => [...prev, { type: 'WALK_IN', data: newApt }]);
      showToast('💾 Modo Offline: Walk-in guardado en base local SQLite.');
    }

    setAppointments([newApt, ...appointments.map(a => a.status === 'IN_PROGRESS' ? { ...a, status: 'CONFIRMED' } : a)]);
    setShowWalkInModal(false);
    setWalkInData({ name: '', phone: '', serviceName: 'Corte Clásico Punto Fino', priceCOP: 25000 });
  };

  // Finalizar y Cobrar en Silla
  const handleFinishCheckout = async () => {
    const activeApt = appointments.find((a) => a.status === 'IN_PROGRESS') || appointments[0];
    const totalWithTip = activeApt.price + tipAmount;

    if (isOnline) {
      try {
        await axios.post(`${API_BASE}/appointments/${activeApt.id}/checkout`, {
          paymentMethod: selectedPayment,
          tipsCOP: tipAmount,
          barberNotes: clientFormula,
        });
        showToast(`💵 Cobrado vía ${selectedPayment} en Neon DB ($ ${totalWithTip.toLocaleString('es-CO')} COP)`);
      } catch (err) {
        console.warn('API checkout error, guardando en cola offline:', err.message);
        setOfflineSyncQueue((prev) => [...prev, { type: 'CHECKOUT', aptId: activeApt.id, paymentMethod: selectedPayment, tipAmount }]);
        showToast('⚠️ Cobro guardado en cola local de sincronización.');
      }
    } else {
      setOfflineSyncQueue((prev) => [...prev, { type: 'CHECKOUT', aptId: activeApt.id, paymentMethod: selectedPayment, tipAmount }]);
      showToast('💾 Cobro registrado en SQLite local. Pendiente por subir a Neon DB.');
    }

    // Actualizar estado local
    setCompletedList([
      ...completedList,
      { id: activeApt.id, client: activeApt.client, service: activeApt.service, price: activeApt.price, tip: tipAmount, method: selectedPayment }
    ]);
    setAppointments(appointments.filter((a) => a.id !== activeApt.id));
    setShowCheckoutModal(false);
    setInChairMinutes(0);
  };

  // Guardar Ficha Técnica
  const handleSaveFormula = async () => {
    const activeApt = appointments.find((a) => a.status === 'IN_PROGRESS') || appointments[0];
    if (isOnline && activeApt?.clientId) {
      try {
        await axios.put(`${API_BASE}/users/${activeApt.clientId}/technical-notes`, {
          notes: clientFormula,
        });
        showToast('📝 Ficha técnica guardada en servidor.');
      } catch (err) {
        showToast('💾 Ficha actualizada localmente.');
      }
    } else {
      showToast('💾 Ficha técnica guardada en SQLite local.');
    }
    setShowFormulaModal(false);
  };

  // Sincronizar cola manual
  const handleSyncOfflineQueue = async () => {
    if (!isOnline) {
      showToast('⚠️ Activa el modo ONLINE para sincronizar con la nube.');
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      const count = offlineSyncQueue.length;
      setOfflineSyncQueue([]);
      setIsSyncing(false);
      showToast(`☁️ Sincronizados ${count} registros pendientes con Neon PostgreSQL.`);
    }, 900);
  };

  // Cálculos de liquidación del barbero Brayan
  const totalProducedCOP = completedList.reduce((acc, c) => acc + c.price, 0);
  const totalTipsEarnedCOP = completedList.reduce((acc, c) => acc + c.tip, 0);
  const commissionEarnedCOP = Math.round(totalProducedCOP * 0.5); // 50% comisión

  const currentActiveApt = appointments.find((a) => a.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6 pb-16">
      {/* Toast flotante */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-pf-elevated text-pf-bone border border-pf-terracota px-4 py-3 rounded-lg shadow-2xl font-mono text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-pf-terracota" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encabezado y Control de Conectividad */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-mono text-pf-terracota uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> SUPERFICIE 2: APP MÓVIL INTERNA (REACT NATIVE / EXPO)
          </span>
          <h2 className="text-2xl font-display font-bold text-pf-bone">
            Simulador de la App de Barberos & Administrador
          </h2>
          <p className="text-xs text-pf-muted">
            Diseñada exclusivamente para el personal de Punto Fino. Operación de una sola mano, alto contraste para reflejos de barbería y modo Offline con SQLite local.
          </p>
        </div>

        {/* Toggles de simulación */}
        <div className="flex items-center gap-3 bg-pf-surface p-2 rounded-xl border border-white/10 text-xs">
          <span className="text-pf-muted font-mono">Red local Cali:</span>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              isOnline 
                ? 'bg-pf-available/20 text-pf-available border border-pf-available/40' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'ONLINE' : 'OFFLINE (SQLite)'}
          </button>

          {offlineSyncQueue.length > 0 && (
            <button
              onClick={handleSyncOfflineQueue}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-pf-brass/20 text-pf-brass-light border border-pf-brass/40 flex items-center gap-1 hover:bg-pf-brass/30 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Subir {offlineSyncQueue.length} a Neon</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pantallas del Celular */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setCurrentScreen('silla')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            currentScreen === 'silla'
              ? 'bg-pf-terracota text-white shadow-fine-terracota'
              : 'bg-pf-surface text-pf-muted hover:text-white border border-white/10'
          }`}
        >
          💺 Silla & Turnos (Barbero)
        </button>
        <button
          onClick={() => setCurrentScreen('arqueo')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            currentScreen === 'arqueo'
              ? 'bg-pf-brass text-pf-carbon font-extrabold shadow-fine-brass'
              : 'bg-pf-surface text-pf-muted hover:text-white border border-white/10'
          }`}
        >
          📊 Arqueo de Caja (Admin)
        </button>
        <button
          onClick={() => setCurrentScreen('login')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            currentScreen === 'login'
              ? 'bg-pf-elevated text-pf-bone border border-pf-bone/40'
              : 'bg-pf-surface text-pf-muted hover:text-white border border-white/10'
          }`}
        >
          🔐 Login & Biometría
        </button>
      </div>

      {/* Frame de Celular Fiel a React Native */}
      <div className="max-w-sm mx-auto bg-pf-carbon rounded-[42px] p-3 border-4 border-pf-elevated shadow-2xl relative overflow-hidden">
        {/* Dynamic Island / Notch */}
        <div className="w-28 h-4 bg-pf-surface rounded-full mx-auto mb-2 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-black/60 mr-2" />
          <div className="w-2.5 h-2.5 rounded-full bg-pf-elevated" />
        </div>

        {/* Pantalla del Teléfono */}
        <div className="bg-[#0D0E11] rounded-[32px] overflow-hidden border border-white/5 min-h-[660px] flex flex-col text-pf-bone text-xs relative">
          
          {/* HEADER DEL DISPOSITIVO MÓVIL */}
          <div className="p-4 bg-pf-surface/95 border-b border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-pf-terracota bg-pf-carbon flex items-center justify-center text-xs font-bold text-pf-terracota">
                  BM
                </div>
                <div>
                  <div className="font-display font-bold text-xs text-pf-bone">Brayan Murillo "El Fino"</div>
                  <div className="text-[10px] text-pf-muted">Silla #1 · Santiago de Cali</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isOnline ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <WifiOff className="w-2.5 h-2.5" /> OFFLINE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-pf-available/20 text-pf-available border border-pf-available/30 flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5" /> ONLINE
                  </span>
                )}
                <span className="w-2 h-2 rounded-full bg-pf-available animate-pulse" />
              </div>
            </div>

            {/* Banner de Ganancias del Día (Comisión 50%) */}
            <div className="flex items-center justify-between pt-1 text-[11px] font-mono border-t border-white/5">
              <span className="text-pf-muted">{completedList.length} completados</span>
              <span className="text-pf-terracota font-bold">
                Comisión: $ {commissionEarnedCOP.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          {/* ============================================== */}
          {/* VISTA 1: SILLA & TURNOS (BARBERO)               */}
          {/* ============================================== */}
          {currentScreen === 'silla' && (
            <div className="p-3.5 flex-1 overflow-y-auto space-y-3.5">
              
              {/* Tarjeta: EN SILLA AHORA */}
              {currentActiveApt ? (
                <div className="p-3.5 rounded-xl bg-pf-surface border border-pf-terracota shadow-fine-terracota space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-pf-terracota font-bold tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pf-terracota animate-ping" /> EN SILLA AHORA
                    </span>
                    <span className="text-[10px] font-mono text-pf-muted flex items-center gap-1">
                      <Clock className="w-3 h-3 text-pf-terracota" /> {inChairMinutes} min
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-display font-bold text-pf-bone flex items-center justify-between">
                      <span>{currentActiveApt.client}</span>
                      {currentActiveApt.isWalkIn && (
                        <span className="text-[9px] font-mono bg-pf-brass/20 text-pf-brass-light px-1.5 py-0.5 rounded">
                          Sin Cita
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-pf-muted">{currentActiveApt.service}</div>
                    <div className="text-[11px] font-mono text-pf-terracota font-bold mt-0.5">
                      $ {currentActiveApt.price.toLocaleString('es-CO')} COP
                    </div>
                  </div>

                  {/* Ficha rápida de corte */}
                  <div 
                    onClick={() => setShowFormulaModal(true)}
                    className="p-2 rounded bg-pf-carbon text-[10px] text-pf-muted border border-white/5 space-y-1 cursor-pointer hover:border-pf-brass/40 transition-all"
                  >
                    <div className="text-pf-brass font-semibold flex items-center justify-between">
                      <span>Fórmula de corte del cliente:</span>
                      <span className="text-[9px] underline">Editar</span>
                    </div>
                    <p className="line-clamp-2 text-pf-subtle text-[10px]">
                      {clientFormula}
                    </p>
                  </div>

                  {/* Botón de Cobro Rápido */}
                  <button 
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full pf-btn-primary py-2.5 text-xs font-bold shadow-md"
                  >
                    <Scissors className="w-3.5 h-3.5" /> Cobrar en Silla (POS)
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-pf-surface/60 border border-dashed border-white/10 text-center space-y-2">
                  <div className="text-xs font-mono text-pf-available font-bold">SILLA LIBRE</div>
                  <p className="text-[10px] text-pf-muted">No hay cliente en atención ahora. Puedes sentar a un cliente walk-in.</p>
                </div>
              )}

              {/* Botones de Acción Rápida (1 toque de pie) */}
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
                  onClick={() => showToast('☕ Pausa de 20 min activada. La web bloqueó la franja.')}
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
                  <span>Próximas Citas Hoy</span>
                  <span className="text-[10px] text-pf-terracota">{appointments.filter(a => a.status === 'CONFIRMED').length} por atender</span>
                </div>

                <div className="space-y-2">
                  {appointments.filter(a => a.status !== 'IN_PROGRESS').map((apt) => (
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
                          {apt.status === 'BREAK' && (
                            <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                              Descanso
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-pf-muted">{apt.client}</div>
                        <div className="text-[10px] text-pf-subtle">{apt.service}</div>
                      </div>

                      <div className="text-right">
                        {apt.price > 0 && (
                          <div className="font-mono text-xs font-bold text-pf-bone">$ {apt.price.toLocaleString('es-CO')}</div>
                        )}
                        <span className={`text-[9px] font-mono ${apt.status === 'BREAK' ? 'text-amber-400' : 'text-pf-available'}`}>
                          {apt.status === 'BREAK' ? 'Pausa' : 'Confirmado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ============================================== */}
          {/* VISTA 2: ARQUEO DE CAJA (ADMIN)                 */}
          {/* ============================================== */}
          {currentScreen === 'arqueo' && (
            <div className="p-3.5 flex-1 overflow-y-auto space-y-3.5">
              <div className="p-3 rounded-xl bg-pf-surface border border-pf-brass/40 space-y-1.5">
                <div className="text-[10px] font-mono text-pf-brass font-bold uppercase tracking-wider">
                  ARQUEO DE CAJA DIARIO
                </div>
                <div className="text-2xl font-mono font-bold text-pf-bone">$ 485.000 COP</div>
                <div className="text-[10px] text-pf-muted flex items-center justify-between">
                  <span>14 Cortes en el día</span>
                  <span className="text-pf-brass-light font-bold">+$32.000 COP Propinas</span>
                </div>
              </div>

              {/* Canales de Pago */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-pf-muted uppercase">Desglose por Canal de Pago</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-pf-surface border border-white/5">
                    <div className="text-[10px] text-pf-muted">💵 Efectivo Gaveta</div>
                    <div className="font-mono font-bold text-pf-bone">$ 190.000</div>
                  </div>
                  <div className="p-2 rounded bg-pf-surface border border-white/5">
                    <div className="text-[10px] text-pf-muted">📱 Nequi Local</div>
                    <div className="font-mono font-bold text-pf-bone">$ 165.000</div>
                  </div>
                  <div className="p-2 rounded bg-pf-surface border border-white/5">
                    <div className="text-[10px] text-pf-muted">🔴 Daviplata</div>
                    <div className="font-mono font-bold text-pf-bone">$ 45.000</div>
                  </div>
                  <div className="p-2 rounded bg-pf-surface border border-white/5">
                    <div className="text-[10px] text-pf-muted">💳 Datáfono Bold</div>
                    <div className="font-mono font-bold text-pf-bone">$ 85.000</div>
                  </div>
                </div>
              </div>

              {/* Comisiones del Equipo */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-pf-muted uppercase flex items-center justify-between">
                  <span>Liquidación Barberos (50%)</span>
                </div>
                <div className="text-[9px] font-mono text-pf-brass">
                  * [REVISAR CON CONTADOR / ABOGADO LABORAL]
                </div>

                <div className="p-2.5 rounded-lg bg-pf-surface border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-pf-bone text-xs">Brayan "El Fino" (Silla 1)</div>
                      <div className="text-[10px] text-pf-muted">5 cortes · $185k producidos</div>
                    </div>
                    <div className="text-right font-mono text-pf-terracota font-bold text-xs">
                      $ 92.500 COP
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                    <div>
                      <div className="font-bold text-pf-bone text-xs">Carlos "El Primo" (Silla 2)</div>
                      <div className="text-[10px] text-pf-muted">4 cortes · $140k producidos</div>
                    </div>
                    <div className="text-right font-mono text-pf-terracota font-bold text-xs">
                      $ 70.000 COP
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                    <div>
                      <div className="font-bold text-pf-bone text-xs">Andrés "Junior" (Silla 3)</div>
                      <div className="text-[10px] text-pf-muted">3 cortes · $95k producidos</div>
                    </div>
                    <div className="text-right font-mono text-pf-terracota font-bold text-xs">
                      $ 47.500 COP
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => showToast('🛡️ Caja del día cerrada y balance enviado al correo.')}
                className="w-full pf-btn-secondary py-2.5 text-xs font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Efectuar Cierre de Caja
              </button>
            </div>
          )}

          {/* ============================================== */}
          {/* VISTA 3: LOGIN & BIOMETRÍA                     */}
          {/* ============================================== */}
          {currentScreen === 'login' && (
            <div className="p-4 flex-1 flex flex-col justify-center space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[9px] font-mono text-pf-terracota font-bold uppercase tracking-wider">
                  DISPOSITIVO VINCULADO
                </span>
                <h3 className="font-display font-bold text-lg text-pf-bone">Brayan Murillo</h3>
                <p className="text-[10px] text-pf-muted">Samsung Galaxy A54 · ID: Pf-Dev-Brayan</p>
              </div>

              <div className="p-3 bg-pf-surface rounded-xl border border-white/10 space-y-3">
                <button
                  onClick={() => {
                    showToast('👆 Huella reconocida. Sesión móvil activa.');
                    setCurrentScreen('silla');
                  }}
                  className="w-full p-4 rounded-xl bg-pf-elevated border border-pf-brass/40 flex flex-col items-center justify-center gap-2 hover:border-pf-brass transition-all"
                >
                  <Fingerprint className="w-8 h-8 text-pf-brass animate-pulse" />
                  <span className="text-xs font-bold text-pf-bone">Tocar para Huella / Face ID</span>
                  <span className="text-[9px] text-pf-muted">Desbloqueo biométrico en 1 segundo</span>
                </button>

                <div className="text-center text-[10px] text-pf-subtle">
                  O ingresa con tu contraseña de personal
                </div>

                <button
                  onClick={() => {
                    showToast('✅ Sesión iniciada con credenciales.');
                    setCurrentScreen('silla');
                  }}
                  className="w-full pf-btn-primary py-2.5 text-xs font-bold"
                >
                  Acceder con Clave
                </button>
              </div>

              <div className="text-center text-[9px] text-pf-subtle">
                Sesión revocable desde el panel web de administración.
              </div>
            </div>
          )}

          {/* TAB BAR INFERIOR DE LA APP */}
          <div className="p-2 bg-pf-surface border-t border-white/5 flex items-center justify-around text-center text-[10px] font-mono text-pf-muted">
            <button 
              onClick={() => setCurrentScreen('silla')}
              className={`flex flex-col items-center ${currentScreen === 'silla' ? 'text-pf-terracota font-bold' : 'hover:text-white'}`}
            >
              <Scissors className="w-4 h-4" />
              <span>Silla</span>
            </button>
            <button 
              onClick={() => setCurrentScreen('arqueo')}
              className={`flex flex-col items-center ${currentScreen === 'arqueo' ? 'text-pf-brass font-bold' : 'hover:text-white'}`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Caja</span>
            </button>
            <button 
              onClick={() => showToast('📷 Cámara de cortes lista para subir a portafolio.')}
              className="hover:text-white flex flex-col items-center"
            >
              <Camera className="w-4 h-4" />
              <span>Cortes</span>
            </button>
            <button 
              onClick={() => setCurrentScreen('login')}
              className={`flex flex-col items-center ${currentScreen === 'login' ? 'text-pf-bone font-bold' : 'hover:text-white'}`}
            >
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </button>
          </div>

        </div>
      </div>

      {/* MODAL WALK-IN (Cliente sin cita) */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-sm w-full bg-pf-surface space-y-4 border border-pf-terracota/40 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-pf-terracota font-bold">2 TOQUES DE PIE</span>
                <h3 className="font-display font-bold text-sm text-pf-bone">+ Agregar Cliente Sin Cita</h3>
              </div>
              <button onClick={() => setShowWalkInModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleAddWalkIn} className="space-y-3 text-xs">
              <div>
                <label className="pf-label">Nombre o Apodo del Cliente</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="Ej: Don Jaime / Carlos Vecino"
                  value={walkInData.name}
                  onChange={(e) => setWalkInData({ ...walkInData, name: e.target.value })}
                  className="pf-input"
                />
              </div>

              <div>
                <label className="pf-label">Celular (Opcional para recibo)</label>
                <input 
                  type="tel" 
                  placeholder="Ej: 315 789 2341"
                  value={walkInData.phone}
                  onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })}
                  className="pf-input"
                />
              </div>

              <div>
                <label className="pf-label">Servicio a Realizar</label>
                <select 
                  value={walkInData.serviceName}
                  onChange={(e) => {
                    const serv = e.target.value;
                    let price = 25000;
                    if (serv === 'Perfilado de Barba') price = 22000;
                    if (serv === 'Combo Corte + Barba Vaporizada') price = 45000;
                    setWalkInData({ ...walkInData, serviceName: serv, priceCOP: price });
                  }}
                  className="pf-input"
                >
                  <option value="Corte Clásico Punto Fino">Corte Clásico ($ 25.000 COP - 40 min)</option>
                  <option value="Perfilado de Barba">Perfilado de Barba ($ 22.000 COP - 35 min)</option>
                  <option value="Combo Corte + Barba Vaporizada">Combo Corte + Barba ($ 45.000 COP - 70 min)</option>
                </select>
              </div>

              <div className="p-2.5 rounded bg-pf-carbon border border-white/5 text-[10px] text-pf-muted">
                {isOnline ? (
                  <span className="text-pf-available flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Bloquea automáticamente la franja en la web pública.
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Se guardará en SQLite y sincronizará al volver la señal.
                  </span>
                )}
              </div>

              <button type="submit" className="pf-btn-primary w-full py-2.5 text-xs font-bold">
                Sentar en la Silla Inmediatamente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COBRO POS EN SILLA */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-sm w-full bg-pf-surface space-y-4 border border-pf-available/40 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-pf-available font-bold">COBRO POS · PUNTO FINO</span>
                <h3 className="font-display font-bold text-sm text-pf-bone">Cobrar Turno en Silla</h3>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-pf-carbon rounded-xl border border-white/5 text-center space-y-1">
              <div className="text-[10px] text-pf-muted uppercase font-mono">Total a Cobrar</div>
              <div className="text-2xl font-mono font-bold text-pf-bone">
                $ {((currentActiveApt?.price || 45000) + tipAmount).toLocaleString('es-CO')} COP
              </div>
              <div className="text-[10px] text-pf-brass font-mono">
                Tu comisión estimada: $ {Math.round((currentActiveApt?.price || 45000) * 0.5).toLocaleString('es-CO')} COP (50%)
              </div>
            </div>

            {/* Selector de Método de Pago de Barrio */}
            <div className="space-y-2 text-xs">
              <label className="pf-label">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'EFECTIVO', name: '💵 Efectivo' },
                  { id: 'NEQUI', name: '📱 Nequi' },
                  { id: 'DAVIPLATA', name: '🔴 Daviplata' },
                  { id: 'DATAFONO', name: '💳 Datáfono Bold' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedPayment(m.id)}
                    className={`p-2 rounded text-xs font-medium border text-center transition-all ${
                      selectedPayment === m.id 
                        ? 'border-pf-terracota bg-pf-elevated text-white font-bold shadow-sm' 
                        : 'border-white/10 bg-pf-surface text-pf-muted hover:border-white/20'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculadora de devuelta para Efectivo */}
            {selectedPayment === 'EFECTIVO' && (
              <div className="p-2.5 rounded bg-pf-elevated border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-pf-muted">Recibe billete de:</span>
                  <div className="flex gap-1">
                    {[50000, 100000].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setCashReceived(bill)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${cashReceived === bill ? 'bg-pf-brass text-pf-carbon font-bold' : 'bg-pf-carbon text-pf-muted'}`}
                      >
                        ${bill / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between font-mono pt-1 border-t border-white/5">
                  <span className="text-pf-muted text-[11px]">Devuelta al cliente:</span>
                  <span className="text-pf-available font-bold text-sm">
                    $ {Math.max(0, cashReceived - ((currentActiveApt?.price || 45000) + tipAmount)).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
            )}

            {/* Propina */}
            <div className="space-y-1 text-xs">
              <label className="pf-label">Propina Voluntaria</label>
              <div className="flex gap-1.5">
                {[0, 2000, 5000, 10000].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipAmount(t)}
                    className={`flex-1 py-1 rounded text-[11px] font-mono border transition-all ${
                      tipAmount === t 
                        ? 'border-pf-brass bg-pf-brass/20 text-pf-brass-light font-bold' 
                        : 'border-white/10 bg-pf-surface text-pf-muted'
                    }`}
                  >
                    {t === 0 ? '$0' : `+$${t/1000}k`}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleFinishCheckout}
              className="pf-btn-primary w-full py-3 text-xs font-bold shadow-lg"
            >
              Registrar Cobro y Liberar Silla
            </button>
          </div>
        </div>
      )}

      {/* MODAL FICHA TÉCNICA DE CORTE */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-sm w-full bg-pf-surface space-y-4 border border-pf-brass/40 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-pf-brass font-bold">FICHA PRIVADA DEL CLIENTE</span>
                <h3 className="font-display font-bold text-sm text-pf-bone">Fórmula Técnica de Corte</h3>
              </div>
              <button onClick={() => setShowFormulaModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>

            <p className="text-[10px] text-pf-muted">
              Esta fórmula es visible únicamente para el equipo de barberos de Punto Fino. Sirve para garantizar que el cliente reciba el mismo corte perfecto sin importar qué barbero lo atienda.
            </p>

            <div>
              <label className="pf-label">Instrucciones y Ajustes</label>
              <textarea 
                rows={4}
                value={clientFormula}
                onChange={(e) => setClientFormula(e.target.value)}
                className="pf-input text-xs leading-relaxed"
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowFormulaModal(false)} 
                className="pf-btn-secondary flex-1 py-2 text-xs"
              >
                Cerrar
              </button>
              <button 
                type="button" 
                onClick={handleSaveFormula} 
                className="pf-btn-primary flex-1 py-2 text-xs font-bold"
              >
                Guardar Fórmula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
