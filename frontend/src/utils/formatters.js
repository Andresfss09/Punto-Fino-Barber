export const formatPrice = (price) => {
  const num = typeof price === 'number' ? price : Number(price);
  if (isNaN(num)) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (date, options = {}) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' && !date.includes('T') ? new Date(`${date}T12:00:00-05:00`) : new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(d);
  } catch {
    return String(date);
  }
};

export const formatTime = (time) => {
  if (!time) return '--:--';
  if (typeof time === 'string' && (time.includes('T') || time.includes('Z'))) {
    try {
      const d = new Date(time);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-CO', {
          timeZone: 'America/Bogota',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch {}
  }
  if (typeof time === 'string' && time.includes(':')) {
    const parts = time.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return '--:--';
    const period = h >= 12 ? 'p. m.' : 'a. m.';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  }
  return '--:--';
};

export const getStatusColor = (status) => {
  const colors = {
    pendiente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmada: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    en_progreso: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    IN_PROGRESS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completada: 'bg-green-500/20 text-green-400 border-green-500/30',
    COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelada: 'bg-red-500/20 text-red-400 border-red-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
    no_show: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    NO_SHOW: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    no_asistio: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[status] || colors.confirmada;
};

export const getStatusLabel = (status) => {
  const labels = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    CONFIRMED: 'Confirmada',
    en_progreso: 'En progreso',
    IN_PROGRESS: 'En progreso',
    completada: 'Completada',
    COMPLETED: 'Completada',
    cancelada: 'Cancelada',
    CANCELLED: 'Cancelada',
    no_show: 'No asistió',
    NO_SHOW: 'No asistió',
    no_asistio: 'No asistió',
  };
  return labels[status] || status;
};

export const getDayName = (dayNumber) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayNumber];
};