import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Calendar, Check, X, RefreshCw, Plus, Mail, Clock, Phone, Banknote, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import PageTransition from '../../components/ui/PageTransition';
import Modal from '../../components/ui/Modal';
import { appointmentService } from '../../services/appointmentService';
import { barberService } from '../../services/barberService';
import { serviceService } from '../../services/serviceService';
import api from '../../services/api';
import { formatTime, formatDate, formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminAppointments() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [barberFilter, setBarberFilter] = useState('');
  const [page, setPage] = useState(1);

  // Reassign modal state
  const [reassignTarget, setReassignTarget] = useState(null);
  const [newBarberId, setNewBarberId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  // Walk-in modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    barberId: '',
    serviceId: '',
    paymentMethod: 'EFECTIVO',
    isCompleted: true,
    notes: '',
  });

  // Fetch barbers for filter & modals
  const { data: barbersData } = useQuery({
    queryKey: ['barbers'],
    queryFn: () => barberService.getAll(),
  });
  const barbers = Array.isArray(barbersData) ? barbersData : (barbersData?.barbers || barbersData?.data?.barbers || []);

  // Fetch services for walk-in
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getAll(),
  });
  const services = Array.isArray(servicesData) ? servicesData : (servicesData?.services || servicesData?.data?.services || []);

  // Fetch appointments
  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments', { page, status: statusFilter, date: dateFilter, month: monthFilter, barberId: barberFilter, search: searchTerm }],
    queryFn: async () => {
      const res = await appointmentService.getAll({
        page,
        limit: 50,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
        month: monthFilter || undefined,
        barberId: barberFilter || undefined,
        search: searchTerm || undefined,
      });
      return res;
    },
    keepPreviousData: true,
  });

  const appointments = data?.appointments || [];
  const pagination = data?.pagination || { totalPages: 1, currentPage: 1 };

  // Status mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => appointmentService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Estado de la cita actualizado');
      queryClient.invalidateQueries(['admin-appointments']);
      queryClient.invalidateQueries(['admin-stats']);
      queryClient.invalidateQueries(['admin-overview']);
      queryClient.invalidateQueries(['financial-stats']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al actualizar estado');
    },
  });

  // Reassign mutation (Contingency - Section 4.6)
  const reassignMutation = useMutation({
    mutationFn: (payload) => api.post('/admin/reassign-appointment', payload),
    onSuccess: () => {
      toast.success('Barbero reasignado y notificación enviada por correo');
      setReassignTarget(null);
      setNewBarberId('');
      setReassignReason('');
      queryClient.invalidateQueries(['admin-appointments']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al reasignar barbero');
    },
  });

  // Walk-in mutation
  const walkInMutation = useMutation({
    mutationFn: (payload) => appointmentService.createWalkIn(payload),
    onSuccess: () => {
      toast.success('Cliente presencial (walk-in) registrado y facturado');
      setShowWalkInModal(false);
      setWalkInForm({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        barberId: '',
        serviceId: '',
        paymentMethod: 'EFECTIVO',
        isCompleted: true,
        notes: '',
      });
      queryClient.invalidateQueries(['admin-appointments']);
      queryClient.invalidateQueries(['admin-stats']);
      queryClient.invalidateQueries(['admin-overview']);
      queryClient.invalidateQueries(['financial-stats']);
      queryClient.invalidateQueries(['cash-current']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Error al registrar cliente presencial');
    },
  });

  const handleUpdateStatus = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };

  const openReassignModal = (apt) => {
    setReassignTarget(apt);
    setNewBarberId('');
    setReassignReason('Contingencia operativa en sede');
  };

  const handleReassignSubmit = (e) => {
    e.preventDefault();
    if (!newBarberId) {
      toast.error('Selecciona el nuevo barbero');
      return;
    }
    reassignMutation.mutate({
      appointmentId: reassignTarget._id || reassignTarget.id,
      newBarberId,
      reason: reassignReason
    });
  };

  const handleWalkInSubmit = (e) => {
    e.preventDefault();
    if (!walkInForm.clientName || !walkInForm.barberId || !walkInForm.serviceId) {
      toast.error('Completa nombre, barbero y servicio');
      return;
    }
    walkInMutation.mutate(walkInForm);
  };

  const statuses = [
    { value: '', label: 'Todos los estados' },
    { value: 'completada', label: 'Completadas (Pagadas)' },
    { value: 'en_progreso', label: 'En silla' },
    { value: 'confirmada', label: 'Confirmadas' },
    { value: 'cancelada', label: 'Canceladas' },
    { value: 'no_asistio', label: 'No asistió' },
  ];

  const availableMonths = [
    { value: '', label: 'Todos los meses' },
    { value: '2026-10', label: 'Octubre 2026 (Actual)' },
    { value: '2026-09', label: 'Septiembre 2026' },
    { value: '2026-08', label: 'Agosto 2026' },
    { value: '2026-07', label: 'Julio 2026' },
    { value: '2026-06', label: 'Junio 2026' },
    { value: '2026-11', label: 'Noviembre 2026' },
    { value: '2026-12', label: 'Diciembre 2026' },
  ];

  const completedInView = appointments.filter(a => a.status === 'completada' || a.rawStatus === 'COMPLETED');
  const filteredTotalFacturado = completedInView.reduce((acc, a) => acc + (a.totalPriceCOP || a.totalPrice || 0), 0);
  const filteredEfectivo = completedInView
    .filter(a => (a.paymentMethod || '').toLowerCase().includes('efectivo'))
    .reduce((acc, a) => acc + (a.totalPriceCOP || a.totalPrice || 0), 0);
  const filteredTransfer = completedInView
    .filter(a => !(a.paymentMethod || '').toLowerCase().includes('efectivo'))
    .reduce((acc, a) => acc + (a.totalPriceCOP || a.totalPrice || 0), 0);
  const selectedServiceObj = services.find(s => (s._id || s.id) === walkInForm.serviceId);
  const selectedBarberObj = barbers.find(b => (b._id || b.id) === walkInForm.barberId);
  const rawBarberRate = Number(selectedBarberObj?.commissionRate);
  const barberCutRate = !isNaN(rawBarberRate) && rawBarberRate > 0
    ? (rawBarberRate > 1 ? rawBarberRate / 100 : rawBarberRate)
    : 0.10;
  const barberCutPercent = Math.round(barberCutRate * 100);
  const servicePrice = Number(selectedServiceObj?.price || selectedServiceObj?.priceCOP || 0);
  const barberCommissionCOP = Math.round(servicePrice * barberCutRate);

  const handleOpenWalkInModal = () => {
    setWalkInForm((prev) => ({
      ...prev,
      barberId: prev.barberId || (barbers[0] ? (barbers[0]._id || barbers[0].id) : ''),
    }));
    setShowWalkInModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completada':
        return 'tag-depot-green';
      case 'confirmada':
      case 'en_progreso':
        return 'tag-depot-blue';
      case 'pendiente':
        return 'tag-depot-neutral';
      case 'cancelada':
      case 'no_asistio':
        return 'tag-depot-danger';
      default:
        return 'tag-depot-neutral';
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-6 border-b border-[#2b292d]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#71d083]"></span>
              <span className="text-[11px] font-sans font-semibold text-[#71d083]">Agenda Maestra · 3 Sillas</span>
            </div>
            <h1 className="font-sans font-semibold tracking-[-0.025em] text-2xl sm:text-3xl text-[#e5e5e5]">
              Gestión de <span className="text-[#71d083]">Citas</span>
            </h1>
            <p className="text-[#7c7a85] text-xs font-sans mt-1">
              Supervisión de las 3 sillas, registro de clientes presenciales (walk-in) y reasignación por contingencia.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleOpenWalkInModal}
              className="btn-depot-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
            >
              <Plus size={14} /> Registrar Walk-in
            </button>
            <button 
              onClick={() => {
                setDateFilter(format(new Date(), 'yyyy-MM-dd'));
                setMonthFilter('');
              }}
              className="btn-depot-outline text-xs !py-2 !px-4"
            >
              Citas de Hoy
            </button>
            <button 
              onClick={() => {
                setMonthFilter(format(new Date(), 'yyyy-MM'));
                setDateFilter('');
              }}
              className="btn-depot-outline text-xs !py-2 !px-4"
            >
              Este Mes
            </button>
            <button 
              onClick={() => {
                setDateFilter('');
                setMonthFilter('');
                setStatusFilter('');
                setBarberFilter('');
                setSearchTerm('');
              }}
              className="btn-depot-outline text-xs !py-2 !px-4"
            >
              Ver Todas
            </button>
          </div>
        </div>

        {/* Filters Bar: Months, Days, Barbers, Status & Search */}
        <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] mb-6 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7a85]" size={15} />
              <input
                type="text"
                placeholder="Buscar cliente, código o tel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-depot pl-9 pr-3 !py-2 text-xs"
              />
            </div>
            
            {/* Filter by Month */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7a85]" size={15} />
              <select
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setDateFilter('');
                }}
                title="Filtrar por mes"
                className="input-depot pl-9 pr-3 !py-2 text-xs cursor-pointer font-sans"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Filter by Specific Day */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value) {
                  setMonthFilter(e.target.value.slice(0, 7));
                }
              }}
              title="Filtrar por día exacto"
              className="input-depot px-3 !py-2 text-xs tabular-nums cursor-pointer"
            />
            
            {/* Filter by Barber */}
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="input-depot px-3 !py-2 text-xs cursor-pointer font-sans"
            >
              <option value="">Todos los barberos</option>
              {barbers.map(b => (
                <option key={b._id || b.id} value={b._id || b.id}>{b.user?.name || b.name}</option>
              ))}
            </select>
            
            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-depot px-3 !py-2 text-xs cursor-pointer font-sans"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Quick Metrics & Filter Badges Strip */}
          <div className="mt-3 pt-3 border-t border-[#1f1e21] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#7c7a85]">Listadas:</span>
              <strong className="text-[#e5e5e5] font-semibold">{appointments.length} citas</strong>
              {barberFilter && (
                <span className="px-2 py-0.5 rounded bg-[#1a191b] border border-[#2b292d] text-[#C8A97E] text-[11px]">
                  Barbero: {barbers.find(b => (b._id || b.id) === barberFilter)?.user?.name || barbers.find(b => (b._id || b.id) === barberFilter)?.name}
                </span>
              )}
              {monthFilter && (
                <span className="px-2 py-0.5 rounded bg-[#1a191b] border border-[#2b292d] text-[#71d083] text-[11px]">
                  Mes: {availableMonths.find(m => m.value === monthFilter)?.label || monthFilter}
                </span>
              )}
              {dateFilter && (
                <span className="px-2 py-0.5 rounded bg-[#1a191b] border border-[#2b292d] text-[#71d083] text-[11px]">
                  Día: {dateFilter}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-[11px] tabular-nums">
              <div className="text-[#7c7a85]">
                Total Facturado en vista:{' '}
                <strong className="text-[#71d083] font-bold text-xs">
                  {formatPrice(filteredTotalFacturado)}
                </strong>
              </div>
              <div className="text-[#7c7a85] hidden sm:block">
                Efectivo: <span className="text-[#eeeef0]">{formatPrice(filteredEfectivo)}</span> · Transf: <span className="text-[#eeeef0]">{formatPrice(filteredTransfer)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#71d083] border-t-transparent"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 bg-[#121113] border border-[#2b292d] rounded-[6px] p-8">
            <Calendar size={36} className="text-[#7c7a85] mx-auto mb-3" />
            <p className="font-sans font-medium text-sm text-[#e5e5e5] mb-1">
              No se encontraron citas
            </p>
            <p className="text-[#7c7a85] text-xs font-sans mt-1">
              Ajusta los filtros de fecha o registra una cita presencial (walk-in).
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {appointments.map((apt) => {
              const aptId = apt._id || apt.id;
              const primaryService = apt.service || apt.services?.[0];
              const barberName = apt.barber?.user?.name || apt.barber?.name || 'Por asignar';

              return (
                <div 
                  key={aptId} 
                  className="bg-[#121113] border border-[#2b292d] hover:border-[#3c393f] rounded-[6px] overflow-hidden transition-all"
                >
                  <div className="flex flex-col lg:flex-row">
                    
                    {/* Info Section */}
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Client & Date */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={getStatusBadge(apt.status)}>
                            {apt.status}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#1a191b] border border-[#3c393f] text-[#71d083] font-mono font-bold text-xs tracking-wider">
                            {apt.bookingCode || `#${aptId?.slice(-5)}`}
                          </span>
                          {apt.isWalkIn && (
                            <span className="px-2 py-0.5 rounded bg-[#2b2518] border border-[#6b5832] text-[#C8A97E] text-[10px] font-semibold uppercase tracking-wider">
                              Walk-in (Presencial)
                            </span>
                          )}
                        </div>
                        <h3 className="font-sans font-semibold text-base text-[#e5e5e5] leading-tight mb-1">
                          {apt.clientName || apt.client?.name || 'Cliente'}
                        </h3>
                        <div className="flex flex-col gap-1 text-xs mb-1.5 font-sans">
                          {(apt.clientPhone || apt.client?.phone) && (
                            <p className="text-[#eeeef0] flex items-center gap-1 font-medium">
                              <Phone size={11} className="text-[#71d083]" /> {apt.clientPhone || apt.client?.phone}
                            </p>
                          )}
                          {(apt.clientEmail || apt.client?.email) && (
                            <p className="text-[11px] text-[#7c7a85] flex items-center gap-1">
                              <Mail size={11} className="text-[#71d083]" /> {apt.clientEmail || apt.client?.email}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[#7c7a85] text-xs font-sans mt-2 tabular-nums flex-wrap">
                          <Calendar size={13} className="text-[#71d083]" />
                          <span>{formatDate(apt.startTime, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          <span>•</span>
                          <span className="text-[#eeeef0] font-semibold">{formatTime(apt.startTime)} a {formatTime(apt.endTime)}</span>
                        </div>
                      </div>
                      
                      {/* Single Service */}
                      <div>
                        <p className="text-[#7c7a85] font-sans text-xs mb-2 font-medium">
                          Servicio reservado
                        </p>
                        <div className="bg-[#1a191b] border border-[#2b292d] rounded-[6px] p-2.5">
                          <p className="text-[#eeeef0] text-xs font-semibold">
                            {primaryService?.name || apt.serviceName || 'Servicio de barbería'}
                          </p>
                          <p className="text-[#7c7a85] text-[11px] tabular-nums mt-0.5 flex items-center gap-1">
                            <Clock size={11} /> {apt.totalDuration || apt.totalDurationMin || primaryService?.duration || 35} min
                          </p>
                        </div>
                      </div>
                      
                      {/* Barber & Price */}
                      <div>
                        <p className="text-[#7c7a85] font-sans text-xs mb-2 font-medium">
                          Barbero asignado y total
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#eeeef0] text-sm font-semibold">{barberName}</span>
                          {(apt.status === 'confirmada' || apt.status === 'pendiente') && (
                            <button
                              onClick={() => openReassignModal(apt)}
                              className="text-[11px] text-[#C8A97E] hover:underline flex items-center gap-1 cursor-pointer"
                              title="Reasignar barbero por contingencia"
                            >
                              <RefreshCw size={11} /> Reasignar
                            </button>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-2 p-2 bg-[#1a191b] border border-[#2b292d] rounded-[4px]">
                          <span className="text-[#7c7a85] text-[11px] uppercase">
                            {apt.paymentMethod === 'TRANSFERENCIA_BANCARIA' || (apt.paymentMethod || '').toLowerCase().includes('transfe')
                              ? 'Transferencia'
                              : (apt.paymentMethod || 'Efectivo')}
                          </span>
                          <span className="text-[#71d083] font-sans tabular-nums font-bold text-sm">
                            {formatPrice(apt.totalPriceCOP || apt.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions Section */}
                    <div className="flex flex-row lg:flex-col border-t lg:border-t-0 lg:border-l border-[#2b292d] bg-[#1a191b] min-w-[155px]">
                      {(apt.status === 'pendiente' || apt.status === 'confirmada' || apt.status === 'en_progreso') && (
                        <button 
                          onClick={() => handleUpdateStatus(aptId, 'completada')}
                          className="flex-1 py-3 px-4 text-[#71d083] hover:bg-[#1b2a1e] text-xs font-sans font-semibold flex items-center justify-center gap-1.5 border-r lg:border-r-0 lg:border-b border-[#2b292d] transition-colors cursor-pointer"
                        >
                          <Check size={14} /> Completar
                        </button>
                      )}
                      
                      {(apt.status === 'pendiente' || apt.status === 'confirmada') && (
                        <button 
                          onClick={() => handleUpdateStatus(aptId, 'cancelada')}
                          className="flex-1 py-3 px-4 text-rose-400 hover:bg-rose-500/10 text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <X size={14} /> Cancelar
                        </button>
                      )}

                      {apt.status === 'completada' && (
                        <div className="flex-1 py-3 px-4 text-[#71d083] text-xs font-sans flex items-center justify-center gap-1.5 font-semibold">
                          <Check size={14} /> Completada
                        </div>
                      )}

                      {(apt.status === 'cancelada' || apt.status === 'no_asistio') && (
                        <div className="flex-1 py-3 px-4 text-rose-400/70 text-xs font-sans flex items-center justify-center gap-1.5">
                          <X size={14} /> {apt.status === 'no_asistio' ? 'No asistió' : 'Cancelada'}
                        </div>
                      )}
                    </div>
                    
                  </div>
                </div>
              );
            })}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="btn-depot-outline !py-1.5 !px-3 tabular-nums"
                >
                  &lt;
                </button>
                <div className="bg-[#1a191b] border border-[#2b292d] text-[#71d083] px-4 py-1.5 tabular-nums font-medium text-xs rounded-[6px] flex items-center">
                  {page} / {pagination.totalPages}
                </div>
                <button 
                  disabled={page === pagination.totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="btn-depot-outline !py-1.5 !px-3 tabular-nums"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reassign Barber Modal (Section 4.6) */}
        <Modal
          isOpen={!!reassignTarget}
          onClose={() => setReassignTarget(null)}
          title="Reasignar Barbero por Contingencia"
        >
          {reassignTarget && (
            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div className="bg-[#1a191b] border border-[#2b292d] rounded-[6px] p-3.5 text-xs space-y-1">
                <p className="text-[#7c7a85]">Cliente: <strong className="text-[#eeeef0]">{reassignTarget.client?.name}</strong></p>
                <p className="text-[#7c7a85]">Horario: <strong className="text-[#eeeef0] tabular-nums">{reassignTarget.date} · {reassignTarget.startTime}</strong></p>
                <p className="text-[#7c7a85]">Barbero actual: <strong className="text-[#C8A97E]">{reassignTarget.barber?.user?.name || reassignTarget.barber?.name}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">Nuevo barbero asignado</label>
                <select
                  value={newBarberId}
                  onChange={(e) => setNewBarberId(e.target.value)}
                  className="input-depot text-xs"
                  required
                >
                  <option value="">Selecciona barbero disponible...</option>
                  {barbers
                    .filter(b => (b._id || b.id) !== (reassignTarget.barber?._id || reassignTarget.barber?.id))
                    .map(b => (
                      <option key={b._id || b.id} value={b._id || b.id}>
                        {b.user?.name || b.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">Motivo de contingencia (se enviará por correo al cliente)</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="input-depot text-xs"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#2b292d] flex justify-end gap-2">
                <button type="button" onClick={() => setReassignTarget(null)} className="btn-depot-outline !py-2 !px-4 text-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={reassignMutation.isPending} className="btn-depot-primary !py-2 !px-5 text-xs">
                  {reassignMutation.isPending ? 'Reasignando...' : 'Confirmar y Notificar'}
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Walk-in Modal */}
        <Modal
          isOpen={showWalkInModal}
          onClose={() => setShowWalkInModal(false)}
          title="Registrar Cliente Presencial (Walk-in)"
        >
          <form onSubmit={handleWalkInSubmit} className="space-y-4">
            <div className="bg-[#1b2a1e] border border-[#2d5736] p-3 rounded-[6px] text-xs text-[#71d083] flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-[#71d083] shrink-0 mt-1"></span>
              <p>
                <strong>Registro Inmediato:</strong> Los clientes que llegan sin reserva previa quedan registrados en la plataforma. Al seleccionar el servicio, el barbero y el método de pago, el valor se suma automáticamente al <strong>Total Facturado</strong> y a las comisiones correspondientes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">
                Nombre del cliente <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={walkInForm.clientName}
                onChange={(e) => setWalkInForm({ ...walkInForm, clientName: e.target.value })}
                placeholder="Ej. Andrés Valencia"
                className="input-depot text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">
                  Teléfono / WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  value={walkInForm.clientPhone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, clientPhone: e.target.value })}
                  placeholder="Ej. 318 575 3889"
                  className="input-depot text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">
                  Correo electrónico (opcional)
                </label>
                <input
                  type="email"
                  value={walkInForm.clientEmail}
                  onChange={(e) => setWalkInForm({ ...walkInForm, clientEmail: e.target.value })}
                  placeholder="cliente@correo.com"
                  className="input-depot text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">
                  Barbero que realizó el corte <span className="text-rose-400">*</span>
                </label>
                <select
                  value={walkInForm.barberId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, barberId: e.target.value })}
                  className="input-depot text-xs cursor-pointer font-sans"
                  required
                >
                  <option value="">Selecciona barbero...</option>
                  {barbers.map(b => (
                    <option key={b._id || b.id} value={b._id || b.id}>{b.user?.name || b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">
                  Servicio realizado <span className="text-rose-400">*</span>
                </label>
                <select
                  value={walkInForm.serviceId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, serviceId: e.target.value })}
                  className="input-depot text-xs cursor-pointer font-sans"
                  required
                >
                  <option value="">Selecciona servicio...</option>
                  {services.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name} (${Number(s.price || s.priceCOP).toLocaleString('es-CO')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">
                Método de Pago <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setWalkInForm({ ...walkInForm, paymentMethod: 'EFECTIVO' })}
                  className={`p-3 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    walkInForm.paymentMethod === 'EFECTIVO'
                      ? 'border-[#71d083] bg-[#1b2a1e] text-[#71d083] shadow-sm'
                      : 'border-[#2b292d] bg-[#1a191b] text-[#b5b2bc] hover:border-[#3c393f] hover:text-[#eeeef0]'
                  }`}
                >
                  <Banknote size={16} className={walkInForm.paymentMethod === 'EFECTIVO' ? 'text-[#71d083]' : 'text-[#7c7a85]'} />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWalkInForm({ ...walkInForm, paymentMethod: 'TRANSFERENCIA_BANCARIA' })}
                  className={`p-3 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    walkInForm.paymentMethod === 'TRANSFERENCIA_BANCARIA'
                      ? 'border-[#71d083] bg-[#1b2a1e] text-[#71d083] shadow-sm'
                      : 'border-[#2b292d] bg-[#1a191b] text-[#b5b2bc] hover:border-[#3c393f] hover:text-[#eeeef0]'
                  }`}
                >
                  <CreditCard size={16} className={walkInForm.paymentMethod === 'TRANSFERENCIA_BANCARIA' ? 'text-[#71d083]' : 'text-[#7c7a85]'} />
                  <span>Transferencia / Nequi</span>
                </button>
              </div>
            </div>

            {/* Service Completion Status */}
            <div className="p-3 bg-[#1a191b] border border-[#2b292d] rounded-[6px] space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#eeeef0]">
                <input
                  type="checkbox"
                  checked={walkInForm.isCompleted}
                  onChange={(e) => setWalkInForm({ ...walkInForm, isCompleted: e.target.checked })}
                  className="rounded border-[#3c393f] text-[#71d083] focus:ring-[#71d083] bg-[#121113]"
                />
                <span className="font-semibold text-[#71d083]">
                  Servicio finalizado y cobrado (Se suma de inmediato al Total Facturado)
                </span>
              </label>
              <p className="text-[11px] text-[#7c7a85] pl-6 font-sans">
                {walkInForm.isCompleted
                  ? `El dinero se sumará al recaudo de caja y la comisión del barbero (${selectedBarberObj ? `${barberCutPercent}%` : 'según barbero'}) se acreditará a su nómina.`
                  : 'Se registrará como cliente "En silla" para cobrarlo más tarde al terminar el servicio.'}
              </p>
            </div>

            {/* Financial preview banner */}
            {selectedServiceObj && (
              <div className="bg-[#151417] border border-[#2b292d] rounded-[6px] p-3 text-xs flex justify-between items-center tabular-nums">
                <div>
                  <span className="text-[#7c7a85] block text-[11px]">Valor del Servicio:</span>
                  <span className="text-base font-bold text-[#71d083]">
                    {formatPrice(servicePrice)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#7c7a85] block text-[11px]">
                    Comisión Barbero ({selectedBarberObj ? `${barberCutPercent}%` : 'Según barbero'}):
                  </span>
                  <span className="text-sm font-semibold text-[#C8A97E]">
                    {selectedBarberObj ? formatPrice(barberCommissionCOP) : 'Selecciona barbero'}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#eeeef0] mb-1.5">Notas o preferencias (opcional)</label>
              <input
                type="text"
                value={walkInForm.notes}
                onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                placeholder="Preferencias del corte, estilo degradado..."
                className="input-depot text-xs"
              />
            </div>

            <div className="pt-3 border-t border-[#2b292d] flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowWalkInModal(false)} 
                className="btn-depot-outline !py-2 !px-4 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={walkInMutation.isPending} 
                className="btn-depot-primary !py-2 !px-5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {walkInMutation.isPending ? 'Guardando...' : 'Guardar y Sumar a Facturación'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}
