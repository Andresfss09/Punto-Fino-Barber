import React, { useState } from 'react';
import { 
  Users, DollarSign, Calendar, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, Mail, ShieldAlert, ArrowUpRight, 
  RefreshCw, Scissors, ChevronRight
} from 'lucide-react';

export default function AdminDashboardView() {
  const [reassignSuccess, setReassignSuccess] = useState(false);

  const handleReassign = () => {
    setReassignSuccess(true);
    setTimeout(() => setReassignSuccess(false), 3500);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header del Tablero */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-mono text-pf-terracota uppercase tracking-widest font-semibold">
            SUPERFICIE 3: PANEL WEB DE ADMINISTRACIÓN & CAJA
          </span>
          <h2 className="text-2xl font-display font-bold text-pf-bone">
            Tablero en Vivo de Punto Fino (Cali)
          </h2>
          <p className="text-xs text-pf-muted">
            Monitoreo en tiempo real del equipo de barberos, ocupación de sillas, arqueo de caja y estado del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="pf-badge-available">
            <span className="pf-dot-live" /> 3 Sillas Activas
          </span>
          <button 
            onClick={() => alert('Caja abierta a las 09:00 AM con base de $ 100.000 COP en efectivo.')}
            className="pf-btn-secondary text-xs"
          >
            Ver Arqueo de Caja
          </button>
        </div>
      </div>

      {reassignSuccess && (
        <div className="p-3.5 rounded-lg bg-pf-available/10 border border-pf-available/40 text-pf-available text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cita de las 04:30 PM reasignada a Carlos Valencia. Se enviaron correos automáticos al cliente y a ambos barberos.</span>
          </div>
          <span className="font-mono text-[10px] text-white">REASIGNACIÓN CONFIRMADA</span>
        </div>
      )}

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pf-card p-5 bg-pf-surface/80 space-y-2 border-l-4 border-l-pf-terracota">
          <div className="flex items-center justify-between text-xs text-pf-muted font-mono">
            <span>INGRESOS DEL DÍA</span>
            <DollarSign className="w-4 h-4 text-pf-terracota" />
          </div>
          <div className="text-2xl font-mono font-bold text-pf-bone">$ 580.000 COP</div>
          <div className="text-[11px] text-pf-available flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> +18% vs. lunes anterior
          </div>
        </div>

        <div className="pf-card p-5 bg-pf-surface/80 space-y-2 border-l-4 border-l-pf-available">
          <div className="flex items-center justify-between text-xs text-pf-muted font-mono">
            <span>OCUPACIÓN TOTAL</span>
            <Users className="w-4 h-4 text-pf-available" />
          </div>
          <div className="text-2xl font-mono font-bold text-pf-bone">84%</div>
          <div className="text-[11px] text-pf-muted font-mono">
            21 de 25 franjas tomadas
          </div>
        </div>

        <div className="pf-card p-5 bg-pf-surface/80 space-y-2 border-l-4 border-l-pf-brass">
          <div className="flex items-center justify-between text-xs text-pf-muted font-mono">
            <span>CITAS DE HOY</span>
            <Calendar className="w-4 h-4 text-pf-brass" />
          </div>
          <div className="text-2xl font-mono font-bold text-pf-bone">18 Citas</div>
          <div className="text-[11px] text-pf-muted font-mono">
            14 Web · 4 Walk-ins
          </div>
        </div>

        <div className="pf-card p-5 bg-pf-surface/80 space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-xs text-pf-muted font-mono">
            <span>CORREOS RESEND</span>
            <Mail className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-pf-bone">100% Entregados</div>
          <div className="text-[11px] text-pf-muted font-mono">
            0 rebotes · DKIM verificado
          </div>
        </div>
      </div>

      {/* Discriminación de Pagos & Estado de las Sillas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Desglose de Caja por Método de Pago */}
        <div className="pf-card p-6 space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-display font-bold text-sm text-pf-bone">Caja Discriminada por Método</h3>
            <span className="text-[10px] font-mono text-pf-muted">HOY</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Efectivo en Caja', amount: 210000, pct: 36, color: 'bg-pf-available' },
              { label: 'Nequi / Daviplata', amount: 245000, pct: 42, color: 'bg-pf-terracota' },
              { label: 'Datáfono (Tarjetas)', amount: 125000, pct: 22, color: 'bg-pf-brass' },
            ].map((p) => (
              <div key={p.label} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-pf-bone">{p.label}</span>
                  <span className="font-bold text-pf-bone">$ {p.amount.toLocaleString('es-CO')}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-pf-elevated overflow-hidden">
                  <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-pf-carbon rounded border border-white/5 text-[11px] text-pf-muted space-y-1">
            <div className="font-bold text-pf-bone">Liquidación estimada del equipo:</div>
            <div className="flex justify-between">
              <span>Comisiones Barberos (50%):</span>
              <span className="font-mono text-pf-terracota font-bold">$ 290.000 COP</span>
            </div>
            <div className="flex justify-between text-pf-subtle text-[10px]">
              <span>[NOTA: REVISAR CON CONTADOR]</span>
            </div>
          </div>
        </div>

        {/* Estado en Vivo de las Sillas de Barberos */}
        <div className="pf-card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-display font-bold text-sm text-pf-bone">Estado de Sillas & Equipo en Vivo</h3>
            <span className="text-[10px] font-mono text-pf-available flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pf-available animate-pulse" /> TIEMPO REAL
            </span>
          </div>

          <div className="space-y-3">
            {/* Barbero 1 */}
            <div className="p-4 rounded-lg bg-pf-elevated border border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-pf-carbon border border-pf-terracota shrink-0">
                  <img src="/images/punto-fino/ritual-vapor-ozono.png" alt="Brayan" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm font-display font-bold text-pf-bone">Brayan Murillo ("El Fino")</div>
                  <div className="text-xs text-pf-muted">Atendiendo a: <strong className="text-white">Andrés Caicedo</strong> (Corte + Barba)</div>
                  <div className="text-[10px] font-mono text-pf-terracota">⏱ Restan 14 min para liberar silla</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pf-busy/20 text-pf-busy border border-pf-busy/40">
                  EN SILLA
                </span>
                <div className="text-[11px] font-mono text-pf-muted mt-1">6 citas hoy ($165k com.)</div>
              </div>
            </div>

            {/* Barbero 2 */}
            <div className="p-4 rounded-lg bg-pf-elevated border border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-pf-carbon border border-pf-available shrink-0">
                  <img src="/images/punto-fino/vapor-facial-cali.png" alt="Carlos" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm font-display font-bold text-pf-bone">Carlos Valencia ("El Primo")</div>
                  <div className="text-xs text-pf-available font-semibold">Silla Libre · Próxima cita a las 04:15 PM</div>
                  <div className="text-[10px] font-mono text-pf-muted">Disponible para recibir cliente sin cita</div>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <button 
                  onClick={handleReassign}
                  className="pf-btn-outline py-1.5 px-3 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reasignar Cita
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pf-available/20 text-pf-available border border-pf-available/40">
                  LIBRE
                </span>
              </div>
            </div>

            {/* Barbero 3 */}
            <div className="p-4 rounded-lg bg-pf-elevated border border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-pf-carbon border border-pf-brass shrink-0">
                  <img src="/images/punto-fino/masaje-percutivo-relax.png" alt="Andrés" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm font-display font-bold text-pf-bone">Andrés Mosquera ("Junior")</div>
                  <div className="text-xs text-pf-muted">Atendiendo a: <strong className="text-white">Mateo Holguín</strong> (Corte Clásico)</div>
                  <div className="text-[10px] font-mono text-pf-terracota">⏱ Restan 28 min para liberar silla</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pf-busy/20 text-pf-busy border border-pf-busy/40">
                  EN SILLA
                </span>
                <div className="text-[11px] font-mono text-pf-muted mt-1">5 citas hoy ($125k com.)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Operativas de Inventario & Auditoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="pf-card p-5 bg-pf-surface/60 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
            <AlertTriangle className="w-4 h-4" /> ALERTA DE INSUMOS CRÍTICOS
          </div>
          <div className="text-xs text-pf-muted space-y-1">
            <div>• Cuchillas Derby Premium: <strong>12 unidades</strong> (Stock mínimo: 20).</div>
            <div>• Toallas de vapor esterilizadas: <strong>18 disponibles</strong> (Suficiente para el turno).</div>
          </div>
        </div>

        <div className="pf-card p-5 bg-pf-surface/60 space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 font-mono">
            <Mail className="w-4 h-4" /> REGISTRO DE CORREOS TRANSACCIONALES
          </div>
          <div className="text-xs text-pf-muted space-y-1">
            <div>• Último correo enviado: <strong>PF-8492 a mateo.holguin@gmail.com</strong> (Entregado en 1.2s).</div>
            <div>• Webhooks activos de apertura y rebote en Resend.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
