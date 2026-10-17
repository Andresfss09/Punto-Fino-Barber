import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  DollarSign, 
  Clock, 
  Play, 
  Check, 
  X, 
  Calendar, 
  CalendarRange, 
  Search, 
  RefreshCw, 
  Mail, 
  TrendingUp, 
  Scissors, 
  Plus,
  Ban,
  ShoppingBag,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import PageTransition from '../../components/ui/PageTransition';
import Modal from '../../components/ui/Modal';
import { barberService } from '../../services/barberService';
import { appointmentService } from '../../services/appointmentService';
import { serviceService } from '../../services/serviceService';
import api from '../../services/api';
import { formatPrice, formatTime, getStatusLabel } from '../../utils/formatters';

const REST_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function BarberDashboard() {
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' | 'reporte'

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingRange, setLoadingRange] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [barberProfile, setBarberProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);

  const [stats, setStats] = useState({
    cutsToday: 0,
    revenueToday: 0,
    cutsThisWeek: 0,
    revenueThisWeek: 0,
    cutsThisMonth: 0,
    revenueThisMonth: 0,
    pendingToday: 0,
    totalScheduledToday: 0,
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState([]);

  const [rangeStartDate, setRangeStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [rangeEndDate, setRangeEndDate] = useState(todayStr);
  const [rangeStats, setRangeStats] = useState({
    totalCuts: 0,
    totalRevenue: 0,
    commissionEarned: 0,
    tipsEarned: 0,
    totalNet: 0,
    settlements: [],
    appointments: [],
  });

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointmentToCancel, setSelectedAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Checkout Modal (Servicio + Productos Rolda/Nevera + Propina)
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    paymentMethod: 'efectivo',
    tip: 0,
    selectedProducts: [] // [{ productId, quantity }]
  });


  // Block Time Modal
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: todayStr,
    startTime: '13:00',
    endTime: '14:00',
    reason: 'Almuerzo'
  });

  const fetchCatalogs = useCallback(async () => {
    try {
      const [srvRes, prodRes] = await Promise.all([
        serviceService.getAll(),
        api.get('/products').catch(() => ({ data: { data: { products: [] } } }))
      ]);
      setServices(srvRes?.services || srvRes?.data?.services || []);
      setProducts(prodRes?.data?.data?.products || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await barberService.getMyStats();
      setStats({
        cutsToday: data.cutsToday || 0,
        revenueToday: data.revenueToday || 0,
        cutsThisWeek: data.cutsThisWeek || 0,
        revenueThisWeek: data.revenueThisWeek || 0,
        cutsThisMonth: data.cutsThisMonth || 0,
        revenueThisMonth: data.revenueThisMonth || 0,
        pendingToday: data.pendingToday || 0,
        totalScheduledToday: data.totalScheduledToday || 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchAgenda = useCallback(async (date) => {
    try {
      setLoadingAppointments(true);
      const data = await barberService.getMyDashboard({ date });
      if (data?.barber) setBarberProfile(data.barber);
      const list = data?.appointments || [];
      setAppointments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error cargando agenda de citas:', error);
      toast.error('Error al cargar la agenda');
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  const fetchRangeReport = useCallback(async (start, end) => {
    try {
      setLoadingRange(true);
      const data = await barberService.getMyEarnings({ startDate: start, endDate: end });
      setRangeStats({
        totalCuts: data.summary?.completedCount || 0,
        totalRevenue: data.summary?.grossServices || 0,
        commissionEarned: data.summary?.commissionEarned || 0,
        tipsEarned: data.summary?.tipsEarned || 0,
        totalNet: data.summary?.totalEstimatedNet || 0,
        settlements: data.settlements || [],
        appointments: data.appointments || [],
      });
    } catch (error) {
      console.error('Error cargando reporte histórico:', error);
      toast.error('Error al cargar ganancias del período');
    } finally {
      setLoadingRange(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
    fetchStats();
    fetchAgenda(selectedDate);
  }, [fetchCatalogs, fetchStats, fetchAgenda, selectedDate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'reporte') {
      fetchRangeReport(rangeStartDate, rangeEndDate);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    fetchAgenda(newDate);
  };

  const setRangePreset = (type) => {
    const end = new Date();
    let start = new Date();

    if (type === 'week') {
      const day = end.getDay();
      const diff = end.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (type === 'month') {
      start.setDate(1);
    } else if (type === 'last30') {
      start.setDate(end.getDate() - 30);
    }

    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];
    setRangeStartDate(sStr);
    setRangeEndDate(eStr);
    fetchRangeReport(sStr, eStr);
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      setActionLoadingId(appointmentId);
      await appointmentService.updateStatus(appointmentId, newStatus);
      toast.success(
        newStatus === 'en_progreso' ? 'Servicio en silla iniciado' :
        newStatus === 'completada' ? 'Servicio finalizado con éxito' :
        'Estado actualizado'
      );
      fetchAgenda(selectedDate);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el servicio');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openCheckoutModal = (apt) => {
    setCheckoutTarget(apt);
    setCheckoutForm({
      paymentMethod: apt.paymentMethod || 'efectivo',
      tip: apt.tip || 0,
      selectedProducts: []
    });
  };

  const toggleProductInCheckout = (productId) => {
    setCheckoutForm((prev) => {
      const exists = prev.selectedProducts.find((p) => p.productId === productId);
      if (exists) {
        return {
          ...prev,
          selectedProducts: prev.selectedProducts.filter((p) => p.productId !== productId)
        };
      }
      return {
        ...prev,
        selectedProducts: [...prev.selectedProducts, { productId, quantity: 1 }]
      };
    });
  };

  const handleConfirmCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutTarget) return;
    try {
      const aptId = checkoutTarget._id || checkoutTarget.id;
      setActionLoadingId(aptId);
      await appointmentService.checkout(aptId, {
        paymentMethod: checkoutForm.paymentMethod,
        tip: Number(checkoutForm.tip) || 0,
        tipsCOP: Number(checkoutForm.tip) || 0,
        products: checkoutForm.selectedProducts,
        consumedProducts: checkoutForm.selectedProducts
      });
      toast.success('Cobro y cierre de servicio registrados con éxito');
      setCheckoutTarget(null);
      fetchAgenda(selectedDate);
      fetchStats();
    } catch (err) {
      console.error('Error al registrar cobro:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al registrar cobro');
    } finally {
      setActionLoadingId(null);
    }
  };


  const handleCreateBlockTime = async (e) => {
    e.preventDefault();
    try {
      await barberService.blockTime(blockForm);
      toast.success('Bloque de pausa registrado en tu agenda');
      setBlockOpen(false);
      fetchAgenda(selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tienes citas confirmadas en ese horario');
    }
  };

  const openCancelModal = (apt) => {
    setSelectedAppointmentToCancel(apt);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointmentToCancel) return;
    const aptId = selectedAppointmentToCancel._id || selectedAppointmentToCancel.id;
    try {
      setActionLoadingId(aptId);
      await appointmentService.updateStatus(aptId, 'cancelada');
      toast.success('Cita marcada como cancelada');
      setCancelModalOpen(false);
      fetchAgenda(selectedDate);
      fetchStats();
    } catch {
      toast.error('Error al cancelar la cita');
    } finally {
      setActionLoadingId(null);
      setSelectedAppointmentToCancel(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === 'todos' || apt.status === statusFilter;
    const clientName = apt.client?.name?.toLowerCase() || '';
    const clientEmail = apt.client?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || clientName.includes(query) || clientEmail.includes(query);
    return matchesStatus && matchesQuery;
  });

  const restDay = barberProfile?.weeklyRestDay ?? barberProfile?.restDayOfWeek;
  const restDayLabel =
    barberProfile?.restDayLabel ||
    (restDay !== undefined && restDay !== null
      ? REST_DAY_NAMES[restDay]
      : user?.email?.includes('emanuel') || user?.name?.includes('Emanuel')
        ? 'Lunes'
        : user?.email?.includes('diego') || user?.name?.includes('Diego')
          ? 'Martes'
          : 'Miércoles');

  return (
    <PageTransition>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#121113] p-6 border border-[#2b292d] rounded-[6px]">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-[#71d083]"></span>
              <span className="text-xs font-sans font-semibold text-[#71d083] flex items-center gap-1">
                <Scissors size={12} /> Consola de Mi Silla · Punto Fino
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1a191b] border border-[#2b292d] text-[11px] text-[#C8A97E]">
                Descanso fijo semanal: {restDayLabel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-semibold tracking-[-0.025em] text-[#e5e5e5]">
              Hola, <span className="text-[#71d083]">{user?.name ? user.name.split(' ')[0] : 'Barbero'}</span>
            </h1>
            <p className="text-[#7c7a85] text-xs sm:text-sm mt-1 capitalize">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setBlockOpen(true)}
              className="btn-depot-outline !py-2.5 !px-3.5 text-xs flex items-center gap-1.5"
            >
              <Ban size={14} /> Pausar / Almuerzo
            </button>
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === 'agenda') fetchAgenda(selectedDate);
                else fetchRangeReport(rangeStartDate, rangeEndDate);
              }}
              className="btn-depot-outline !py-2.5 !px-3.5"
              title="Actualizar datos"
            >
              <RefreshCw size={14} className={loadingStats || loadingAppointments || loadingRange ? 'animate-spin text-[#71d083]' : ''} />
            </button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 border border-[#2b292d] bg-[#1a191b] text-[#71d083] rounded-[6px] flex items-center justify-center">
                <Scissors className="w-4 h-4" />
              </div>
              <span className="tag-depot-green">Hoy</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5] mb-1">
                {stats.cutsToday} <span className="text-xs text-[#7c7a85] font-normal">servicios</span>
              </div>
              <p className="text-xs text-[#7c7a85] font-sans">Completados Hoy</p>
              <div className="mt-3 pt-2.5 border-t border-[#2b292d] flex items-center justify-between text-xs font-sans">
                <span className="text-[#7c7a85]">Producido hoy:</span>
                <span className="tabular-nums font-bold text-[#71d083]">{formatPrice(stats.revenueToday)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 border border-[#2b292d] bg-[#1a191b] text-[#70b8ff] rounded-[6px] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="tag-depot-blue">Semana</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5] mb-1">
                {stats.cutsThisWeek} <span className="text-xs text-[#7c7a85] font-normal">servicios</span>
              </div>
              <p className="text-xs text-[#7c7a85] font-sans">Esta Semana</p>
              <div className="mt-3 pt-2.5 border-t border-[#2b292d] flex items-center justify-between text-xs font-sans">
                <span className="text-[#7c7a85]">Generado:</span>
                <span className="tabular-nums font-bold text-[#e5e5e5]">{formatPrice(stats.revenueThisWeek)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 border border-[#2b292d] bg-[#1a191b] text-[#71d083] rounded-[6px] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="tag-depot-green">Mes</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5] mb-1">
                {stats.cutsThisMonth} <span className="text-xs text-[#7c7a85] font-normal">servicios</span>
              </div>
              <p className="text-xs text-[#7c7a85] font-sans">Este Mes</p>
              <div className="mt-3 pt-2.5 border-t border-[#2b292d] flex items-center justify-between text-xs font-sans">
                <span className="text-[#7c7a85]">Generado:</span>
                <span className="tabular-nums font-bold text-[#71d083]">{formatPrice(stats.revenueThisMonth)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 border border-[#2b292d] bg-[#1a191b] text-[#baa7ff] rounded-[6px] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="tag-depot-lilac">Por Atender</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5] mb-1">
                {stats.pendingToday} <span className="text-xs text-[#7c7a85] font-normal">citas</span>
              </div>
              <p className="text-xs text-[#7c7a85] font-sans">Pendientes Hoy</p>
              <div className="mt-3 pt-2.5 border-t border-[#2b292d] flex items-center justify-between text-xs font-sans">
                <span className="text-[#7c7a85]">Total agendadas:</span>
                <span className="tabular-nums font-bold text-[#e5e5e5]">{stats.totalScheduledToday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#2b292d] pb-4">
          <button
            onClick={() => handleTabChange('agenda')}
            className={`px-5 py-2.5 font-sans font-semibold text-xs flex items-center gap-2 rounded-[6px] transition-all cursor-pointer border ${
              activeTab === 'agenda'
                ? 'bg-[#1a191b] text-[#71d083] border-[#2d5736]'
                : 'bg-[#1a191b]/40 text-[#7c7a85] border-[#2b292d] hover:text-[#eeeef0]'
            }`}
          >
            <Calendar size={14} />
            Mi Agenda del Día
            {appointments.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] tabular-nums rounded bg-[#1b2a1e] text-[#71d083] border border-[#2d5736]">
                {appointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('reporte')}
            className={`px-5 py-2.5 font-sans font-semibold text-xs flex items-center gap-2 rounded-[6px] transition-all cursor-pointer border ${
              activeTab === 'reporte'
                ? 'bg-[#1a191b] text-[#71d083] border-[#2d5736]'
                : 'bg-[#1a191b]/40 text-[#7c7a85] border-[#2b292d] hover:text-[#eeeef0]'
            }`}
          >
            <CalendarRange size={14} />
            Mis Comisiones y Liquidaciones
          </button>
        </div>

        {/* TAB 1: AGENDA DE RESERVAS */}
        {activeTab === 'agenda' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-[#121113] p-5 border border-[#2b292d] rounded-[6px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-sans text-[#7c7a85]">Fecha:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-[#1a191b] border border-[#2b292d] text-[#eeeef0] py-1.5 px-3 text-xs rounded-[6px] tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => handleDateChange(todayStr)}
                  className={`px-3 py-1.5 text-xs font-sans rounded-[6px] border transition-all cursor-pointer ${
                    selectedDate === todayStr ? 'bg-[#1a191b] text-[#71d083] border-[#2d5736] font-medium' : 'bg-[#1a191b]/40 text-[#7c7a85] border-[#2b292d]'
                  }`}
                >
                  Hoy
                </button>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7a85]" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo del cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-depot pl-9 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { id: 'todos', label: 'Todas' },
                { id: 'confirmada', label: 'Confirmadas' },
                { id: 'en_progreso', label: 'En Silla' },
                { id: 'completada', label: 'Completadas' },
                { id: 'cancelada', label: 'Canceladas' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 text-xs font-sans rounded-[6px] border transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st.id
                      ? 'bg-[#1a191b] text-[#71d083] border-[#2d5736] font-medium'
                      : 'bg-[#1a191b]/40 text-[#7c7a85] border-[#2b292d]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {loadingAppointments ? (
              <div className="text-center py-20 bg-[#121113] border border-[#2b292d] rounded-[6px]">
                <RefreshCw size={22} className="animate-spin text-[#71d083] mx-auto mb-3" />
                <p className="text-[#7c7a85] font-sans text-xs">Cargando tu agenda...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-16 bg-[#121113] border border-[#2b292d] rounded-[6px] p-8">
                <Scissors size={32} className="text-[#7c7a85] mx-auto mb-3" />
                <h3 className="text-sm font-sans font-semibold text-[#e5e5e5] mb-2">No hay citas registradas</h3>
                <p className="text-[#7c7a85] text-xs max-w-md mx-auto font-sans">
                  No tienes citas agendadas para el día {selectedDate}. Las citas y asignaciones presenciales son gestionadas directamente por la administración.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const aptId = apt._id || apt.id;
                  const client = apt.client || {};
                  const isCurrent = apt.status === 'en_progreso';
                  const isCompleted = apt.status === 'completada';
                  const isCancelled = apt.status === 'cancelada' || apt.status === 'no_asistio';
                  const primaryService = apt.service || apt.services?.[0]?.service || apt.services?.[0];

                  return (
                    <div
                      key={aptId}
                      className={`bg-[#121113] border rounded-[6px] p-5 sm:p-6 transition-all ${
                        isCurrent
                          ? 'border-[#71d083]/70'
                          : isCompleted
                          ? 'border-[#2b292d] opacity-85'
                          : 'border-[#2b292d] hover:border-[#3c393f]'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex items-start sm:items-center gap-4 w-full lg:w-auto">
                          <div className="bg-[#1a191b] border border-[#2b292d] px-3.5 py-2.5 text-center rounded-[6px] min-w-[105px] tabular-nums">
                            <div className="text-[#e5e5e5] font-bold text-sm sm:text-base">
                              {formatTime(apt.startTime)}
                            </div>
                            <div className="text-[11px] text-[#7c7a85]">
                              a {formatTime(apt.endTime)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {apt.bookingCode && (
                                <span className="px-2 py-0.5 rounded bg-[#1a191b] border border-[#3c393f] text-[#71d083] font-mono font-bold text-xs tracking-wider">
                                  {apt.bookingCode}
                                </span>
                              )}
                              <h3 className="text-base font-sans font-semibold text-[#e5e5e5]">
                                {apt.clientName || client.name || 'Cliente'}
                              </h3>
                              <span className={
                                isCompleted
                                  ? 'tag-depot-green'
                                  : isCancelled
                                  ? 'tag-depot-danger'
                                  : isCurrent
                                  ? 'tag-depot-green'
                                  : 'tag-depot-neutral'
                              }>
                                {getStatusLabel(apt.status)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-[#7c7a85] flex-wrap font-sans">
                              {(apt.clientPhone || client.phone) && (
                                <span className="flex items-center gap-1 text-[#eeeef0] font-medium">
                                  <Phone size={12} className="text-[#71d083]" /> {apt.clientPhone || client.phone}
                                </span>
                              )}
                              {(apt.clientEmail || client.email) && (
                                <span className="flex items-center gap-1 text-[#b5b2bc]">
                                  <Mail size={12} className="text-[#71d083]" /> {apt.clientEmail || client.email}
                                </span>
                              )}
                              {apt.paymentMethod && (
                                <span className="text-[10px] uppercase bg-[#1a191b] px-2 py-0.5 border border-[#2b292d] text-[#b5b2bc] rounded">
                                  {apt.paymentMethod}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-6 w-full lg:w-auto">
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-sans font-semibold text-[#eeeef0]">
                              {primaryService?.name || apt.serviceName || 'Servicio Punto Fino'}
                            </div>
                            <div className="text-lg font-sans tabular-nums font-bold text-[#71d083] mt-0.5">
                              {formatPrice(apt.totalPriceCOP || apt.totalPrice)}
                            </div>
                            <div className="text-[11px] text-[#7c7a85] tabular-nums">
                              {apt.totalDuration || apt.totalDurationMin || 35} min
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {['pendiente', 'confirmada'].includes(apt.status) && (
                              <button
                                onClick={() => handleUpdateStatus(aptId, 'en_progreso')}
                                disabled={actionLoadingId === aptId}
                                className="btn-depot-outline !py-2 !px-3 text-xs flex items-center gap-1.5"
                              >
                                <Play size={12} /> Iniciar en Silla
                              </button>
                            )}

                            {['pendiente', 'confirmada', 'en_progreso'].includes(apt.status) && (
                              <button
                                onClick={() => openCheckoutModal(apt)}
                                disabled={actionLoadingId === aptId}
                                className="btn-depot-primary !py-2 !px-4 text-xs flex items-center gap-1.5"
                              >
                                <Check size={13} /> Cobrar y Finalizar
                              </button>
                            )}

                            {isCompleted && (
                              <div className="tag-depot-green flex items-center gap-1">
                                <CheckCircle size={12} /> Completado
                              </div>
                            )}

                            {!isCompleted && !isCancelled && (
                              <button
                                onClick={() => openCancelModal(apt)}
                                disabled={actionLoadingId === aptId}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-[6px] transition-all cursor-pointer"
                                title="Cancelar o No asistió"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {apt.notes && (
                        <div className="mt-3 pt-3 border-t border-[#2b292d] text-xs text-[#7c7a85] flex items-start gap-2 font-sans">
                          <span className="text-[#eeeef0] font-semibold">Nota:</span>
                          <span className="text-[#b5b2bc]">{apt.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: REPORTE POR RANGO DE FECHAS & GANANCIAS */}
        {activeTab === 'reporte' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-[#121113] p-6 border border-[#2b292d] rounded-[6px] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-sans font-semibold text-[#e5e5e5] flex items-center gap-2">
                  <CalendarRange className="text-[#71d083]" size={15} />
                  Mis Comisiones, Propinas y Liquidaciones
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-sans text-[#b5b2bc] mb-1">
                    Desde (Fecha inicial)
                  </label>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    className="input-depot tabular-nums"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-sans text-[#b5b2bc] mb-1">
                    Hasta (Fecha final)
                  </label>
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="input-depot tabular-nums"
                  />
                </div>

                <div className="sm:col-span-4">
                  <button
                    onClick={() => fetchRangeReport(rangeStartDate, rangeEndDate)}
                    disabled={loadingRange}
                    className="w-full btn-depot-primary flex items-center justify-center gap-2"
                  >
                    <Search size={13} />
                    {loadingRange ? 'Consultando...' : 'Consultar Período'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#2b292d] flex-wrap">
                <span className="text-xs text-[#7c7a85] font-sans">Accesos rápidos:</span>
                <button type="button" onClick={() => setRangePreset('today')} className="btn-depot-outline !py-1 !px-2.5 !text-xs">Hoy</button>
                <button type="button" onClick={() => setRangePreset('week')} className="btn-depot-outline !py-1 !px-2.5 !text-xs">Esta Semana</button>
                <button type="button" onClick={() => setRangePreset('month')} className="btn-depot-outline !py-1 !px-2.5 !text-xs">Este Mes</button>
                <button type="button" onClick={() => setRangePreset('last30')} className="btn-depot-outline !py-1 !px-2.5 !text-xs">Últimos 30 días</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5">
                <div className="text-xs font-sans text-[#7c7a85] mb-1">Comisión Ganada</div>
                <div className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#71d083]">
                  {formatPrice(rangeStats.commissionEarned)}
                </div>
              </div>

              <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5">
                <div className="text-xs font-sans text-[#7c7a85] mb-1">Propinas Recibidas</div>
                <div className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#C8A97E]">
                  {formatPrice(rangeStats.tipsEarned)}
                </div>
              </div>

              <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5">
                <div className="text-xs font-sans text-[#7c7a85] mb-1">Total Neto Estimado</div>
                <div className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5]">
                  {formatPrice(rangeStats.totalNet)}
                </div>
              </div>

              <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5">
                <div className="text-xs font-sans text-[#7c7a85] mb-1">Servicios Completados</div>
                <div className="text-2xl sm:text-3xl font-sans tabular-nums font-bold text-[#e5e5e5]">
                  {rangeStats.totalCuts}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MODAL: COBRAR Y FINALIZAR CORTE (CON PRODUCTOS ROLDA / NEVERA) */}
        <Modal
          isOpen={!!checkoutTarget}
          onClose={() => setCheckoutTarget(null)}
          title="Cerrar Servicio en Silla y Cobrar"
        >
          {checkoutTarget && (
            <form onSubmit={handleConfirmCheckout} className="space-y-4">
              <div className="bg-[#1a191b] border border-[#2b292d] rounded-[6px] p-3.5 text-xs flex justify-between items-center">
                <div>
                  <p className="text-[#eeeef0] font-semibold">{checkoutTarget.clientName || checkoutTarget.client?.name || 'Cliente'}</p>
                  <p className="text-[#7c7a85]">{checkoutTarget.service?.name || checkoutTarget.serviceName || checkoutTarget.services?.[0]?.service?.name || 'Servicio'}</p>
                </div>
                <span className="text-base font-bold text-[#71d083] tabular-nums">
                  {formatPrice(checkoutTarget.totalPriceCOP || checkoutTarget.totalPrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#b5b2bc] mb-1">Método de pago</label>
                  <select
                    value={checkoutForm.paymentMethod}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, paymentMethod: e.target.value })}
                    className="input-depot text-xs"
                  >
                    <option value="efectivo">Efectivo presencial</option>
                    <option value="transaccion">Transacción presencial (tras el corte)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#b5b2bc] mb-1">Propina voluntaria (COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={checkoutForm.tip}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, tip: e.target.value })}
                    className="input-depot text-xs tabular-nums"
                  />
                </div>
              </div>

              {products.length > 0 && (
                <div>
                  <label className="block text-xs text-[#b5b2bc] mb-2 flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-[#C8A97E]" /> Agregar productos Rolda o bebidas consumidas en silla
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {products.map((prod) => {
                      const isAdded = checkoutForm.selectedProducts.some((p) => p.productId === prod.id);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => toggleProductInCheckout(prod.id)}
                          className={`p-2.5 rounded-[6px] border text-left text-xs flex justify-between items-center transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-[#1b2a1e] border-[#71d083] text-[#eeeef0]'
                              : 'bg-[#1a191b] border-[#2b292d] text-[#7c7a85] hover:text-[#eeeef0]'
                          }`}
                        >
                          <span className="truncate pr-2">{prod.name}</span>
                          <span className="tabular-nums font-semibold text-[#71d083]">
                            ${Number(prod.price).toLocaleString('es-CO')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#2b292d] flex justify-end gap-2">
                <button type="button" onClick={() => setCheckoutTarget(null)} className="btn-depot-outline !py-2 !px-4 text-xs">
                  Cancelar
                </button>
                <button type="submit" className="btn-depot-primary !py-2 !px-5 text-xs">
                  Confirmar Cierre y Pago
                </button>
              </div>
            </form>
          )}
        </Modal>



        {/* MODAL: BLOQUEAR TIEMPO */}
        <Modal
          isOpen={blockOpen}
          onClose={() => setBlockOpen(false)}
          title="Bloquear Franja (Almuerzo o Diligencia)"
        >
          <form onSubmit={handleCreateBlockTime} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#eeeef0] mb-1">Fecha</label>
                <input
                  type="date"
                  value={blockForm.date}
                  onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                  className="input-depot text-xs tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#eeeef0] mb-1">Desde</label>
                <input
                  type="time"
                  value={blockForm.startTime}
                  onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                  className="input-depot text-xs tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#eeeef0] mb-1">Hasta</label>
                <input
                  type="time"
                  value={blockForm.endTime}
                  onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                  className="input-depot text-xs tabular-nums"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#eeeef0] mb-1">Motivo</label>
              <input
                type="text"
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                placeholder="Almuerzo / Pausa activa"
                className="input-depot text-xs"
              />
            </div>
            <div className="pt-3 border-t border-[#2b292d] flex justify-end gap-2">
              <button type="button" onClick={() => setBlockOpen(false)} className="btn-depot-outline !py-2 !px-4 text-xs">
                Cancelar
              </button>
              <button type="submit" className="btn-depot-primary !py-2 !px-5 text-xs">
                Bloquear Horario
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL: CANCELAR CITA */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancelar Cita"
        >
          <div className="space-y-4">
            <p className="text-xs text-[#b5b2bc]">
              ¿Confirmas la cancelación de la cita de <strong className="text-[#eeeef0]">{selectedAppointmentToCancel?.client?.name}</strong>?
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación..."
              className="input-depot text-xs"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[#2b292d]">
              <button type="button" onClick={() => setCancelModalOpen(false)} className="btn-depot-outline !py-2 !px-4 text-xs">
                Volver
              </button>
              <button type="button" onClick={handleConfirmCancel} className="btn-depot-primary !py-2 !px-5 text-xs">
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}