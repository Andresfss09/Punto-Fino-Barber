import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, ChevronLeft, ChevronRight, Save, Phone, Mail } from 'lucide-react';
import PageTransition from '../../components/ui/PageTransition';
import { appointmentService } from '../../services/appointmentService';
import { barberService } from '../../services/barberService';
import useAuthStore from '../../store/useAuthStore';
import { formatTime, formatPrice, getStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Lunes', defaultStart: '08:00', defaultEnd: '20:30' },
  { id: 'tuesday', label: 'Martes', defaultStart: '09:00', defaultEnd: '20:30' },
  { id: 'wednesday', label: 'Miércoles', defaultStart: '09:00', defaultEnd: '20:30' },
  { id: 'thursday', label: 'Jueves', defaultStart: '09:00', defaultEnd: '20:30' },
  { id: 'friday', label: 'Viernes', defaultStart: '09:00', defaultEnd: '20:30' },
  { id: 'saturday', label: 'Sábado', defaultStart: '09:00', defaultEnd: '20:30' },
  { id: 'sunday', label: 'Domingo', defaultStart: '09:00', defaultEnd: '16:00' },
];

const DAY_INDEX_TO_ID = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const DAY_ID_TO_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DEFAULT_SCHEDULE_DAY = {
  isWorking: true,
  startTime: '09:00',
  endTime: '20:30',
  breakStartTime: '13:00',
  breakEndTime: '14:00'
};

