import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  Search,
  CreditCard,
  Check,
  Edit2,
  Percent,
  Mail,
  Receipt,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import PageTransition from '../../components/ui/PageTransition';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import { exportToPdf } from '../../utils/exportUtils';
import { formatTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const PERIOD_OPTIONS = [
  { id: 'current_biweek', label: 'Quincena en Curso (Corte Oficial)' },
  { id: 'first_biweek', label: '1ª Quincena (1 al 15 · Pago el 15)' },
  { id: 'second_biweek', label: '2ª Quincena (16 al Fin de Mes)' },
  { id: 'month', label: 'Este Mes' },
  { id: 'last_month', label: 'Mes Pasado' },
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'all', label: 'Todo el Historial' },
  { id: 'custom', label: 'Rango Personalizado' },
];

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(val || 0);
};

export default function AdminDashboard({ initialTab = 'stats' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'stats' | 'payroll' | 'services' | 'schedules'
  const [period, setPeriod] = useState('current_biweek');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [barberFilter, setBarberFilter] = useState('all');

  // Servicios / Citas Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('todos');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Data from backend
  const [data, setData] = useState({
    summary: {},
    barbersPayroll: [],
    payrollCalendar: null,
    servicesBreakdown: [],
    paymentMethods: {},
    appointments: [],
  });

  // Schedules & Exceptions & Cash Register state
  const [schedules, setSchedules] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [cashOverview, setCashOverview] = useState(null);
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    date: '',
    isClosed: true,
    openTime: '09:00',
    closeTime: '16:00',
    reason: ''
  });
  const [cashForm, setCashForm] = useState({
    openingBalance: 100000,
    actualCash: 0,
    expenses: 0,
    notes: ''
  });

  // Modal State for Barber Payout
  const [payoutModal, setPayoutModal] = useState({
    isOpen: false,
    barber: null,
    pendingAppointments: [],
    totalPayout: 0,
  });
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Modal State for Editing Commission Rate
  const [commissionModal, setCommissionModal] = useState({
    isOpen: false,
    barber: null,
    newRate: 60,
  });
  const [submittingCommission, setSubmittingCommission] = useState(false);

  // Modal State for Barber Base Salary & Product Commission (Aprobado por Contador)
  const [salaryModal, setSalaryModal] = useState({
    isOpen: false,
    barber: null,
    monthlySalary: 2000000,
    commissionRate: 10,
    productCommissionRate: 15,
  });
  const [submittingSalary, setSubmittingSalary] = useState(false);

  // Fetch data
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {
        period,
        barberId: barberFilter !== 'all' ? barberFilter : undefined,
      };

      if (period === 'custom') {
        if (!customStartDate || !customEndDate) {
          if (isManualRefresh) toast.error('Ingresa ambas fechas para el rango personalizado');
          setLoading(false);
          setRefreshing(false);
          return;
        }
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const [payrollRes, schedulesRes, overviewRes] = await Promise.all([
        adminService.getPayrollStats(params),
        adminService.getSchedules().catch(() => ({ schedules: [], exceptions: [] })),
        adminService.getOverview().catch(() => null),
      ]);

      const payload = payrollRes?.data || payrollRes || {};
      setData({
        summary: payload.summary || payload.totals || {},
        barbersPayroll: Array.isArray(payload.barbersPayroll) ? payload.barbersPayroll : [],
        payrollCalendar: payload.payrollCalendar || null,
        servicesBreakdown: Array.isArray(payload.servicesBreakdown) ? payload.servicesBreakdown : [],
        paymentMethods: payload.paymentMethods || {},
        appointments: Array.isArray(payload.appointments) ? payload.appointments : [],
      });

      const schedPayload = schedulesRes?.data || schedulesRes;
      if (schedPayload?.schedules) setSchedules(schedPayload.schedules);
      if (schedPayload?.exceptions) setExceptions(schedPayload.exceptions);
      if (overviewRes) setCashOverview(overviewRes?.data || overviewRes);

      if (isManualRefresh) {
        toast.success('Datos de administración actualizados');
      }
    } catch (error) {
      console.error('Error al cargar datos de nómina:', error);
      toast.error('Error al cargar los datos de administración');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customStartDate && customEndDate)) {
      fetchData();
    }
  }, [period, customStartDate, customEndDate, barberFilter]);

  // Filtrado de la tabla de servicios
  const filteredAppointments = useMemo(() => {
    return (data.appointments || []).filter((apt) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesClient = apt.client?.name?.toLowerCase().includes(term);
        const matchesEmail = apt.client?.email?.toLowerCase().includes(term);
        const matchesBarber = apt.barber?.name?.toLowerCase().includes(term);
        const matchesCode = apt.confirmationCode?.toLowerCase().includes(term);
        const matchesService = (apt.services || []).some((s) => s.name?.toLowerCase().includes(term));
        if (!matchesClient && !matchesEmail && !matchesBarber && !matchesCode && !matchesService) {
          return false;
        }
      }

      if (statusFilter !== 'todos' && apt.status !== statusFilter) {
        return false;
      }

      if (commissionStatusFilter === 'pagada' && !apt.commissionPaid) {
        return false;
      }
      if (commissionStatusFilter === 'pendiente' && apt.commissionPaid) {
        return false;
      }

      return true;
    });
  }, [data.appointments, searchTerm, statusFilter, commissionStatusFilter]);

  const handleToggleAppointmentPayout = async (apt) => {
    try {
      const nextStatus = !apt.commissionPaid;
      await adminService.payoutAppointments({
        appointmentIds: [apt._id],
        markPaid: nextStatus,
      });

      toast.success(
        nextStatus
          ? 'Comisión marcada como liquidada/pagada'
          : 'Comisión reabierta como pendiente'
      );

      setData((prev) => ({
        ...prev,
        appointments: prev.appointments.map((a) =>
          a._id === apt._id
            ? { ...a, commissionPaid: nextStatus, commissionPaidAt: nextStatus ? new Date() : null }
            : a
        ),
      }));

      fetchData(false);
    } catch (error) {
      toast.error('Error al actualizar el estado de liquidación');
    }
  };

  const handleOpenPayoutModal = (barber) => {
    const pendingApts = (data.appointments || []).filter(
      (a) =>
        (a.barber?._id === barber.barberId || a.barber?._id === barber.userId) &&
        a.status === 'completada' &&
        !a.commissionPaid
    );

    const totalToPay = pendingApts.reduce((sum, a) => sum + (a.barberCut || 0), 0);

    setPayoutModal({
      isOpen: true,
      barber,
      pendingAppointments: pendingApts,
      totalPayout: totalToPay,
    });
  };

  // Confirmar liquidación total del barbero con snapshot inmutable (Section 5.1)
  const handleConfirmBarberPayout = async () => {
    if (!payoutModal.pendingAppointments.length) {
      toast.error('No hay citas pendientes de liquidar para este barbero.');
      setPayoutModal({ isOpen: false, barber: null, pendingAppointments: [], totalPayout: 0 });
      return;
    }

    setSubmittingPayout(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      await adminService.approveSettlement({
        barberId: payoutModal.barber.barberId,
        periodStart: customStartDate || '2026-01-01',
        periodEnd: customEndDate || todayStr,
        notes: `Liquidación aprobada (${payoutModal.pendingAppointments.length} servicios)`,
      });

      toast.success(`Liquidación inmutable de ${payoutModal.barber.name} aprobada y guardada`);
      setPayoutModal({ isOpen: false, barber: null, pendingAppointments: [], totalPayout: 0 });
      fetchData(false);
    } catch (error) {
      toast.error('Error al liquidar nómina del barbero');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const handleSaveCommissionRate = async () => {
    const rate = Number(commissionModal.newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('La comisión debe ser un número entre 0 y 100');
      return;
    }

    setSubmittingCommission(true);
    try {
      await adminService.updateBarberCommission(commissionModal.barber.barberId, rate);
      toast.success(`Comisión de ${commissionModal.barber.name} actualizada al ${rate}%`);
      setCommissionModal({ isOpen: false, barber: null, newRate: 60 });
      fetchData(false);
    } catch (error) {
      toast.error('Error al actualizar porcentaje de comisión');
    } finally {
      setSubmittingCommission(false);
    }
  };

  const handleSaveSalary = async () => {
    const salary = Number(salaryModal.monthlySalary);
    if (isNaN(salary) || salary < 0) {
      toast.error('Ingresa un salario mensual válido en COP');
      return;
    }
    const commRate = Number(salaryModal.commissionRate);
    if (isNaN(commRate) || commRate < 0 || commRate > 100) {
      toast.error('La comisión por servicios debe estar entre 0 y 100%');
      return;
    }
    const prodRate = Number(salaryModal.productCommissionRate);
    if (isNaN(prodRate) || prodRate < 0 || prodRate > 100) {
      toast.error('El porcentaje de productos debe estar entre 0 y 100%');
      return;
    }

    setSubmittingSalary(true);
    try {
      await adminService.updateBarberSalary(
        salaryModal.barber.barberId,
        salary,
        prodRate,
        commRate
      );
      toast.success(`Salario base y comisiones de ${salaryModal.barber.name} actualizados exitosamente`);
      setSalaryModal({ isOpen: false, barber: null, monthlySalary: 2000000, commissionRate: 10, productCommissionRate: 15 });
      fetchData(false);
    } catch (error) {
      toast.error('Error al actualizar salario base y comisiones');
    } finally {
      setSubmittingSalary(false);
    }
  };

  const handleSaveSchedules = async () => {
    setSavingSchedules(true);
    try {
      await adminService.updateSchedules(schedules);
      toast.success('Horarios oficiales de Punto Fino actualizados');
      fetchData(false);
    } catch {
      toast.error('Error al guardar horarios');
    } finally {
      setSavingSchedules(false);
    }
  };

  const handleCreateException = async (e) => {
    e.preventDefault();
    if (!exceptionForm.date) {
      toast.error('Selecciona una fecha');
      return;
    }
    try {
      await adminService.createScheduleException(exceptionForm);
      toast.success('Excepción / festivo registrado');
      setExceptionForm({ date: '', isClosed: true, openTime: '09:00', closeTime: '16:00', reason: '' });
      fetchData(false);
    } catch {
      toast.error('Error al guardar excepción');
    }
  };

  const handleDeleteException = async (id) => {
    try {
      await adminService.deleteScheduleException(id);
      toast.success('Excepción eliminada');
      fetchData(false);
    } catch {
      toast.error('Error al eliminar excepción');
    }
  };

  const handleOpenCash = async () => {
    try {
      await adminService.openCashRegister({
        openingBalance: Number(cashForm.openingBalance),
        notes: cashForm.notes
      });
      toast.success('Caja diaria abierta');
      fetchData(false);
    } catch {
      toast.error('Error al abrir caja');
    }
  };

  const handleCloseCash = async () => {
    try {
      await adminService.closeCashRegister({
        actualCash: Number(cashForm.actualCash),
        expenses: Number(cashForm.expenses),
        notes: cashForm.notes
      });
      toast.success('Cierre y cuadre de caja registrado');
      fetchData(false);
    } catch {
      toast.error('Error al cerrar caja');
    }
  };

  // ==========================================
  // EXPORTAR A PDF (.pdf)
  // ==========================================
  const handleExportPdf = () => {
    setExportingPdf(true);
    try {
      const rangeText = data.summary.rangeLabel || period;

      const payrollColumns = [
        'BARBERO',
        'CORREO',
        '% COMISIÓN',
        'CORTES',
        'TOTAL FACTURADO',
        'NÓMINA TOTAL',
        'PAGADO',
        'PENDIENTE',
      ];

      const payrollRows = (data.barbersPayroll || []).map((b) => [
        b.name,
        b.email || 'N/A',
        `${b.commissionRate}%`,
        String(b.totalCuts),
        formatCurrency(b.grossRevenue),
        formatCurrency(b.commissionAmount),
        formatCurrency(b.paidCommission),
        formatCurrency(b.pendingCommission),
      ]);

      const serviceColumns = [
        'CÓDIGO',
        'FECHA / HORA',
        'BARBERO',
        'CLIENTE',
        'SERVICIO',
        'MÉTODO',
        'TOTAL',
        'NÓMINA',
        'ESTADO PAGO',
      ];

      const serviceRows = (data.appointments || []).slice(0, 50).map((a) => [
        a.confirmationCode,
        `${new Date(a.date).toLocaleDateString('es-CO')} ${formatTime(a.startTime)}`,
        a.barber?.name || 'N/A',
        a.client?.name || 'Cliente',
        (a.services || []).map((s) => s.name).join(' + '),
        (a.paymentMethod || 'Efectivo').toUpperCase(),
        formatCurrency(a.totalPrice),
        formatCurrency(a.barberCut),
        a.commissionPaid ? 'PAGADO' : 'PENDIENTE',
      ]);

      exportToPdf({
        title: 'REPORTE EJECUTIVO DE NÓMINA Y SERVICIOS',
        subtitle: 'Punto Fino · Control de Pagos y Liquidaciones',
        periodLabel: rangeText,
        summary: data.summary,
        tables: [
          {
            title: 'Liquidación de Nómina por Trabajador',
            columns: payrollColumns,
            rows: payrollRows,
          },
          {
            title: 'Detalle de Servicios Prestados Recientemente',
            columns: serviceColumns,
            rows: serviceRows,
          },
        ],
        fileName: `Reporte_Nomina_Punto_Fino_${new Date().toISOString().slice(0, 10)}`,
      });

      toast.success('Reporte PDF oficial generado exitosamente');
    } catch (error) {
      toast.error('Error al generar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportSingleBarberPdf = (b) => {
    try {
      const barberApts = (data.appointments || []).filter(
        (a) => a.barber?._id === b.barberId || a.barber?._id === b.userId
      );

      const columns = ['CÓDIGO', 'FECHA', 'HORA', 'CLIENTE', 'SERVICIO', 'TOTAL SERVICIO', 'COMISIÓN GANADA', 'ESTADO'];
      const rows = barberApts.map((a) => [
        a.confirmationCode,
        new Date(a.date).toLocaleDateString('es-CO'),
        formatTime(a.startTime),
        a.client?.name || 'Cliente',
        (a.services || []).map((s) => s.name).join(', '),
        formatCurrency(a.totalPrice),
        formatCurrency(a.barberCut),
        a.commissionPaid ? 'LIQUIDADO' : 'PENDIENTE',
      ]);

      const biweeklyBase = b.biweeklyBaseCOP || b.baseSalaryCOP || 1000000;
      const netPayable = b.netPayableCOP || (biweeklyBase + (b.commissionAmount || 0));

      exportToPdf({
        title: `COMPROBANTE DE NÓMINA · ${b.name.toUpperCase()}`,
        subtitle: `Estructura Aprobada por Contador · Base Quincenal: ${formatCurrency(biweeklyBase)} | Comisión Cortes: ${b.commissionRate}% | Comisión Productos Rolda: ${b.productCommissionRate || 15}%`,
        periodLabel: data.summary.rangeLabel || period,
        summary: {
          grossRevenue: b.grossRevenue,
          baseSalary: biweeklyBase,
          serviceCommission: b.serviceCommissionCOP || b.commissionAmount,
          productCommission: b.productCommissionCOP || 0,
          totalBarbersPayout: netPayable,
          netBarbershopEarnings: b.barbershopShare,
          totalPaidPayout: b.paidCommission,
          totalPendingPayout: b.pendingCommission,
          completedCuts: b.totalCuts,
        },
        tables: [
          {
            title: `Detalle de Servicios Realizados por ${b.name}`,
            columns,
            rows,
          },
        ],
        fileName: `Desprendible_${b.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      });

      toast.success(`Desprendible de ${b.name} descargado en PDF`);
    } catch (error) {
      toast.error('Error al exportar desprendible');
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#2b292d]">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#71d083]"></span>
              <span className="text-[11px] font-sans font-semibold text-[#71d083]">
                Administración y Contabilidad · Punto Fino
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-semibold tracking-[-0.025em] text-[#e5e5e5]">
              Nómina, Horarios y <span className="text-[#71d083]">Estadísticas</span>
            </h1>
            <p className="text-[#7c7a85] text-xs sm:text-sm font-sans mt-1">
              Control de caja diaria, liquidación inmutable de barberos, horarios oficiales 7 días y balance de servicios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="btn-depot-outline !py-2.5 !px-3.5"
              title="Refrescar datos"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#71d083]' : ''} />
              <span className="hidden sm:inline font-sans text-xs">Actualizar</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={exportingPdf || loading}
              className="btn-depot-primary"
            >
              <FileText size={14} />
              <span>Descargar Reporte PDF</span>
            </button>
          </div>
        </div>

        {/* SELECTOR DE PERÍODOS Y FILTROS RÁPIDOS */}
        <div className="bg-[#121113] border border-[#2b292d] p-4 rounded-[6px] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-sans text-[#7c7a85] mr-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#71d083]" /> Período:
              </span>
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id)}
                  className={`px-3 py-1.5 text-xs font-sans rounded-[6px] border transition-all cursor-pointer ${
                    period === opt.id
                      ? 'bg-[#1a191b] text-[#71d083] border-[#2d5736] font-medium'
                      : 'bg-[#1a191b]/40 text-[#7c7a85] border-[#2b292d] hover:border-[#3c393f] hover:text-[#eeeef0]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-sans text-[#7c7a85]">
                Barbero:
              </span>
              <select
                value={barberFilter}
                onChange={(e) => setBarberFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-[#1a191b] border border-[#2b292d] text-[#eeeef0] rounded-[6px] font-sans focus:outline-none focus:border-[#71d083]/70"
              >
                <option value="all">Todos los Barberos</option>
                {data.barbersPayroll.map((b) => (
                  <option key={b.barberId} value={b.barberId}>
                    {b.name} ({b.commissionRate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {period === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-3 border-t border-[#2b292d] flex flex-wrap items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#7c7a85]">Desde:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-[#1a191b] border border-[#2b292d] text-[#eeeef0] py-1 px-2.5 text-xs rounded-[6px] tabular-nums"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#7c7a85]">Hasta:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-[#1a191b] border border-[#2b292d] text-[#eeeef0] py-1 px-2.5 text-xs rounded-[6px] tabular-nums"
                />
              </div>
              <button
                onClick={() => fetchData(false)}
                className="btn-depot-primary !py-1.5 !px-4"
              >
                Aplicar Rango
              </button>
            </motion.div>
          )}
        </div>

        {/* TABS DE NAVEGACIÓN */}
        <div className="flex border-b border-[#2b292d] gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-5 font-sans font-medium text-xs transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'stats'
                ? 'text-[#71d083] border-[#71d083] -mb-[1px] bg-[#1a191b] rounded-t-[6px]'
                : 'text-[#7c7a85] border-transparent hover:text-[#eeeef0]'
            }`}
          >
            <TrendingUp size={14} />
            <span>Estadísticas y Balance</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`py-3 px-5 font-sans font-medium text-xs transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'payroll'
                ? 'text-[#71d083] border-[#71d083] -mb-[1px] bg-[#1a191b] rounded-t-[6px]'
                : 'text-[#7c7a85] border-transparent hover:text-[#eeeef0]'
            }`}
          >
            <DollarSign size={15} />
            <span>Nómina y Liquidaciones</span>
            {data.summary.totalPendingPayout > 0 && (
              <span className="ml-1.5 tag-depot-danger">
                Por liquidar
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-3 px-5 font-sans font-medium text-xs transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'schedules'
                ? 'text-[#71d083] border-[#71d083] -mb-[1px] bg-[#1a191b] rounded-t-[6px]'
                : 'text-[#7c7a85] border-transparent hover:text-[#eeeef0]'
            }`}
          >
            <Clock size={14} />
            <span>Horarios Oficiales y Caja</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-5 font-sans font-medium text-xs transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'services'
                ? 'text-[#71d083] border-[#71d083] -mb-[1px] bg-[#1a191b] rounded-t-[6px]'
                : 'text-[#7c7a85] border-transparent hover:text-[#eeeef0]'
            }`}
          >
            <Receipt size={14} />
            <span>Servicios Recolectados ({filteredAppointments.length})</span>
          </button>
        </div>

        {/* CONTENIDO DE CADA TAB */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#71d083] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#7c7a85] font-sans text-xs">
              Calculando nómina y consolidados contables...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* TAB 1: ESTADÍSTICAS Y BALANCE GENERAL */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-8"
              >
                {/* TARJETAS DE KPIS PRINCIPALES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#121113] border border-[#2b292d] hover:border-[#3c393f] rounded-[6px] p-5 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-9 h-9 bg-[#1a191b] border border-[#2b292d] text-[#71d083] rounded-[6px] flex items-center justify-center">
                        <DollarSign size={16} />
                      </div>
                      <span className="tag-depot-green">Total Facturado</span>
                    </div>
                    <p className="text-xs font-sans text-[#7c7a85] mb-1">Ingresos Brutos</p>
                    <p className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5] tracking-tight">
                      {formatCurrency(data.summary.grossRevenue)}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-[#2b292d] text-xs text-[#7c7a85] flex justify-between font-sans">
                      <span>Cortes Realizados:</span>
                      <span className="text-[#e5e5e5] tabular-nums font-semibold">{data.summary.completedCuts || 0}</span>
                    </div>
                  </div>

                  <div className="bg-[#121113] border border-[#2b292d] hover:border-[#3c393f] rounded-[6px] p-5 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-9 h-9 bg-[#1a191b] border border-[#2b292d] text-[#71d083] rounded-[6px] flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <span className="tag-depot-green">Comisiones</span>
                    </div>
                    <p className="text-xs font-sans text-[#7c7a85] mb-1">Nómina Trabajadores</p>
                    <p className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#71d083] tracking-tight">
                      {formatCurrency(data.summary.totalBarbersPayout)}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-[#2b292d] text-xs text-[#7c7a85] flex justify-between font-sans">
                      <span>Pendiente por pagar:</span>
                      <span className="text-rose-400 tabular-nums font-semibold">
                        {formatCurrency(data.summary.totalPendingPayout)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#121113] border border-[#2b292d] hover:border-[#3c393f] rounded-[6px] p-5 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-9 h-9 bg-[#1a191b] border border-[#2b292d] text-[#70b8ff] rounded-[6px] flex items-center justify-center">
                        <TrendingUp size={16} />
                      </div>
                      <span className="tag-depot-blue">Utilidad Neta</span>
                    </div>
                    <p className="text-xs font-sans text-[#7c7a85] mb-1">Ganancia Barbería</p>
                    <p className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5] tracking-tight">
                      {formatCurrency(data.summary.netBarbershopEarnings)}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-[#2b292d] text-xs text-[#7c7a85] flex justify-between font-sans">
                      <span>Ticket Promedio:</span>
                      <span className="text-[#e5e5e5] tabular-nums font-semibold">
                        {formatCurrency(data.summary.averageTicket)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#121113] border border-[#2b292d] hover:border-[#3c393f] rounded-[6px] p-5 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-9 h-9 bg-[#1a191b] border border-[#2b292d] text-[#baa7ff] rounded-[6px] flex items-center justify-center">
                        <ShieldCheck size={16} />
                      </div>
                      <span className="tag-depot-lilac">Equipo</span>
                    </div>
                    <p className="text-xs font-sans text-[#7c7a85] mb-1">Clientes Atendidos</p>
                    <p className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5] tracking-tight">
                      {data.summary.uniqueClients || 0}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-[#2b292d] text-xs text-[#7c7a85] flex justify-between font-sans">
                      <span>Barberos Activos:</span>
                      <span className="text-[#71d083] tabular-nums font-semibold">
                        {data.summary.activeBarbersCount || 3}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FILA DE DESGLOSES: MÉTODOS DE PAGO Y TOP SERVICIOS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-6">
                    <h3 className="font-sans font-semibold text-sm text-[#e5e5e5] mb-4 flex items-center gap-2 border-b border-[#2b292d] pb-3">
                      <CreditCard size={15} className="text-[#71d083]" />
                      Recaudación por Método de Pago
                    </h3>

                    <div className="space-y-4">
                      {Object.entries(data.paymentMethods || {}).map(([key, item]) => {
                        const totalGross = data.summary.grossRevenue || 1;
                        const percentage = Math.round(((item.total || 0) / totalGross) * 100);

                        return (
                          <div key={key} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="uppercase font-sans text-[#b5b2bc]">
                                {key} ({item.count} pagos)
                              </span>
                              <div className="text-right tabular-nums">
                                <span className="font-semibold text-[#e5e5e5] mr-2">
                                  {formatCurrency(item.total)}
                                </span>
                                <span className="text-[11px] text-[#7c7a85]">({percentage}%)</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-[#1a191b] rounded-[2px] overflow-hidden border border-[#2b292d]">
                              <div
                                className="h-full bg-[#71d083] transition-all duration-500 rounded-[2px]"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-6">
                    <h3 className="font-sans font-semibold text-sm text-[#e5e5e5] mb-4 flex items-center gap-2 border-b border-[#2b292d] pb-3">
                      <Sparkles size={15} className="text-[#71d083]" />
                      Servicios Más Solicitados
                    </h3>

                    {data.servicesBreakdown.length === 0 ? (
                      <p className="text-xs text-[#7c7a85] py-8 text-center font-sans">
                        No hay servicios completados en este período.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#2b292d]/60 space-y-2">
                        {data.servicesBreakdown.slice(0, 5).map((srv, idx) => (
                          <div key={idx} className="pt-2.5 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-sans font-medium text-[#eeeef0]">{srv.name}</p>
                              <span className="text-[11px] text-[#7c7a85] tabular-nums">
                                Realizado {srv.count} veces
                              </span>
                            </div>
                            <span className="tabular-nums text-xs font-semibold text-[#71d083]">
                              {formatCurrency(srv.totalRevenue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: NÓMINA Y CONTROL DE PAGOS A TRABAJADORES */}
            {activeTab === 'payroll' && (
              <motion.div
                key="payroll"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                <div className="bg-[#1b2a1e] border border-[#2d5736] rounded-[6px] p-4 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#2d5736]/40 text-[#71d083] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#71d083] tracking-wide uppercase font-sans">
                          Estructura Salarial y Calendario Oficial de Pagos
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#2d5736]/60 text-[#71d083] font-mono uppercase font-semibold">
                          Base: $2.000.000 COP · Quincenal
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#121113] border border-[#2d5736] text-xs text-[#71d083] font-sans font-medium">
                        <Calendar size={13} />
                        <span>Pago: <strong>Día 15</strong> y <strong>Último día de cada mes</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-[#b5b2bc] leading-relaxed font-sans">
                      Salario base mensual de <strong className="text-[#eeeef0]">$2.000.000 COP</strong> con desembolso quincenal estricto de <strong className="text-[#71d083]">$1.000.000 COP</strong>: 1ª Quincena del 1 al 15 (se paga el <strong className="text-[#eeeef0]">día 15</strong>) y 2ª Quincena del 16 al fin de mes (se paga el <strong className="text-[#eeeef0]">último día del mes</strong>). Adicionalmente, cada barbero devenga <strong className="text-[#eeeef0]">50% de comisión por cortes</strong> y <strong className="text-[#71d083]">15% de comisión por productos capilares Rolda</strong>. Como Administrador, puedes editar sueldos y comisiones en cualquier momento.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-sans font-semibold text-[#e5e5e5]">
                      Liquidación de Nómina del Equipo
                    </h3>
                    <p className="text-xs text-[#7c7a85] font-sans mt-0.5">
                      Sueldo base quincenal de $1.000.000 COP + comisiones por servicios y productos capilares Rolda.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#7c7a85] font-sans">
                      Total a liquidar: <strong className="text-rose-400 tabular-nums font-bold">{formatCurrency(data.summary.totalPendingPayout)}</strong>
                    </span>
                  </div>
                </div>

                {/* TARJETAS DE CADA BARBERO */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.barbersPayroll.map((barber) => {
                    const hasPending = barber.pendingCommission > 0;
                    const biweeklyBase = barber.biweeklyBaseCOP || barber.baseSalaryCOP || 1000000;
                    const monthlyBase = barber.monthlyBaseCOP || (biweeklyBase * 2);
                    const serviceCommission = barber.serviceCommissionCOP !== undefined ? barber.serviceCommissionCOP : (barber.commissionAmount || 0);
                    const productCommission = barber.productCommissionCOP || 0;
                    const hairProductsSales = barber.hairProductsSalesCOP || 0;
                    const netPayable = barber.netPayableCOP || (biweeklyBase + serviceCommission + productCommission);

                    return (
                      <div
                        key={barber.barberId}
                        className={`bg-[#121113] border rounded-[6px] p-6 flex flex-col justify-between transition-all duration-200 ${
                          hasPending ? 'border-[#2d5736] hover:border-[#71d083]/50' : 'border-[#2b292d] hover:border-[#3c393f]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-[#2b292d]">
                            <div>
                              <h4 className="font-sans font-semibold text-base text-[#e5e5e5] leading-tight">
                                {barber.name}
                              </h4>
                              <p className="text-xs text-[#7c7a85] mt-0.5 flex items-center gap-1">
                                <Mail size={11} /> {barber.email}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              {/* Botón para editar Sueldo Base y Productos */}
                              <button
                                onClick={() =>
                                  setSalaryModal({
                                    isOpen: true,
                                    barber,
                                    monthlySalary: monthlyBase,
                                    commissionRate: barber.commissionRate !== undefined ? barber.commissionRate : 10,
                                    productCommissionRate: barber.productCommissionRate !== undefined ? Math.round(barber.productCommissionRate * (barber.productCommissionRate <= 1 ? 100 : 1)) : 15,
                                  })
                                }
                                className="px-2 py-0.5 text-[11px] tabular-nums bg-[#1b2a1e] hover:bg-[#233827] text-[#71d083] border border-[#2d5736] rounded-[4px] transition-all cursor-pointer flex items-center gap-1 font-medium"
                                title="Editar Salario Base y Comisión de Productos"
                              >
                                <DollarSign size={10} />
                                <span>Base: {formatCurrency(biweeklyBase)}/15d</span>
                                <Edit2 size={9} className="opacity-60" />
                              </button>

                              {/* Botón para editar % Comisión de Cortes */}
                              <button
                                onClick={() =>
                                  setCommissionModal({
                                    isOpen: true,
                                    barber,
                                    newRate: barber.commissionRate,
                                  })
                                }
                                className="px-2 py-0.5 text-[11px] tabular-nums bg-[#1a191b] hover:bg-[#232225] text-[#b5b2bc] hover:text-[#eeeef0] border border-[#2b292d] rounded-[4px] transition-all cursor-pointer flex items-center gap-1"
                                title="Modificar % de comisión en cortes"
                              >
                                <Percent size={10} />
                                <span>{barber.commissionRate}% Cortes</span>
                                <Edit2 size={9} className="opacity-60" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2.5 text-xs font-sans mb-6">
                            {/* Salario Base Quincenal Legal */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[#b5b2bc] bg-[#1a191b]/70 px-2.5 py-1.5 rounded-[4px] border border-[#2b292d]/60">
                                <span className="text-[#71d083] font-medium flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Salario Base Quincenal (15d):
                                </span>
                                <span className="font-semibold text-[#eeeef0] tabular-nums">
                                  {formatCurrency(biweeklyBase)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-[#7c7a85] px-1 font-sans">
                                <span>Fechas de pago oficial:</span>
                                <span className="text-[#71d083] font-medium">Día 15 y Último día del mes</span>
                              </div>
                            </div>

                            {/* Comisión Cortes */}
                            <div className="flex justify-between text-[#b5b2bc] pt-1">
                              <span className="text-[#7c7a85]">Comisión Cortes ({barber.commissionRate}% · {barber.totalCuts} servicios):</span>
                              <span className="tabular-nums font-semibold text-[#e5e5e5]">
                                {formatCurrency(serviceCommission)}
                              </span>
                            </div>

                            {/* Comisión Productos Capilares Rolda */}
                            <div className="flex justify-between text-[#b5b2bc]">
                              <span className="text-[#7c7a85]">
                                Comisión Productos Rolda ({barber.productCommissionRate || 15}%):
                              </span>
                              <span className="tabular-nums font-semibold text-[#71d083]">
                                {formatCurrency(productCommission)}
                              </span>
                            </div>
                            {hairProductsSales > 0 && (
                              <div className="text-[10px] text-[#7c7a85] text-right -mt-1 tabular-nums">
                                (Ventas en productos capilares: {formatCurrency(hairProductsSales)})
                              </div>
                            )}

                            {/* Total facturado en citas */}
                            <div className="flex justify-between text-[#7c7a85] pt-0.5">
                              <span>Total Servicios Facturados:</span>
                              <span className="tabular-nums text-[#b5b2bc]">
                                {formatCurrency(barber.grossRevenue)}
                              </span>
                            </div>

                            {/* Total Nómina Quincenal */}
                            <div className="pt-2.5 border-t border-[#2b292d] flex justify-between items-baseline">
                              <div>
                                <span className="font-sans text-xs font-semibold text-[#eeeef0] block">
                                  Total Nómina Quincenal:
                                </span>
                                <span className="text-[10px] text-[#7c7a85]">
                                  Sueldo base (15d) + Comisiones
                                </span>
                              </div>
                              <span className="tabular-nums text-lg font-bold text-[#71d083]">
                                {formatCurrency(netPayable)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-[11px] pt-1 tabular-nums">
                              <span className="text-[#71d083] flex items-center gap-1">
                                <CheckCircle2 size={12} /> Liquidado: {formatCurrency(barber.paidCommission)}
                              </span>
                              <span className="text-rose-400 flex items-center gap-1 font-semibold">
                                <Clock size={12} /> Pendiente: {formatCurrency(barber.pendingCommission)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-[#2b292d]">
                          {hasPending ? (
                            <button
                              onClick={() => handleOpenPayoutModal(barber)}
                              className="w-full btn-depot-primary !text-xs !py-2.5"
                            >
                              <DollarSign size={13} />
                              <span>Aprobar y Liquidar ({formatCurrency(barber.pendingCommission)})</span>
                            </button>
                          ) : (
                            <div className="w-full py-2 px-3 bg-[#1b2a1e] border border-[#2d5736] text-[#71d083] text-xs text-center rounded-[6px] flex items-center justify-center gap-1.5">
                              <CheckCircle2 size={13} />
                              <span>Al día · Sin saldos pendientes</span>
                            </div>
                          )}

                          <button
                            onClick={() => handleExportSingleBarberPdf(barber)}
                            className="w-full btn-depot-outline !text-xs !py-2"
                          >
                            <FileText size={13} />
                            <span>Descargar Desprendible PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB 3: HORARIOS OFICIALES 7 DÍAS, FESTIVOS Y CAJA */}
            {activeTab === 'schedules' && (
              <motion.div
                key="schedules"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Horarios Oficiales 7 Días */}
                <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#2b292d] pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[#eeeef0]">Horarios Oficiales (7 días)</h3>
                      <p className="text-xs text-[#7c7a85]">Lunes abre a las 08:00; Martes a Sábado 09:00-20:30; Domingo 09:00-16:00.</p>
                    </div>
                    <button
                      onClick={handleSaveSchedules}
                      disabled={savingSchedules}
                      className="btn-depot-primary !py-2 !px-4 text-xs"
                    >
                      {savingSchedules ? 'Guardando...' : 'Guardar Horarios'}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {schedules.map((sch, index) => (
                      <div key={sch.dayOfWeek} className="flex items-center justify-between gap-3 bg-[#1a191b] border border-[#2b292d] rounded-[6px] p-3 text-xs">
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <input
                            type="checkbox"
                            checked={sch.isOpen}
                            onChange={(e) => {
                              const next = [...schedules];
                              next[index] = { ...sch, isOpen: e.target.checked };
                              setSchedules(next);
                            }}
                          />
                          <span className="font-semibold text-[#eeeef0]">{sch.dayName}</span>
                        </div>
                        {sch.isOpen ? (
                          <div className="flex items-center gap-2 tabular-nums">
                            <input
                              type="time"
                              value={sch.openTime}
                              onChange={(e) => {
                                const next = [...schedules];
                                next[index] = { ...sch, openTime: e.target.value };
                                setSchedules(next);
                              }}
                              className="bg-[#121113] border border-[#2b292d] rounded px-2 py-1 text-xs text-[#eeeef0]"
                            />
                            <span className="text-[#7c7a85]">a</span>
                            <input
                              type="time"
                              value={sch.closeTime}
                              onChange={(e) => {
                                const next = [...schedules];
                                next[index] = { ...sch, closeTime: e.target.value };
                                setSchedules(next);
                              }}
                              className="bg-[#121113] border border-[#2b292d] rounded px-2 py-1 text-xs text-[#eeeef0]"
                            />
                          </div>
                        ) : (
                          <span className="text-rose-400 font-medium">Cerrado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Excepciones / Festivos y Control de Caja */}
                <div className="space-y-6">
                  <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-6 space-y-4">
                    <div className="border-b border-[#2b292d] pb-3">
                      <h3 className="text-sm font-semibold text-[#eeeef0]">Excepciones Puntuales y Festivos</h3>
                      <p className="text-xs text-[#C8A97E] mt-1">
                        Nota operativa: Los días festivos oficiales abren automáticamente en horario de domingo (9:00 a. m. a 4:00 p. m.). Puedes programar aquí cierres extraordinarios o modificaciones de horario sin tocar código.
                      </p>
                    </div>

                    <form onSubmit={handleCreateException} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[#7c7a85] mb-1">Fecha (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={exceptionForm.date}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, date: e.target.value })}
                          className="input-depot !py-1.5 text-xs tabular-nums"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[#7c7a85] mb-1">Motivo / Festivo</label>
                        <input
                          type="text"
                          value={exceptionForm.reason}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                          placeholder="Ej. Festivo Nacional / Evento"
                          className="input-depot !py-1.5 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <input
                          type="checkbox"
                          id="isClosedExc"
                          checked={exceptionForm.isClosed}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, isClosed: e.target.checked })}
                        />
                        <label htmlFor="isClosedExc" className="text-[#eeeef0]">Cerrar sede todo el día en esta fecha</label>
                      </div>
                      {!exceptionForm.isClosed && (
                        <div className="flex items-center gap-2 sm:col-span-2 tabular-nums">
                          <span>Horario especial:</span>
                          <input
                            type="time"
                            value={exceptionForm.openTime}
                            onChange={(e) => setExceptionForm({ ...exceptionForm, openTime: e.target.value })}
                            className="bg-[#1a191b] border border-[#2b292d] rounded px-2 py-1 text-xs text-[#eeeef0]"
                          />
                          <span>a</span>
                          <input
                            type="time"
                            value={exceptionForm.closeTime}
                            onChange={(e) => setExceptionForm({ ...exceptionForm, closeTime: e.target.value })}
                            className="bg-[#1a191b] border border-[#2b292d] rounded px-2 py-1 text-xs text-[#eeeef0]"
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <button type="submit" className="btn-depot-outline !py-2 !px-4 text-xs flex items-center gap-1.5">
                          <Plus size={13} /> Agregar Excepción / Festivo
                        </button>
                      </div>
                    </form>

                    {exceptions.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-[#2b292d]">
                        {exceptions.map((ex) => (
                          <div key={ex.id} className="flex items-center justify-between bg-[#1a191b] border border-[#2b292d] rounded p-2.5 text-xs">
                            <div>
                              <span className="font-semibold text-[#eeeef0] tabular-nums mr-2">{ex.date}</span>
                              <span className="text-[#7c7a85]">{ex.reason || 'Excepción'}</span>
                              <span className="ml-2 text-[#C8A97E] tabular-nums">
                                ({ex.isClosed ? 'Cerrado' : `${ex.openTime} - ${ex.closeTime}`})
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteException(ex.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Caja Diaria */}
                  <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#2b292d] pb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#eeeef0]">Apertura y Cierre de Caja Diaria</h3>
                        <p className="text-xs text-[#7c7a85]">Control de efectivo en sede, gastos del día y cuadre.</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        cashOverview?.cashRegister?.status === 'OPEN'
                          ? 'bg-[#1b2a1e] text-[#71d083] border border-[#2d5736]'
                          : 'bg-[#1a191b] text-[#7c7a85] border border-[#2b292d]'
                      }`}>
                        {cashOverview?.cashRegister?.status === 'OPEN' ? 'Caja Abierta' : 'Caja Cerrada'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[#7c7a85] mb-1">Base de apertura (COP)</label>
                        <input
                          type="number"
                          value={cashForm.openingBalance}
                          onChange={(e) => setCashForm({ ...cashForm, openingBalance: e.target.value })}
                          className="input-depot !py-1.5 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[#7c7a85] mb-1">Efectivo real al cierre</label>
                        <input
                          type="number"
                          value={cashForm.actualCash}
                          onChange={(e) => setCashForm({ ...cashForm, actualCash: e.target.value })}
                          className="input-depot !py-1.5 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[#7c7a85] mb-1">Gastos menores hoy</label>
                        <input
                          type="number"
                          value={cashForm.expenses}
                          onChange={(e) => setCashForm({ ...cashForm, expenses: e.target.value })}
                          className="input-depot !py-1.5 text-xs tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button type="button" onClick={handleOpenCash} className="btn-depot-primary !py-2 !px-4 text-xs">
                        Abrir Caja Hoy
                      </button>
                      <button type="button" onClick={handleCloseCash} className="btn-depot-outline !py-2 !px-4 text-xs">
                        Registrar Cierre de Caja
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: SERVICIOS Y CITAS RECOLECTADAS */}
            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="bg-[#121113] border border-[#2b292d] p-4 rounded-[6px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7a85]" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, correo, barbero, código o servicio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-[#1a191b] border border-[#2b292d] text-[#eeeef0] pl-9 pr-4 py-2 w-full text-xs rounded-[6px] font-sans focus:outline-none focus:border-[#71d083]/70 placeholder:text-[#7c7a85]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-sans text-[#7c7a85]">Estado:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="py-1.5 px-3 text-xs bg-[#1a191b] border border-[#2b292d] text-[#eeeef0] rounded-[6px] font-sans"
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="completada">Completada</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-sans text-[#7c7a85]">Nómina:</span>
                    <select
                      value={commissionStatusFilter}
                      onChange={(e) => setCommissionStatusFilter(e.target.value)}
                      className="py-1.5 px-3 text-xs bg-[#1a191b] border border-[#2b292d] text-[#eeeef0] rounded-[6px] font-sans"
                    >
                      <option value="todos">Todos los Pagos</option>
                      <option value="pendiente">Comisión Pendiente</option>
                      <option value="pagada">Comisión Liquidada</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[#1a191b] border-b border-[#2b292d] text-[#7c7a85] font-sans text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Código / Fecha</th>
                          <th className="py-3 px-4">Barbero</th>
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4">Servicio Prestado</th>
                          <th className="py-3 px-4">Pago / Método</th>
                          <th className="py-3 px-4 text-right">Total</th>
                          <th className="py-3 px-4 text-right">Nómina Barbero</th>
                          <th className="py-3 px-4 text-center">Estado Cita</th>
                          <th className="py-3 px-4 text-center">Liquidación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2b292d]/50">
                        {filteredAppointments.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-[#7c7a85] font-sans">
                              No se encontraron servicios con los filtros aplicados.
                            </td>
                          </tr>
                        ) : (
                          filteredAppointments.map((apt) => (
                            <tr key={apt._id} className="hover:bg-[#1a191b]/50 transition-colors">
                              <td className="py-3 px-4 tabular-nums">
                                <span className="font-semibold text-[#e5e5e5] block">
                                  {apt.confirmationCode}
                                </span>
                                <span className="text-[11px] text-[#7c7a85]">
                                  {new Date(apt.date).toLocaleDateString('es-CO')} · {formatTime(apt.startTime)}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-sans font-medium text-[#e5e5e5] block">
                                  {apt.barber?.name || 'Barbero'}
                                </span>
                                <span className="text-[11px] text-[#7c7a85] tabular-nums">
                                  Comisión: {apt.commissionRate}%
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-sans font-medium text-[#e5e5e5] block">
                                  {apt.client?.name || 'Cliente'}
                                </span>
                                <span className="text-[11px] text-[#7c7a85] block">
                                  {apt.client?.email || ''}
                                </span>
                              </td>

                              <td className="py-3 px-4 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {(apt.services || []).map((s, idx) => (
                                    <span key={idx} className="tag-depot-neutral !text-[10px]">
                                      {s.name}
                                    </span>
                                  ))}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 text-[10px] uppercase bg-[#1a191b] border border-[#2b292d] text-[#b5b2bc] rounded-[2px]">
                                  {apt.paymentMethod || 'Efectivo'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#e5e5e5] text-xs">
                                {formatCurrency(apt.totalPrice)}
                              </td>

                              <td className="py-3 px-4 text-right tabular-nums">
                                <span className="font-semibold text-[#71d083] block text-xs">
                                  {formatCurrency(apt.barberCut)}
                                </span>
                                <span className="text-[10px] text-[#7c7a85]">
                                  Negocio: {formatCurrency(apt.barbershopCut)}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span
                                  className={
                                    apt.status === 'completada'
                                      ? 'tag-depot-green'
                                      : apt.status === 'cancelada'
                                      ? 'tag-depot-danger'
                                      : 'tag-depot-neutral'
                                  }
                                >
                                  {apt.status}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                {apt.status === 'completada' ? (
                                  <button
                                    onClick={() => handleToggleAppointmentPayout(apt)}
                                    className={`px-2.5 py-1 rounded-[4px] text-[10px] font-medium transition-all flex items-center justify-center gap-1 mx-auto border cursor-pointer ${
                                      apt.commissionPaid
                                        ? 'bg-[#1b2a1e] text-[#71d083] border-[#2d5736]'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    }`}
                                  >
                                    {apt.commissionPaid ? (
                                      <>
                                        <CheckCircle2 size={11} />
                                        <span>Liquidado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={11} />
                                        <span>Pendiente</span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-[#7c7a85] text-[10px]">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* MODAL DE LIQUIDACIÓN DE NÓMINA A BARBERO */}
        <Modal
          isOpen={payoutModal.isOpen}
          onClose={() =>
            !submittingPayout &&
            setPayoutModal({ isOpen: false, barber: null, pendingAppointments: [], totalPayout: 0 })
          }
          title={`Liquidar Nómina · ${payoutModal.barber?.name || ''}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-[#b5b2bc] font-sans leading-relaxed">
              Vas a aprobar y congelar una liquidación inmutable para{' '}
              <strong className="text-[#e5e5e5]">{payoutModal.barber?.name}</strong> correspondiente a{' '}
              <strong className="text-[#71d083]">{payoutModal.pendingAppointments?.length} servicios completados</strong>.
            </p>

            <div className="bg-[#1a191b] border border-[#2b292d] p-5 rounded-[6px] text-center space-y-1">
              <span className="text-xs font-sans text-[#7c7a85] block">
                Total a Transferir / Liquidar
              </span>
              <span className="text-3xl font-sans tabular-nums font-bold text-[#71d083] block">
                {formatCurrency(payoutModal.totalPayout)}
              </span>
              <span className="text-xs text-[#7c7a85] tabular-nums">
                Comisión acordada: {payoutModal.barber?.commissionRate}%
              </span>
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#2b292d]">
              <button
                type="button"
                onClick={() =>
                  setPayoutModal({ isOpen: false, barber: null, pendingAppointments: [], totalPayout: 0 })
                }
                disabled={submittingPayout}
                className="btn-depot-outline flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBarberPayout}
                disabled={submittingPayout}
                className="btn-depot-primary flex-1"
              >
                {submittingPayout ? (
                  <div className="w-4 h-4 border-2 border-[#04040b] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={14} />
                    <span>Aprobar Liquidación Inmutable</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL DE EDICIÓN DE PORCENTAJE DE COMISIÓN */}
        <Modal
          isOpen={commissionModal.isOpen}
          onClose={() =>
            !submittingCommission &&
            setCommissionModal({ isOpen: false, barber: null, newRate: 60 })
          }
          title={`Ajustar Comisión · ${commissionModal.barber?.name || ''}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-[#b5b2bc] font-sans leading-relaxed">
              Define el porcentaje de comisión que recibirá este barbero por cada servicio realizado en Punto Fino.
            </p>

            <div>
              <label className="block text-xs font-sans text-[#b5b2bc] mb-1.5 font-medium">
                Porcentaje de Comisión (%)
              </label>
              <div className="relative">
                <Percent size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7a85]" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionModal.newRate}
                  onChange={(e) =>
                    setCommissionModal((prev) => ({ ...prev, newRate: e.target.value }))
                  }
                  className="input-depot pl-9 pr-4 tabular-nums text-sm"
                  placeholder="Ej: 60"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#2b292d]">
              <button
                type="button"
                onClick={() =>
                  setCommissionModal({ isOpen: false, barber: null, newRate: 60 })
                }
                disabled={submittingCommission}
                className="btn-depot-outline flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCommissionRate}
                disabled={submittingCommission}
                className="btn-depot-primary flex-1"
              >
                {submittingCommission ? (
                  <div className="w-4 h-4 border-2 border-[#04040b] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={14} />
                    <span>Guardar Comisión</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL DE EDICIÓN DE SALARIO BASE Y COMISIONES (APROBADO POR CONTADOR) */}
        <Modal
          isOpen={salaryModal.isOpen}
          onClose={() =>
            !submittingSalary &&
            setSalaryModal({ isOpen: false, barber: null, monthlySalary: 2000000, commissionRate: 10, productCommissionRate: 15 })
          }
          title={`Editar Sueldo Base y Comisiones · ${salaryModal.barber?.name || ''}`}
        >
          <div className="space-y-4">
            <div className="bg-[#1b2a1e] border border-[#2d5736] p-3 rounded-[6px] text-xs text-[#71d083] flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <p>
                <strong>Aprobado por el Contador:</strong> Salario base fijado con SMLMV vigente + Auxilio de Transporte de ley ($2.000.000 COP/mes), pagado cada 15 días ($1.000.000 COP quincenal). Como administrador puedes modificar este monto y los porcentajes de comisión libremente para este barbero.
              </p>
            </div>

            <div>
              <label className="block text-xs font-sans text-[#b5b2bc] mb-1.5 font-medium">
                Salario Base Mensual (COP)
              </label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7a85]" />
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={salaryModal.monthlySalary}
                  onChange={(e) =>
                    setSalaryModal((prev) => ({ ...prev, monthlySalary: e.target.value }))
                  }
                  className="input-depot pl-9 pr-4 tabular-nums text-sm font-semibold text-[#eeeef0]"
                  placeholder="2000000"
                  required
                />
              </div>
              <p className="text-[11px] text-[#71d083] mt-1 font-sans">
                Valor Quincenal (pago cada 15 días):{' '}
                <strong>
                  {formatCurrency(Math.round((Number(salaryModal.monthlySalary) || 0) / 2))}
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-sans text-[#b5b2bc] mb-1.5 font-medium">
                Comisión por Cortes y Servicios (%)
              </label>
              <div className="relative">
                <Percent size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7a85]" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={salaryModal.commissionRate}
                  onChange={(e) =>
                    setSalaryModal((prev) => ({ ...prev, commissionRate: e.target.value }))
                  }
                  className="input-depot pl-9 pr-4 tabular-nums text-sm font-semibold text-[#eeeef0]"
                  placeholder="10"
                  required
                />
              </div>
              <p className="text-[11px] text-[#7c7a85] mt-1 font-sans">
                Porcentaje asignado al barbero por cada corte de cabello o servicio completado en silla.
              </p>
            </div>

            <div>
              <label className="block text-xs font-sans text-[#b5b2bc] mb-1.5 font-medium">
                Comisión por Productos Capilares Rolda (%)
              </label>
              <div className="relative">
                <Percent size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7a85]" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={salaryModal.productCommissionRate}
                  onChange={(e) =>
                    setSalaryModal((prev) => ({ ...prev, productCommissionRate: e.target.value }))
                  }
                  className="input-depot pl-9 pr-4 tabular-nums text-sm font-semibold text-[#eeeef0]"
                  placeholder="15"
                  required
                />
              </div>
              <p className="text-[11px] text-[#7c7a85] mt-1 font-sans">
                Porcentaje asignado al barbero sobre ventas de productos para el cabello (Línea Rolda) del dashboard.
              </p>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#2b292d]">
              <button
                type="button"
                onClick={() =>
                  setSalaryModal({ isOpen: false, barber: null, monthlySalary: 2000000, commissionRate: 10, productCommissionRate: 15 })
                }
                disabled={submittingSalary}
                className="btn-depot-outline flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSalary}
                disabled={submittingSalary}
                className="btn-depot-primary flex-1"
              >
                {submittingSalary ? (
                  <div className="w-4 h-4 border-2 border-[#04040b] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={14} />
                    <span>Guardar Sueldo y Comisión</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}