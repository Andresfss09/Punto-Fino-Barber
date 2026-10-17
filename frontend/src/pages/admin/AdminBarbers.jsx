import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  X,
  Mail,
  Scissors,
  Calendar,
  Edit2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import PageTransition from '../../components/ui/PageTransition';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { DAY_NAMES_ES } from '../../config/businessConfig';

export default function AdminBarbers() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [saving, setSaving] = useState(false);
  const [conflictPrompt, setConflictPrompt] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    bio: '',
    weeklyRestDay: '3',
    commissionRatePct: 50,
    password: '',
  });

  const fetchBarbers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/barbers');
      const list = res?.barbers || res?.data?.barbers;
      if (Array.isArray(list) && list.length > 0) {
        setBarbers(list);
        setLoading(false);
        return;
      }
    } catch (e) {
      // Intento con endpoint público de barberos
    }
    try {
      const res = await api.get('/barbers');
      const list = res?.barbers || res?.data?.barbers || [];
      setBarbers(list);
    } catch (err) {
      setBarbers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  const openCreateModal = () => {
    setEditingBarber(null);
    setConflictPrompt(null);
    setForm({
      name: '',
      email: '',
      bio: 'Atiende todos los servicios del catálogo con el mismo estándar de calidad.',
      weeklyRestDay: '3',
      commissionRatePct: 50,
      password: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (barber) => {
    setEditingBarber(barber);
    setConflictPrompt(null);
    setForm({
      name: barber.user?.name || barber.nickname || '',
      email: barber.user?.email || '',
      bio: barber.bio || '',
      weeklyRestDay:
        barber.weeklyRestDay !== null && barber.weeklyRestDay !== undefined
          ? String(barber.weeklyRestDay)
          : '',
      commissionRatePct: Math.round(Number(barber.commissionRate || 0.5) * 100),
      password: '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e, forceRestDayChange = false) => {
    if (e) e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('El nombre completo y el correo electrónico son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        nickname: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        bio: form.bio.trim(),
        weeklyRestDay: form.weeklyRestDay === '' ? null : Number(form.weeklyRestDay),
        commissionRate: Number(form.commissionRatePct) / 100,
        forceRestDayChange,
      };

      if (editingBarber) {
        await api.put(`/admin/barbers/${editingBarber.id}`, payload);
        toast.success(`Perfil de ${form.name.trim()} actualizado.`);
      } else {
        if (form.password.trim()) {
          payload.password = form.password.trim();
        }
        await api.post('/admin/barbers', payload);
        toast.success(`Barbero ${form.name.trim()} creado e invitado por correo electrónico.`);
      }

      setModalOpen(false);
      setConflictPrompt(null);
      fetchBarbers();
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.errors?.conflictingAppointments) {
        setConflictPrompt(error.response.data.errors);
      } else {
        toast.error(error.response?.data?.message || 'Error al guardar el barbero.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (barber) => {
    try {
      await api.put(`/admin/barbers/${barber.id}`, {
        isActive: !barber.isActive,
      });
      toast.success(
        barber.isActive
          ? `${barber.nickname} desactivado de la agenda pública.`
          : `${barber.nickname} activado en la agenda pública.`
      );
      fetchBarbers();
    } catch (error) {
      toast.error('No se pudo actualizar el estado del barbero.');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8 pb-16">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <span className="text-xs font-sans font-semibold text-[#B89758] block mb-1">
              Equipo profesional · Sede Villacolombia
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Barberos y días de descanso
            </h2>
            <p className="text-[#9B988F] text-xs sm:text-sm font-sans mt-1">
              Todos los barberos ofrecen todos los servicios con la misma duración y el mismo precio. Configura aquí su día de descanso semanal y su porcentaje de comisión.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-[#E15233] hover:bg-[#C44327] text-white font-sans font-semibold text-xs px-5 py-3 rounded-md inline-flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Invitar nuevo barbero</span>
          </button>
        </div>

        {/* Lista Tipográfica de Barberos (Sin fotos ni cajas de iniciales) */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#B89758] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {barbers.map((barber) => {
              const fullName = barber.user?.name || barber.nickname;
              const isAdminBarber =
                barber.user?.role === 'ADMIN' || barber.user?.role === 'SUPER_ADMIN';
              const restDayText =
                barber.weeklyRestDay !== null && barber.weeklyRestDay !== undefined
                  ? `Descansa los ${DAY_NAMES_ES[barber.weeklyRestDay].toLowerCase()}`
                  : 'Sin día fijo de descanso';

              return (
                <div
                  key={barber.id}
                  className="bg-[#111215] border border-white/10 rounded-md p-6 flex flex-col justify-between space-y-6 shadow-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <span className="text-xs font-sans font-medium text-[#B89758] block">
                          {isAdminBarber ? 'Barbero y Administrador' : 'Barbero'}
                        </span>
                        <h3 className="font-display text-xl font-bold text-white mt-0.5">
                          {fullName}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-sans font-semibold ${
                          barber.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {barber.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="flex items-center gap-2 text-[#cccccc]">
                        <Mail size={14} className="text-[#B89758] shrink-0" />
                        <span className="truncate">{barber.user?.email}</span>
                      </div>

                      <div className="flex items-center gap-2 text-white font-medium">
                        <Calendar size={14} className="text-[#E15233] shrink-0" />
                        <span>{restDayText}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[#9B988F]">
                        <ShieldCheck size={14} className="text-[#B89758] shrink-0" />
                        <span className="tabular-nums">
                          Comisión: {Math.round(Number(barber.commissionRate || 0.5) * 100)}% por servicio
                        </span>
                      </div>
                    </div>

                    {barber.bio && (
                      <p className="text-xs font-sans text-[#9B988F] leading-relaxed pt-2 border-t border-white/5">
                        {barber.bio}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(barber)}
                      className="flex-1 bg-[#18191E] hover:bg-[#22242B] text-white border border-white/15 font-sans font-medium text-xs py-2.5 px-3 rounded-md inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>Editar perfil y descanso</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(barber)}
                      className={`px-3 py-2.5 rounded-md text-xs font-sans font-medium border transition-all cursor-pointer ${
                        barber.isActive
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {barber.isActive ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Creación / Edición de Barbero */}
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setConflictPrompt(null);
          }}
          title={editingBarber ? `Editar a ${editingBarber.nickname}` : 'Invitar nuevo barbero'}
        >
          <form onSubmit={(e) => handleSave(e, false)} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Emanuel Torres"
                className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#B89758]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Correo electrónico (Credencial de acceso y notificaciones)
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="barbero@puntofino.co"
                className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#B89758]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Día de descanso semanal fijo
                </label>
                <select
                  value={form.weeklyRestDay}
                  onChange={(e) => setForm({ ...form, weeklyRestDay: e.target.value })}
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#B89758]"
                >
                  <option value="1">Lunes</option>
                  <option value="2">Martes</option>
                  <option value="3">Miércoles</option>
                  <option value="4">Jueves</option>
                  <option value="5">Viernes</option>
                  <option value="6">Sábado</option>
                  <option value="0">Domingo</option>
                  <option value="">Sin día fijo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Porcentaje de comisión (%)
                </label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={form.commissionRatePct}
                  onChange={(e) =>
                    setForm({ ...form, commissionRatePct: Number(e.target.value) })
                  }
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white tabular-nums outline-none focus:border-[#B89758]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cccccc] mb-1">
                Reseña / Bio corta de oficio
              </label>
              <textarea
                rows={2}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#B89758] resize-none"
              />
            </div>

            {!editingBarber && (
              <div>
                <label className="block text-xs font-medium text-[#cccccc] mb-1">
                  Contraseña temporal (Opcional: si la dejas vacía se generará una automática por correo)
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#18191E] border border-white/15 rounded-md px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#B89758]"
                />
              </div>
            )}

            {/* Alerta si el nuevo día de descanso afecta citas futuras */}
            {conflictPrompt && (
              <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
                <div className="flex items-start gap-2 text-amber-300 font-semibold">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Se detectaron {conflictPrompt.conflictingAppointments?.length} cita(s) futura(s) programadas en {conflictPrompt.newRestDayName}.
                  </span>
                </div>
                <p className="text-[#cccccc]">
                  Te recomendamos reasignar esas citas en la Agenda Maestra o confirmar el cambio a continuación:
                </p>
                <button
                  type="button"
                  onClick={() => handleSave(null, true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 py-2 rounded-md cursor-pointer"
                >
                  Confirmar cambio de día de descanso de todos modos
                </button>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-md bg-[#18191E] text-[#cccccc] hover:text-white text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-md bg-[#E15233] hover:bg-[#C44327] text-white text-xs font-semibold cursor-pointer"
              >
                {saving
                  ? 'Guardando...'
                  : editingBarber
                    ? 'Guardar cambios'
                    : 'Crear e invitar por correo'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}