export default function BarberSchedule() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' or 'horario'
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  
  const [schedule, setSchedule] = useState({});
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      setLoadingSchedule(true);
      barberService.getOne(userId)
        .then(res => {
          const barberData = res.barber || res.data?.barber || res.data?.data?.barber;
          const restDayIdx = barberData?.restDayOfWeek ?? 3;
          const raw = barberData?.schedule;
          const cleanSchedule = {};
          DAYS_OF_WEEK.forEach(d => {
            const idx = DAY_ID_TO_INDEX[d.id];
            cleanSchedule[d.id] = {
              isWorking: idx !== restDayIdx,
              startTime: d.defaultStart,
              endTime: d.defaultEnd,
              breakStartTime: '13:00',
              breakEndTime: '14:00',
            };
          });

          if (Array.isArray(raw) && raw.length > 0) {
            raw.forEach(item => {
              const dayId = typeof item.day === 'number' ? DAY_INDEX_TO_ID[item.day] : item.day;
              if (dayId && cleanSchedule[dayId]) {
                cleanSchedule[dayId] = {
                  isWorking: item.isWorking !== false,
                  startTime: item.startTime || cleanSchedule[dayId].startTime,
                  endTime: item.endTime || cleanSchedule[dayId].endTime,
                  breakStartTime: item.breakStartTime || item.breakStart || '13:00',
                  breakEndTime: item.breakEndTime || item.breakEnd || '14:00',
                };
              }
            });
          }
          setSchedule(cleanSchedule);
        })
        .catch(() => {
          const fallback = {};
          DAYS_OF_WEEK.forEach(d => {
            fallback[d.id] = {
              isWorking: d.id !== 'wednesday',
              startTime: d.defaultStart,
              endTime: d.defaultEnd,
              breakStartTime: '13:00',
              breakEndTime: '14:00'
            };
          });
          setSchedule(fallback);
        })
        .finally(() => setLoadingSchedule(false));
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    if (activeTab === 'agenda') {
      setLoadingAgenda(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      appointmentService.getBarberAppointments({ date: dateStr })
        .then(res => {
          setAppointments(res.appointments || res.data?.appointments || []);
        })
        .catch(() => {
          setAppointments([]);
        })
        .finally(() => setLoadingAgenda(false));
    }
  }, [selectedDate, activeTab]);

  const handleUpdateScheduleDay = (dayId, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...(prev[dayId] || DEFAULT_SCHEDULE_DAY),
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      setSavingSchedule(true);
      const formattedSchedule = Object.entries(schedule).map(([dayId, dayData]) => ({
        day: DAY_ID_TO_INDEX[dayId] !== undefined ? DAY_ID_TO_INDEX[dayId] : dayId,
        isWorking: dayData.isWorking,
        startTime: dayData.startTime,
        endTime: dayData.endTime,
        breakStartTime: dayData.breakStartTime,
        breakEndTime: dayData.breakEndTime,
      }));

      await barberService.updateProfile({ schedule: formattedSchedule });
      toast.success('Horario actualizado exitosamente');
    } catch (error) {
      console.error('Error al guardar horario:', error);
      toast.error('Error al guardar horario');
    } finally {
      setSavingSchedule(false);
    }
  };

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completada' || a.status === 'COMPLETED').length,
    earnings: appointments.filter(a => a.status === 'completada' || a.status === 'COMPLETED').reduce((sum, a) => sum + (a.totalPriceCOP || a.totalPrice || 0), 0)
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-2 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-6 border-b border-[#2b292d]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#71d083]" />
              <span className="font-sans font-semibold text-xs text-[#71d083]">
                Operaciones · Gestión de Jornada
              </span>
            </div>
            <h1 className="font-sans font-semibold tracking-[-0.025em] text-2xl sm:text-3xl text-[#eeeef0]">
              Agenda y <span className="text-[#71d083]">Disponibilidad</span>
            </h1>
            <p className="text-[#888888] text-xs font-sans mt-1">
              Visualiza tus citas programadas en tiempo real y revisa tus franjas laborales.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#2b292d] pb-4">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-4 py-2 text-xs font-sans font-semibold rounded-[6px] transition-all cursor-pointer border ${
              activeTab === 'agenda' 
                ? 'bg-[#71d083] text-[#04040b] border-[#366740]' 
                : 'bg-[#1a191b] text-[#888888] hover:text-[#eeeef0] border-[#2b292d]'
            }`}
          >
            Agenda Diaria
          </button>
          <button
            onClick={() => setActiveTab('horario')}
            className={`px-4 py-2 text-xs font-sans font-semibold rounded-[6px] transition-all cursor-pointer border ${
              activeTab === 'horario' 
                ? 'bg-[#71d083] text-[#04040b] border-[#366740]' 
                : 'bg-[#1a191b] text-[#888888] hover:text-[#eeeef0] border-[#2b292d]'
            }`}
          >
            Configurar Horario
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'agenda' && (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Date Selector */}
              <div className="flex items-center justify-between p-4 bg-[#121113] border border-[#2b292d] rounded-[6px]">
                <button 
                  onClick={() => setSelectedDate(prev => subDays(prev, 1))}
                  className="p-2 bg-[#1a191b] hover:bg-[#232225] border border-[#2b292d] text-[#888888] hover:text-white rounded-[6px] transition-colors cursor-pointer"
                  title="Día anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-center">
                  <h3 className="font-sans font-semibold text-base text-[#eeeef0] mb-1 capitalize">
                    {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                  </h3>
                  {isSameDay(selectedDate, new Date()) && (
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1b2a1e] text-[#71d083] border border-[#2d5736]">
                      Hoy
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                  className="p-2 bg-[#1a191b] hover:bg-[#232225] border border-[#2b292d] text-[#888888] hover:text-white rounded-[6px] transition-colors cursor-pointer"
                  title="Día siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Stats for the day */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-4 text-center">
                  <p className="text-[#888888] text-xs mb-1">Total Citas</p>
                  <p className="tabular-nums text-2xl font-bold text-[#eeeef0]">{stats.total}</p>
                </div>
                <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-4 text-center">
                  <p className="text-[#888888] text-xs mb-1">Completadas</p>
                  <p className="tabular-nums text-2xl font-bold text-[#71d083]">{stats.completed}</p>
                </div>
                <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-4 text-center">
                  <p className="text-[#888888] text-xs mb-1">Ingresos</p>
                  <p className="tabular-nums text-2xl font-bold text-[#eeeef0]">${stats.earnings.toLocaleString('es-CO')}</p>
                </div>
              </div>

              {/* Timeline Container */}
              <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] overflow-hidden relative min-h-[300px]">
                {loadingAgenda ? (
                  <div className="p-20 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border border-[#71d083] border-t-transparent"></div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="p-16 text-center">
                    <p className="font-sans font-medium text-sm text-[#eeeef0] mb-1">Día Libre / Sin Citas</p>
                    <p className="text-[#888888] text-xs font-sans">No tienes citas agendadas para esta fecha.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2b292d]/60">
                    {appointments.map(apt => (
                      <div key={apt._id || apt.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:bg-[#1a191b]/50 transition-colors">
                        <div className="w-28 flex-shrink-0 pt-0.5 tabular-nums">
                          <p className="font-bold text-[#eeeef0] text-sm sm:text-base">{formatTime(apt.startTime)}</p>
                          <p className="text-[#7c7a85] text-xs">a {formatTime(apt.endTime)}</p>
                          <p className="text-[#888888] text-[11px] mt-1">
                            {apt.totalDuration || apt.totalDurationMin || 35} min
                          </p>
                        </div>
                        
                        <div className="flex-1 border-l-2 pl-4 py-0.5 flex flex-col justify-between" 
                             style={{ borderColor: apt.status === 'completada' || apt.status === 'COMPLETED' ? '#71d083' : apt.status === 'cancelada' || apt.status === 'CANCELLED' ? '#ef4444' : '#60a5fa' }}>
                          <div>
                            <div className="flex justify-between items-start mb-1.5 flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {apt.bookingCode && (
                                  <span className="px-2 py-0.5 rounded bg-[#1a191b] border border-[#3c393f] text-[#71d083] font-mono font-bold text-xs tracking-wider">
                                    {apt.bookingCode}
                                  </span>
                                )}
                                <h4 className="font-sans font-semibold text-sm text-[#eeeef0]">
                                  {apt.clientName || apt.client?.name || 'Cliente'}
                                </h4>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                apt.status === 'completada' || apt.status === 'COMPLETED' ? 'bg-[#1b2a1e] text-[#71d083] border-[#2d5736]' :
                                apt.status === 'confirmada' || apt.status === 'CONFIRMED' ? 'bg-[#1e293b] text-blue-400 border-blue-500/30' :
                                apt.status === 'cancelada' || apt.status === 'CANCELLED' ? 'bg-[#2a1717] text-red-400 border-red-500/30' :
                                'bg-[#2a2417] text-amber-400 border-amber-500/30'
                              }`}>
                                {getStatusLabel(apt.status)}
                              </span>
                            </div>

                            <p className="text-[#eeeef0] font-medium text-xs mb-2 font-sans">
                              {apt.service?.name || apt.serviceName || apt.services?.map(s => s.name || s.service?.name).join(', ') || 'Servicio Punto Fino'}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-[#888888] flex-wrap mb-2">
                              {(apt.clientPhone || apt.client?.phone) && (
                                <span className="flex items-center gap-1 text-[#eeeef0] font-medium">
                                  <Phone size={12} className="text-[#71d083]" /> {apt.clientPhone || apt.client?.phone}
                                </span>
                              )}
                              {(apt.clientEmail || apt.client?.email) && (
                                <span className="flex items-center gap-1 text-[#888888]">
                                  <Mail size={12} className="text-[#71d083]" /> {apt.clientEmail || apt.client?.email}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs border-t border-[#2b292d]/60 pt-2 mt-2">
                            <span className="text-[#888888] uppercase">{apt.paymentMethod || 'efectivo'}</span>
                            <span className="text-[#eeeef0] tabular-nums font-bold">
                              {formatPrice(apt.totalPriceCOP || apt.totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'horario' && (
            <motion.div
              key="horario"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-6">
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-[#2b292d]">
                  <div className="w-10 h-10 bg-[#1a191b] border border-[#2b292d] rounded-[6px] flex items-center justify-center flex-shrink-0 text-[#71d083]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-sm text-[#eeeef0] mb-1">Horario Laboral y Descansos</h3>
                    <p className="text-[#888888] text-xs leading-relaxed font-sans">
                      El horario general de Punto Fino es Lunes 08:00 a 20:30, Martes a Sábado 09:00 a 20:30 y Domingo 09:00 a 16:00.
                    </p>
                  </div>
                </div>

                {loadingSchedule ? (
                  <div className="p-10 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border border-[#71d083] border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map(day => {
                      const daySchedule = schedule[day.id] || DEFAULT_SCHEDULE_DAY;
                      return (
                        <div key={day.id} className="border border-[#2b292d] p-4 bg-[#1a191b] rounded-[6px]">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-sans font-semibold text-xs text-[#eeeef0]">{day.label}</h4>
                            <label className="flex items-center cursor-pointer relative">
                              <input 
                                type="checkbox" 
                                className="sr-only"
                                checked={daySchedule.isWorking}
                                onChange={(e) => handleUpdateScheduleDay(day.id, 'isWorking', e.target.checked)}
                              />
                              <div className={`w-11 h-6 rounded-full border transition-colors ${daySchedule.isWorking ? 'bg-[#71d083] border-[#366740]' : 'bg-[#121113] border-[#2b292d]'}`}></div>
                              <div className={`absolute w-4 h-4 rounded-full bg-[#04040b] top-1 transition-transform ${daySchedule.isWorking ? 'translate-x-6' : 'translate-x-1 opacity-40'}`}></div>
                            </label>
                          </div>

                          {daySchedule.isWorking ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#2b292d] tabular-nums">
                              <div>
                                <label className="text-[#888888] text-xs mb-1.5 block">Jornada</label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="time" 
                                    value={daySchedule.startTime}
                                    onChange={(e) => handleUpdateScheduleDay(day.id, 'startTime', e.target.value)}
                                    className="bg-[#232225] border border-[#2b292d] text-[#eeeef0] rounded-[6px] py-1.5 px-2.5 flex-1 text-xs outline-none"
                                  />
                                  <span className="text-[#666]">-</span>
                                  <input 
                                    type="time" 
                                    value={daySchedule.endTime}
                                    onChange={(e) => handleUpdateScheduleDay(day.id, 'endTime', e.target.value)}
                                    className="bg-[#232225] border border-[#2b292d] text-[#eeeef0] rounded-[6px] py-1.5 px-2.5 flex-1 text-xs outline-none"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-[#888888] text-xs mb-1.5 flex justify-between">
                                  <span>Almuerzo / Pausa</span>
                                  <span className="text-[#666] font-normal">(opcional)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="time" 
                                    value={daySchedule.breakStartTime}
                                    onChange={(e) => handleUpdateScheduleDay(day.id, 'breakStartTime', e.target.value)}
                                    className="bg-[#232225] border border-[#2b292d] text-[#eeeef0] rounded-[6px] py-1.5 px-2.5 flex-1 text-xs outline-none"
                                  />
                                  <span className="text-[#666]">-</span>
                                  <input 
                                    type="time" 
                                    value={daySchedule.breakEndTime}
                                    onChange={(e) => handleUpdateScheduleDay(day.id, 'breakEndTime', e.target.value)}
                                    className="bg-[#232225] border border-[#2b292d] text-[#eeeef0] rounded-[6px] py-1.5 px-2.5 flex-1 text-xs outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-3 border-t border-[#2b292d] text-center py-2">
                              <span className="text-[#C8A97E] text-xs font-medium">
                                Día de Descanso Fijo Semanal
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-[#2b292d] flex justify-end">
                  <button 
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule || loadingSchedule}
                    className="btn-depot-primary flex items-center justify-center gap-2 !py-2.5 !px-6 w-full sm:w-auto"
                  >
                    {savingSchedule ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        Guardar Horario
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
