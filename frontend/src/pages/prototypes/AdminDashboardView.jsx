import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Calendar, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, Mail, ShieldAlert, ArrowUpRight, 
  RefreshCw, Scissors, ChevronRight, Package, Receipt,
  Wallet, FileSpreadsheet, Download, Plus, Check, ArrowRight,
  Shield, UserCheck, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminDashboardView() {
  const getParams = () => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  };

  const params = getParams();
  const initialSection = ['overview', 'reception', 'cash', 'inventory', 'payroll', 'clients'].includes(params.get('section'))
    ? params.get('section')
    : 'overview';

  const [activeSection, setActiveSection] = useState(initialSection);
  const [toastMessage, setToastMessage] = useState(null);

  // Estados de Modales
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockQty, setRestockQty] = useState(10);

  // Datos de Estado Local / API
  const [kpis, setKpis] = useState({
    totalRevenueCOP: 580000,
    totalCommissionsCOP: 290000,
    totalAppointmentsCount: 18,
    completedCount: 12,
    inProgressCount: 2,
    confirmedCount: 4,
    occupancyRatePct: 84,
  });

  const [chairStatus, setChairStatus] = useState([
    {
      chairNumber: 1,
      barberId: 'barber-1',
      nickname: 'Juan David',
      fullName: 'Juan David',
      status: 'EN_SILLA',
      isOccupied: true,
      clientName: 'Andrés Felipe Caicedo',
      serviceName: 'Corte + barba',
      elapsedMin: 28,
      todayRevenueCOP: 185000,
      todayCommissionCOP: 92500,
      todayCompletedCount: 5,
    },
    {
      chairNumber: 2,
      barberId: 'barber-2',
      nickname: 'Emanuel Torres',
      fullName: 'Emanuel Torres',
      status: 'LIBRE',
      isOccupied: false,
      clientName: null,
      serviceName: 'Próxima: 04:15 PM (Mateo Holguín)',
      elapsedMin: 0,
      todayRevenueCOP: 140000,
      todayCommissionCOP: 70000,
      todayCompletedCount: 4,
    },
    {
      chairNumber: 3,
      barberId: 'barber-3',
      nickname: 'Juan Diego',
      fullName: 'Juan Diego',
      status: 'EN_SILLA',
      isOccupied: true,
      clientName: 'Don Jaime (Vecino)',
      serviceName: 'Corte sencillo',
      elapsedMin: 14,
      todayRevenueCOP: 95000,
      todayCommissionCOP: 47500,
      todayCompletedCount: 3,
    },
  ]);

  const [cashSession, setCashSession] = useState({
    openedAt: '09:00 AM',
    openingBaseCOP: 100000,
    cashInDrawerCOP: 190000,
    nequiCOP: 165000,
    daviplataCOP: 45000,
    datafonoCOP: 85000,
    transferCOP: 95000,
    totalDigitalCOP: 390000,
    grandTotalRevenueCOP: 580000,
    expectedCashInDrawerCOP: 290000,
    isClosed: false,
  });

  const [products, setProducts] = useState([
    { id: 'p1', name: 'Pomada Fijación Fuerte Mate', brand: 'Bandido Colombia', priceCOP: 35000, costCOP: 20000, stock: 14, minStock: 5, category: 'Peinado' },
    { id: 'p2', name: 'Aceite Hidratante para Barba 30ml', brand: 'Punto Fino Lab', priceCOP: 28000, costCOP: 14000, stock: 8, minStock: 4, category: 'Barba' },
    { id: 'p3', name: 'Cuchillas Derby Premium (Caja x100)', brand: 'Derby Extra', priceCOP: 45000, costCOP: 30000, stock: 12, minStock: 20, category: 'Insumos', isCritical: true },
    { id: 'p4', name: 'Shampoo Mentolado Anticaspa 250ml', brand: 'Barber Lab', priceCOP: 32000, costCOP: 18000, stock: 6, minStock: 3, category: 'Capilar' },
    { id: 'p5', name: 'Loción Astringente Post-Afeitado', brand: 'Punto Fino Lab', priceCOP: 24000, costCOP: 12000, stock: 9, minStock: 5, category: 'Afeitado' },
  ]);

  const [payroll, setPayroll] = useState([
    {
      barberId: 'barber-1',
      nickname: 'Juan David',
      fullName: 'Juan David',
      chair: 'Silla #1',
      servicesCount: 26,
      grossCOP: 1040000,
      commissionCOP: 520000, // 50%
      tipsCOP: 68000,
      netPayableCOP: 588000,
      status: 'PENDIENTE',
    },
    {
      barberId: 'barber-2',
      nickname: 'Emanuel Torres',
      fullName: 'Emanuel Torres',
      chair: 'Silla #2',
      servicesCount: 22,
      grossCOP: 880000,
      commissionCOP: 440000,
      tipsCOP: 54000,
      netPayableCOP: 494000,
      status: 'PENDIENTE',
    },
    {
      barberId: 'barber-3',
      nickname: 'Juan Diego',
      fullName: 'Juan Diego',
      chair: 'Silla #3',
      servicesCount: 19,
      grossCOP: 720000,
      commissionCOP: 360000,
      tipsCOP: 42000,
      netPayableCOP: 402000,
      status: 'PENDIENTE',
    },
  ]);

  const [clients, setClients] = useState([
    {
      id: 'c1',
      name: 'Andrés Felipe Caicedo',
      email: 'andres.caicedo@cali.co',
      stamps: 4,
      visits: 8,
      totalSpent: 360000,
      lastVisit: 'Hoy (En silla)',
      formula: 'Fade #0.5 en sienes con transición suave a tijera arriba. Cerquillo recto a navaja de un solo filo. Toalla tibia, evitar loción con alcohol.',
      barber: 'Juan David',
    },
    {
      id: 'c2',
      name: 'Mateo Holguín',
      email: 'mateo.holguin@gmail.com',
      stamps: 5,
      visits: 5,
      totalSpent: 185000,
      lastVisit: 'Hoy 04:15 PM',
      formula: 'Degradado medio clásico a tijera arriba con navaja en contornos. Peinado con cera mate.',
      barber: 'Emanuel Torres',
    },
    {
      id: 'c3',
      name: 'Don Jaime (Vecino Villacolombia)',
      email: 'jaime.vecino@gmail.com',
      stamps: 3,
      visits: 12,
      totalSpent: 300000,
      lastVisit: 'Hoy 12:00 PM',
      formula: 'Corte tradicional clásico de tijera, peinado hacia un lado, patillas cuadradas naturales.',
      barber: 'Juan David',
    },
    {
      id: 'c4',
      name: 'Sebastián Varela',
      email: 'sebastian.varela@valle.gov.co',
      stamps: 2,
      visits: 3,
      totalSpent: 135000,
      lastVisit: 'Ayer',
      formula: 'Combo completo con ritual de barba. Piel reactiva en garganta, aplicar bálsamo de caléndula.',
      barber: 'Juan Diego',
    },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReassign = () => {
    setShowReassignModal(false);
    showToast('✅ Cita reasignada con éxito. Notificaciones enviadas por correo.');
  };

  const handleRestock = () => {
    if (!selectedProduct) return;
    setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, stock: p.stock + Number(restockQty) } : p));
    setShowRestockModal(false);
    showToast(`📦 Entrada de ${restockQty} unidades registrada para ${selectedProduct.name}.`);
  };

  const handleCloseCash = () => {
    setCashSession({ ...cashSession, isClosed: true });
    setShowCloseCashModal(false);
    showToast('🛡️ Caja diaria cerrada formalmente y respaldada en Neon DB.');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-pf-elevated text-pf-bone border border-pf-brass px-4 py-3 rounded-lg shadow-2xl font-mono text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-pf-brass" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header del Tablero Administrativo */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-mono text-pf-terracota uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> SUPERFICIE 3: PANEL WEB DE ADMINISTRACIÓN & RECEPCIÓN/CAJA
          </span>
          <h2 className="text-2xl font-display font-bold text-pf-bone">
            Consola Operativa · Punto Fino Villacolombia
          </h2>
          <p className="text-xs text-pf-muted">
            Monitoreo en tiempo real de sillas, caja física/digital, catálogo de insumos, nómina y fichas técnicas de clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="pf-badge-available font-mono text-xs flex items-center gap-1.5">
            <span className="pf-dot-live" /> 4 SILLAS SINCRONIZADAS
          </span>
          <button 
            onClick={() => setShowCloseCashModal(true)}
            className="pf-btn-secondary text-xs font-bold"
          >
            <Receipt className="w-3.5 h-3.5" /> Arqueo de Caja
          </button>
        </div>
      </div>

      {/* Barra de Navegación por Módulos Desktop */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'overview', label: '📊 Tablero General', desc: 'KPIs y Sillas' },
          { id: 'reception', label: '💺 Recepción Multi-Silla', desc: 'Timeline' },
          { id: 'cash', label: '💵 Caja & Arqueo Diario', desc: 'Gaveta y Canales' },
          { id: 'inventory', label: '🧴 Insumos & Pomadas', desc: 'Stock y Alertas' },
          { id: 'payroll', label: '🧾 Nómina & Liquidación', desc: 'Comisiones 50%' },
          { id: 'clients', label: '👥 Directorio Clientes', desc: 'Sellos y Fórmulas' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeSection === sec.id
                ? 'bg-pf-terracota text-white shadow-fine-terracota'
                : 'bg-pf-surface text-pf-muted hover:text-white border border-white/5 hover:border-white/20'
            }`}
          >
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 1: TABLERO GENERAL (OVERVIEW)                     */}
      {/* ======================================================== */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Tarjetas de Métricas Clave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pf-card p-5 bg-pf-surface/90 space-y-2 border-l-4 border-l-pf-terracota">
              <div className="flex items-center justify-between text-xs text-pf-muted font-mono">
                <span>INGRESOS HOY</span>
                <DollarSign className="w-4 h-4 text-pf-terracota" />
              </div>
              <div className="text-2xl font-mono font-bold text-pf-bone">
                $ {kpis.totalRevenueCOP.toLocaleString('es-CO')} COP
              </div>
              <div className="text-[11px] text-pf-available flex items-center gap-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" /> +22% vs. promedio semana
              </div>
            </div>

            <div className="pf-card p-5 bg-pf-surface/90 space-y-2 border-l-4 border-l-pf-available">
              <div className="flex items-center justify-between text-xs text-pf-muted font-mono">
                <span>OCUPACIÓN SILLAS</span>
                <Users className="w-4 h-4 text-pf-available" />
              </div>
              <div className="text-2xl font-mono font-bold text-pf-bone">
                {kpis.occupancyRatePct}%
              </div>
              <div className="text-[11px] text-pf-muted font-mono">
                {kpis.completedCount + kpis.inProgressCount} de {kpis.totalAppointmentsCount} cupos atendidos
              </div>
            </div>

            <div className="pf-card p-5 bg-pf-surface/90 space-y-2 border-l-4 border-l-pf-brass">
              <div className="flex items-center justify-between text-xs text-pf-muted font-mono">
                <span>COMISIÓN EQUIPO (50%)</span>
                <Receipt className="w-4 h-4 text-pf-brass" />
              </div>
              <div className="text-2xl font-mono font-bold text-pf-bone">
                $ {kpis.totalCommissionsCOP.toLocaleString('es-CO')} COP
              </div>
              <div className="text-[10px] text-pf-subtle font-mono">
                * REVISAR CON CONTADOR / ABOGADO
              </div>
            </div>

            <div className="pf-card p-5 bg-pf-surface/90 space-y-2 border-l-4 border-l-sky-500">
              <div className="flex items-center justify-between text-xs text-pf-muted font-mono">
                <span>CORREOS RESEND & ICS</span>
                <Mail className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-pf-bone">
                100% Entregados
              </div>
              <div className="text-[11px] text-sky-400/90 font-mono">
                0 rebotes · DKIM / SPF Válido
              </div>
            </div>
          </div>

          {/* Grid de las 4 Sillas en Tiempo Real */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-pf-bone flex items-center gap-2">
                <Scissors className="w-4 h-4 text-pf-terracota" />
                <span>Estado Multi-Silla en Vivo (Barrio Villacolombia)</span>
              </h3>
              <span className="text-xs font-mono text-pf-muted">Actualizado hace instantes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {chairStatus.map((ch) => (
                <div 
                  key={ch.chairNumber}
                  className={`pf-card p-4 space-y-3 border transition-all ${
                    ch.status === 'EN_SILLA'
                      ? 'border-pf-terracota bg-pf-surface shadow-fine-terracota'
                      : ch.status === 'LIBRE'
                      ? 'border-pf-available/40 bg-pf-surface/80'
                      : 'border-white/10 bg-pf-carbon'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-pf-muted font-bold">
                      SILLA #{ch.chairNumber}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      ch.status === 'EN_SILLA'
                        ? 'bg-pf-terracota/20 text-pf-terracota border border-pf-terracota/40'
                        : ch.status === 'LIBRE'
                        ? 'bg-pf-available/20 text-pf-available border border-pf-available/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {ch.status}
                    </span>
                  </div>

                  <div>
                    <div className="font-display font-bold text-sm text-pf-bone">{ch.nickname}</div>
                    <div className="text-[11px] text-pf-muted">{ch.fullName}</div>
                  </div>

                  {ch.status === 'EN_SILLA' ? (
                    <div className="p-2.5 rounded bg-pf-carbon border border-pf-terracota/30 space-y-1">
                      <div className="text-[10px] text-pf-terracota font-mono font-bold flex items-center justify-between">
                        <span>EN SILLA</span>
                        <span>⏱ {ch.elapsedMin} min</span>
                      </div>
                      <div className="text-xs font-bold text-pf-bone truncate">{ch.clientName}</div>
                      <div className="text-[10px] text-pf-muted truncate">{ch.serviceName}</div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded bg-pf-elevated border border-white/5 space-y-1 text-xs">
                      <div className="text-[10px] text-pf-available font-mono">DISPONIBLE</div>
                      <div className="text-[11px] text-pf-muted">{ch.serviceName}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                    <span className="text-pf-muted">{ch.todayCompletedCount} cortes hoy</span>
                    <span className="text-pf-bone font-bold">$ {ch.todayRevenueCOP.toLocaleString('es-CO')}</span>
                  </div>

                  <button
                    onClick={() => setShowReassignModal(true)}
                    className="w-full pf-btn-outline py-1.5 text-[10px] font-mono flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reasignar Citas
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas Operativas: Insumos y Resend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pf-card p-5 bg-pf-surface/60 space-y-2 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 font-mono">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> ALERTA DE INSUMOS CRÍTICOS
                </span>
                <button 
                  onClick={() => setActiveSection('inventory')}
                  className="text-[10px] underline hover:text-white"
                >
                  Gestionar Stock
                </button>
              </div>
              <div className="text-xs text-pf-muted space-y-1">
                <div>• Cuchillas Derby Premium: <strong>12 unidades</strong> (Stock mínimo requerido: 20).</div>
                <div>• Toallas de vapor esterilizadas: <strong>18 disponibles</strong> (Suficiente para la jornada de hoy).</div>
              </div>
            </div>

            <div className="pf-card p-5 bg-pf-surface/60 space-y-2 border-l-4 border-l-sky-500">
              <div className="flex items-center justify-between text-xs font-bold text-sky-400 font-mono">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> AUDITORÍA DE CORREOS TRANSACCIONALES
                </span>
                <span className="text-[10px] font-mono text-sky-400">RESEND API V1</span>
              </div>
              <div className="text-xs text-pf-muted space-y-1">
                <div>• Último correo enviado: <strong>PF-8492 a mateo.holguin@gmail.com</strong> (Entregado en 1.1s).</div>
                <div>• Webhooks verificados de entrega y confirmación con archivo .ics adjunto.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 2: RECEPCIÓN & MULTI-SILLA (TIMELINE HORIZONTAL)   */}
      {/* ======================================================== */}
      {activeSection === 'reception' && (
        <div className="space-y-4 pf-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-pf-bone">
                Recepción & Timeline Multi-Silla (Hoy)
              </h3>
              <p className="text-xs text-pf-muted">
                Control visual de citas en recepción. Permite sentar clientes walk-in y gestionar citas de la web pública.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => showToast('👤 Cliente sin cita registrado y asignado a Silla #2 Emanuel Torres.')}
                className="pf-btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> + Recibir Cliente en Sala
              </button>
            </div>
          </div>

          {/* Grilla Horaria por Barbero */}
          <div className="space-y-3 overflow-x-auto">
            {chairStatus.map((ch) => (
              <div key={ch.chairNumber} className="p-3 rounded-xl bg-pf-carbon border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-pf-terracota">Silla #{ch.chairNumber}</span>
                    <span className="font-display font-bold text-pf-bone">{ch.nickname}</span>
                    <span className="text-[10px] text-pf-muted">({ch.fullName})</span>
                  </div>
                  <span className="text-[10px] font-mono text-pf-muted">
                    Hoy: $ {ch.todayRevenueCOP.toLocaleString('es-CO')} COP producidos
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-pf-surface border border-white/5 text-center">
                    <div className="text-[9px] text-pf-muted">10:00 AM</div>
                    <div className="font-bold text-pf-bone truncate">Julián M.</div>
                    <div className="text-[8px] text-pf-available">Listo</div>
                  </div>
                  <div className="p-2 rounded bg-pf-surface border border-white/5 text-center">
                    <div className="text-[9px] text-pf-muted">11:15 AM</div>
                    <div className="font-bold text-pf-bone truncate">Carlos V.</div>
                    <div className="text-[8px] text-pf-available">Listo</div>
                  </div>
                  <div className="p-2 rounded bg-pf-terracota/20 border border-pf-terracota text-center shadow-fine-terracota">
                    <div className="text-[9px] text-pf-terracota font-bold">12:30 PM (AHORA)</div>
                    <div className="font-bold text-white truncate">{ch.clientName || 'Silla Libre'}</div>
                    <div className="text-[8px] text-pf-terracota">En Silla</div>
                  </div>
                  <div className="p-2 rounded bg-pf-surface border border-white/5 text-center">
                    <div className="text-[9px] text-pf-muted">02:00 PM</div>
                    <div className="font-bold text-pf-bone truncate">Mateo H.</div>
                    <div className="text-[8px] text-pf-brass">Confirmado</div>
                  </div>
                  <div className="p-2 rounded bg-pf-elevated border border-dashed border-white/10 text-center">
                    <div className="text-[9px] text-pf-muted">03:30 PM</div>
                    <div className="font-bold text-pf-muted">Disponible</div>
                    <div className="text-[8px] text-pf-available">Libre</div>
                  </div>
                  <div className="p-2 rounded bg-pf-surface border border-white/5 text-center">
                    <div className="text-[9px] text-pf-muted">05:00 PM</div>
                    <div className="font-bold text-pf-bone truncate">Sebastián V.</div>
                    <div className="text-[8px] text-pf-brass">Confirmado</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 3: CAJA & ARQUEO DIARIO                          */}
      {/* ======================================================== */}
      {activeSection === 'cash' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Resumen Principal de Caja */}
            <div className="pf-card p-6 space-y-4 lg:col-span-1 border border-pf-brass/40">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-pf-brass font-bold uppercase">ESTADO DE CAJA</span>
                  <h3 className="font-display font-bold text-base text-pf-bone">Arqueo Diario de Caja</h3>
                </div>
                <span className="pf-badge-available font-mono text-[10px]">ABIERTA (09:00 AM)</span>
              </div>

              <div className="p-4 bg-pf-carbon rounded-xl border border-white/5 space-y-2">
                <div className="text-xs text-pf-muted font-mono uppercase">Efectivo Total Esperado en Gaveta</div>
                <div className="text-3xl font-mono font-bold text-pf-bone">
                  $ {cashSession.expectedCashInDrawerCOP.toLocaleString('es-CO')} COP
                </div>
                <div className="text-[11px] text-pf-muted space-y-1 pt-1 border-t border-white/5">
                  <div className="flex justify-between">
                    <span>Base inicial en efectivo:</span>
                    <span className="font-mono text-pf-bone font-bold">$ {cashSession.openingBaseCOP.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efectivo cobrado por servicios:</span>
                    <span className="font-mono text-pf-available font-bold">+ $ {cashSession.cashInDrawerCOP.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded bg-pf-surface border border-white/5 text-xs text-pf-muted space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Facturación Total (Efectivo + Digital):</span>
                  <span className="font-bold text-pf-bone">$ {cashSession.grandTotalRevenueCOP.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Canales Digitales (Nequi / Dav / Data):</span>
                  <span className="font-bold text-pf-brass">$ {cashSession.totalDigitalCOP.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <button
                onClick={() => setShowCloseCashModal(true)}
                className="w-full pf-btn-primary py-3 text-xs font-bold shadow-lg"
              >
                <Shield className="w-3.5 h-3.5" /> Efectuar Arqueo Físico y Cierre
              </button>
            </div>

            {/* Desglose por Métodos de Pago */}
            <div className="pf-card p-6 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="font-display font-bold text-base text-pf-bone">
                  Discriminación por Canal de Pago (Realidad Caleña)
                </h3>
                <span className="text-[10px] font-mono text-pf-muted">HOY</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-pf-carbon border border-white/5 space-y-1">
                  <div className="text-[10px] font-mono text-pf-muted">💵 EFECTIVO EN GAVETA</div>
                  <div className="text-xl font-mono font-bold text-pf-bone">$ {cashSession.cashInDrawerCOP.toLocaleString('es-CO')} COP</div>
                  <div className="text-[10px] text-pf-subtle">32.7% de las transacciones</div>
                </div>

                <div className="p-4 rounded-xl bg-pf-carbon border border-white/5 space-y-1">
                  <div className="text-[10px] font-mono text-pf-muted">📱 NEQUI COMERCIO (CÓDIGO QR)</div>
                  <div className="text-xl font-mono font-bold text-pf-bone">$ {cashSession.nequiCOP.toLocaleString('es-CO')} COP</div>
                  <div className="text-[10px] text-pf-subtle">28.4% de las transacciones</div>
                </div>

                <div className="p-4 rounded-xl bg-pf-carbon border border-white/5 space-y-1">
                  <div className="text-[10px] font-mono text-pf-muted">🔴 DAVIPLATA BARBERÍA</div>
                  <div className="text-xl font-mono font-bold text-pf-bone">$ {cashSession.daviplataCOP.toLocaleString('es-CO')} COP</div>
                  <div className="text-[10px] text-pf-subtle">7.8% de las transacciones</div>
                </div>

                <div className="p-4 rounded-xl bg-pf-carbon border border-white/5 space-y-1">
                  <div className="text-[10px] font-mono text-pf-muted">💳 DATÁFONO BOLD / REDEBAN</div>
                  <div className="text-xl font-mono font-bold text-pf-bone">$ {cashSession.datafonoCOP.toLocaleString('es-CO')} COP</div>
                  <div className="text-[10px] text-pf-subtle">14.7% de las transacciones</div>
                </div>
              </div>

              <div className="p-3 bg-pf-elevated rounded-lg border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-pf-brass" />
                  <span className="text-pf-muted">Transferencia Bancolombia / PSE:</span>
                </div>
                <span className="font-mono font-bold text-pf-bone">$ {cashSession.transferCOP.toLocaleString('es-CO')} COP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 4: INSUMOS & POMADAS (INVENTARIO)                 */}
      {/* ======================================================== */}
      {activeSection === 'inventory' && (
        <div className="pf-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-pf-bone">
                Inventario de Productos & Insumos Críticos
              </h3>
              <p className="text-xs text-pf-muted">
                Control de existencias de productos de reventa y materiales de consumo en silla (cuchillas, toallas y vapor).
              </p>
            </div>
            <button 
              onClick={() => {
                setSelectedProduct(products[0]);
                setShowRestockModal(true);
              }}
              className="pf-btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> + Registrar Entrada de Compra
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-pf-muted">
                  <th className="py-2.5">PRODUCTO / MARCA</th>
                  <th className="py-2.5">CATEGORÍA</th>
                  <th className="py-2.5">PRECIO VENTA</th>
                  <th className="py-2.5">COSTO</th>
                  <th className="py-2.5">STOCK ACTUAL</th>
                  <th className="py-2.5">ESTADO</th>
                  <th className="py-2.5 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-pf-elevated/40">
                      <td className="py-3">
                        <div className="font-bold text-pf-bone">{p.name}</div>
                        <div className="text-[10px] text-pf-muted">{p.brand}</div>
                      </td>
                      <td className="py-3 text-pf-muted">{p.category}</td>
                      <td className="py-3 text-pf-bone font-bold">$ {p.priceCOP.toLocaleString('es-CO')}</td>
                      <td className="py-3 text-pf-muted">$ {p.costCOP.toLocaleString('es-CO')}</td>
                      <td className="py-3">
                        <span className="font-bold text-sm text-pf-bone">{p.stock}</span>
                        <span className="text-[10px] text-pf-muted"> (mín: {p.minStock})</span>
                      </td>
                      <td className="py-3">
                        {isLow ? (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-2.5 h-2.5" /> STOCK BAJO
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-pf-available/20 text-pf-available border border-pf-available/30 flex items-center gap-1 w-max">
                            <Check className="w-2.5 h-2.5" /> ÓPTIMO
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setShowRestockModal(true);
                          }}
                          className="pf-btn-outline py-1 px-2.5 text-[10px]"
                        >
                          Reabastecer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 5: NÓMINA & LIQUIDACIÓN DE COMISIONES (50%)       */}
      {/* ======================================================== */}
      {activeSection === 'payroll' && (
        <div className="pf-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-pf-bone">
                  Liquidación de Nómina & Comisiones (Quincenal)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pf-brass/20 text-pf-brass-light border border-pf-brass/40">
                  50% COMISIÓN
                </span>
              </div>
              <p className="text-xs text-pf-muted">
                Cálculo de honorarios por corte realizado y propinas recibidas por cada maestro barbero.
              </p>
              <p className="text-[10px] font-mono text-pf-brass font-bold mt-1">
                * [REVISAR CON CONTADOR / ABOGADO LABORAL: Honorarios por prestación de servicios independientes]
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => showToast('📥 Reporte de nómina quincenal exportado a formato contable.')}
                className="pf-btn-secondary text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Planilla Contable
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-pf-muted">
                  <th className="py-2.5">BARBERO</th>
                  <th className="py-2.5">SILLA</th>
                  <th className="py-2.5">CORTES LISTOS</th>
                  <th className="py-2.5">FACTURADO BRUTO</th>
                  <th className="py-2.5">COMISIÓN (50%)</th>
                  <th className="py-2.5">PROPINAS</th>
                  <th className="py-2.5">NETO A PAGAR</th>
                  <th className="py-2.5 text-right">ESTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payroll.map((pay) => (
                  <tr key={pay.barberId} className="hover:bg-pf-elevated/40">
                    <td className="py-3">
                      <div className="font-bold text-pf-bone">{pay.nickname}</div>
                      <div className="text-[10px] text-pf-muted">{pay.fullName}</div>
                    </td>
                    <td className="py-3 text-pf-muted">{pay.chair}</td>
                    <td className="py-3 font-bold text-pf-bone">{pay.servicesCount} cortes</td>
                    <td className="py-3 text-pf-muted">$ {pay.grossCOP.toLocaleString('es-CO')}</td>
                    <td className="py-3 text-pf-terracota font-bold">$ {pay.commissionCOP.toLocaleString('es-CO')}</td>
                    <td className="py-3 text-pf-brass-light">+$ {pay.tipsCOP.toLocaleString('es-CO')}</td>
                    <td className="py-3 font-bold text-pf-bone text-sm">$ {pay.netPayableCOP.toLocaleString('es-CO')} COP</td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => showToast(`💸 Pago de $ ${pay.netPayableCOP.toLocaleString('es-CO')} COP registrado para ${pay.nickname}.`)}
                        className="pf-btn-outline py-1 px-2.5 text-[10px] hover:border-pf-available hover:text-pf-available"
                      >
                        Pagar Honorarios
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 6: DIRECTORIO DE CLIENTES & FICHAS TÉCNICAS       */}
      {/* ======================================================== */}
      {activeSection === 'clients' && (
        <div className="pf-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-pf-bone">
                Directorio de Clientes & Fichas Técnicas Privadas
              </h3>
              <p className="text-xs text-pf-muted">
                Registro fiel de las preferencias de corte, toalla caliente y fidelización de clientes de Cali.
              </p>
            </div>
            <div className="text-xs font-mono text-pf-muted">
              Total clientes registrados: <strong className="text-white">{clients.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-pf-carbon border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <div className="font-display font-bold text-sm text-pf-bone">{c.name}</div>
                    <div className="text-[10px] font-mono text-pf-muted">{c.email}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pf-brass/20 text-pf-brass-light border border-pf-brass/30">
                      ⭐ {c.stamps}/6 Sellos
                    </span>
                    <div className="text-[10px] text-pf-muted mt-0.5">{c.visits} visitas</div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-pf-surface border border-white/5 space-y-1 text-xs">
                  <div className="text-[10px] font-mono text-pf-brass font-bold flex items-center justify-between">
                    <span>FÓRMULA PRIVADA DE CORTE</span>
                    <span className="text-pf-muted">Barbero habitual: {c.barber}</span>
                  </div>
                  <p className="text-[11px] text-pf-muted leading-relaxed">
                    {c.formula}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-pf-subtle">
                  <span>Última visita: {c.lastVisit}</span>
                  <span className="text-pf-bone font-bold">Total gastado: $ {c.totalSpent.toLocaleString('es-CO')} COP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL REASIGNACIÓN DE CITA */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-sm w-full bg-pf-surface space-y-4 border border-pf-brass animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-sm text-pf-bone">Reasignar Cita a Otro Barbero</h3>
              <button onClick={() => setShowReassignModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-pf-muted">
                Selecciona el barbero que recibirá la cita. Se notificarán automáticamente por correo el cliente y ambos barberos.
              </p>
              <div>
                <label className="pf-label">Barbero Destino</label>
                <select className="pf-input">
                  <option>Carlos Valencia ("El Primo" - Silla 2)</option>
                  <option>Andrés Mosquera ("Junior" - Silla 3)</option>
                  <option>Alberto Cardona ("Master" - Silla 4)</option>
                </select>
              </div>
              <button onClick={handleReassign} className="pf-btn-primary w-full py-2.5 font-bold">
                Confirmar Reasignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REABASTECIMIENTO DE INSUMOS */}
      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-sm w-full bg-pf-surface space-y-4 border border-pf-terracota animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-sm text-pf-bone">Reabastecer Producto</h3>
              <button onClick={() => setShowRestockModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="font-bold text-pf-bone">{selectedProduct.name}</div>
                <div className="text-[10px] text-pf-muted">{selectedProduct.brand} · Stock actual: {selectedProduct.stock}</div>
              </div>
              <div>
                <label className="pf-label">Cantidad a Ingresar</label>
                <input 
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="pf-input"
                />
              </div>
              <button onClick={handleRestock} className="pf-btn-primary w-full py-2.5 font-bold">
                Registrar Entrada de Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CIERRE Y ARQUEO FÍSICO DE CAJA */}
      {showCloseCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="pf-card p-6 max-w-sm w-full bg-pf-surface space-y-4 border border-pf-available animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-pf-available font-bold">ARQUEO FÍSICO DE CIERRE</span>
                <h3 className="font-display font-bold text-sm text-pf-bone">Cierre Formal de Caja Diaria</h3>
              </div>
              <button onClick={() => setShowCloseCashModal(false)} className="text-pf-muted hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded bg-pf-carbon border border-white/5 space-y-1">
                <div className="text-pf-muted text-[10px]">Efectivo esperado en gaveta:</div>
                <div className="text-xl font-bold text-pf-bone">
                  $ {cashSession.expectedCashInDrawerCOP.toLocaleString('es-CO')} COP
                </div>
              </div>

              <div>
                <label className="pf-label font-mono">Efectivo Físico Contado</label>
                <input 
                  type="text" 
                  defaultValue="$ 290.000 COP"
                  className="pf-input"
                />
              </div>

              <div className="text-[10px] text-pf-available flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Arqueo cuadrado sin sobrantes ni faltantes.</span>
              </div>

              <button onClick={handleCloseCash} className="pf-btn-primary w-full py-2.5 font-bold">
                Confirmar y Cerrar Caja de Hoy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
