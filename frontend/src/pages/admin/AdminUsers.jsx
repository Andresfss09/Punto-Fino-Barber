import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Users, UserCheck, Mail, ShieldCheck, MessageSquare, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import PageTransition from '../../components/ui/PageTransition';
import { userService } from '../../services/userService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FALLBACK_USERS = [
  { _id: '1', name: 'Juan David', email: 'juandavid@puntofino.co', role: 'admin', isActive: true, createdAt: '2026-01-15' },
  { _id: '2', name: 'Emanuel Torres', email: 'emanuel@puntofino.co', role: 'barbero', isActive: true, createdAt: '2026-02-10' },
  { _id: '3', name: 'Juan Diego', email: 'juandiego@puntofino.co', role: 'barbero', isActive: true, createdAt: '2026-03-01' },
];

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'messages'
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const res = await userService.getAllUsers();
        const list = res.users || res.data?.users || res || [];
        return Array.isArray(list) && list.length > 0 ? list : FALLBACK_USERS;
      } catch (e) {
        return FALLBACK_USERS;
      }
    }
  });

  const { data: messagesData = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/contact-messages');
        return res.data?.data?.messages || [];
      } catch {
        return [];
      }
    }
  });

  const users = Array.isArray(data) ? data : FALLBACK_USERS;

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => userService.updateUserStatus(id, isActive),
    onSuccess: () => {
      toast.success('Estado de usuario modificado');
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    }
  });

  const updateMessageStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/admin/contact-messages/${id}`, { status }),
    onSuccess: () => {
      toast.success('Estado del mensaje actualizado');
      queryClient.invalidateQueries(['admin-contact-messages']);
    }
  });

  const filteredUsers = users.filter(u => {
    const roleLower = (u.role || '').toLowerCase();
    const roleMatch = filter === 'Todos' 
      || (filter === 'Clientes' && (roleLower === 'cliente' || roleLower === 'client'))
      || (filter === 'Barberos' && (roleLower === 'barbero' || roleLower === 'barber'))
      || (filter === 'Admin' && roleLower === 'admin');
    
    const searchMatch = (u.name || '').toLowerCase().includes(search.toLowerCase()) 
      || (u.email || '').toLowerCase().includes(search.toLowerCase());
    
    return roleMatch && searchMatch;
  });

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'admin':
        return 'tag-depot-lilac';
      case 'barbero':
      case 'barber':
        return 'tag-depot-green';
      default:
        return 'tag-depot-blue';
    }
  };

  const totalCount = users.length;
  const activeCount = users.filter(u => u.isActive !== false).length;
  const unreadMessagesCount = messagesData.filter(m => m.status === 'UNREAD').length;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-6 border-b border-[#2b292d]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#71d083]"></span>
              <span className="text-[11px] font-sans font-semibold text-[#71d083]">Comunidad y Contacto</span>
            </div>
            <h1 className="font-sans font-semibold tracking-[-0.025em] text-2xl sm:text-3xl text-[#e5e5e5]">
              Directorio de Clientes y <span className="text-[#71d083]">Mensajes</span>
            </h1>
            <p className="text-[#7c7a85] text-xs font-sans mt-1">
              Gestión de usuarios por correo electrónico e historial de visitas y formulario web.
            </p>
          </div>

          <div className="flex bg-[#121113] border border-[#2b292d] p-1 rounded-[8px]">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-[#71d083] text-[#111210]'
                  : 'text-[#8E8C84] hover:text-[#eeeef0]'
              }`}
            >
              <Users size={14} /> Directorio ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'messages'
                  ? 'bg-[#71d083] text-[#111210]'
                  : 'text-[#8E8C84] hover:text-[#eeeef0]'
              }`}
            >
              <MessageSquare size={14} /> Buzón Web ({messagesData.length})
              {unreadMessagesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[#7c7a85] font-sans text-xs mb-1">Total Registrados</p>
              <p className="font-sans tabular-nums text-2xl font-bold text-[#e5e5e5]">{totalCount}</p>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-[#1a191b] border border-[#2b292d] flex items-center justify-center text-[#71d083]">
              <Users size={16} />
            </div>
          </div>

          <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[#7c7a85] font-sans text-xs mb-1">Cuentas Activas</p>
              <p className="font-sans tabular-nums text-2xl font-bold text-[#71d083]">{activeCount}</p>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-[#1a191b] border border-[#2b292d] flex items-center justify-center text-[#71d083]">
              <UserCheck size={16} />
            </div>
          </div>

          <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[#7c7a85] font-sans text-xs mb-1">Mensajes Web Pendientes</p>
              <p className="font-sans tabular-nums text-2xl font-bold text-[#baa7ff]">{unreadMessagesCount}</p>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-[#1a191b] border border-[#2b292d] flex items-center justify-center text-[#baa7ff]">
              <MessageSquare size={16} />
            </div>
          </div>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Search & Filter Bar */}
            <div className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-4 mb-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7a85]" size={15} />
                <input 
                  type="text"
                  placeholder="Buscar por nombre o correo..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-depot pl-9 pr-3 !py-2 text-xs"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                {['Todos', 'Clientes', 'Barberos', 'Admin'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-1.5 rounded-[6px] text-xs font-sans transition-all whitespace-nowrap cursor-pointer border ${
                      filter === f
                        ? 'bg-[#1a191b] text-[#71d083] border-[#2d5736] font-medium'
                        : 'bg-[#1a191b]/40 text-[#7c7a85] hover:text-[#eeeef0] border-[#2b292d]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Grid */}
            {isLoading ? (
              <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#71d083] border-t-transparent"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 bg-[#121113] border border-[#2b292d] rounded-[6px] p-8">
                <Users size={36} className="text-[#7c7a85] mx-auto mb-3" />
                <p className="font-sans font-medium text-sm text-[#e5e5e5] mb-1">No se encontraron usuarios</p>
                <p className="text-[#7c7a85] text-xs font-sans mt-1">Prueba con otro término de búsqueda o rol.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUsers.map(user => {
                  const userId = user._id || user.id;
                  const isActive = user.isActive !== false;
                  return (
                    <div 
                      key={userId} 
                      className="bg-[#121113] border border-[#2b292d] hover:border-[#3c393f] transition-all rounded-[6px] p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-sans font-medium tracking-[-0.025em] text-base text-[#e5e5e5] leading-tight">{user.name}</h3>
                            <span className={`inline-block mt-1.5 ${getRoleBadge(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                          <span className={isActive ? 'tag-depot-green' : 'tag-depot-danger'}>
                            {isActive ? '● Activo' : '○ Inactivo'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-[#7c7a85] space-y-2 mb-4 py-3 border-y border-[#2b292d]">
                          <div className="flex items-center gap-2">
                            <Mail size={13} className="text-[#b5b2bc]" />
                            <span className="truncate text-[#eeeef0]">{user.email}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span>Visitas registradas:</span>
                            <span className="font-sans tabular-nums font-semibold text-[#71d083]">{user.totalVisits ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedUser(user)} 
                          className="flex-1 btn-depot-outline !py-2 text-xs flex justify-center items-center gap-1.5"
                        >
                          <Eye size={13} /> Ver Ficha
                        </button>
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id: userId, isActive: !isActive })}
                          className={`px-3 py-2 rounded-[6px] text-xs font-sans border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-[#1b2a1e] hover:bg-[#243d29] text-[#71d083] border-[#2d5736]'
                          }`}
                        >
                          {isActive ? 'Bloquear' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Web Contact Messages Inbox */
          <div className="space-y-4">
            {loadingMessages ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#71d083] border-t-transparent"></div>
              </div>
            ) : messagesData.length === 0 ? (
              <div className="text-center py-16 bg-[#121113] border border-[#2b292d] rounded-[6px] p-8">
                <MessageSquare size={36} className="text-[#7c7a85] mx-auto mb-3" />
                <p className="font-sans font-medium text-sm text-[#e5e5e5] mb-1">No hay mensajes en el buzón web</p>
                <p className="text-[#7c7a85] text-xs font-sans mt-1">Los mensajes enviados desde la sección «Cómo llegar» aparecerán aquí.</p>
              </div>
            ) : (
              messagesData.map((msg) => (
                <div key={msg.id} className="bg-[#121113] border border-[#2b292d] rounded-[6px] p-5 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        msg.status === 'UNREAD'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-[#1b2a1e] text-[#71d083] border border-[#2d5736]'
                      }`}>
                        {msg.status === 'UNREAD' ? 'Nuevo' : 'Atendido'}
                      </span>
                      <h3 className="text-sm font-semibold text-[#eeeef0]">{msg.subject}</h3>
                      <span className="text-xs text-[#7c7a85] tabular-nums">
                        {new Date(msg.createdAt).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <p className="text-xs text-[#A3A096]">
                      De: <strong className="text-[#eeeef0]">{msg.name}</strong> ({msg.email})
                    </p>
                    <p className="text-xs text-[#d6d3cd] bg-[#1a191b] border border-[#2b292d] rounded p-3 leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                  <div className="flex sm:flex-col justify-end gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)} - Punto Fino`}
                      className="btn-depot-outline !py-2 !px-3 text-xs flex items-center justify-center gap-1.5"
                    >
                      <Mail size={13} /> Responder por correo
                    </a>
                    {msg.status === 'UNREAD' && (
                      <button
                        onClick={() => updateMessageStatusMutation.mutate({ id: msg.id, status: 'READ' })}
                        className="btn-depot-primary !py-2 !px-3 text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={13} /> Marcar atendido
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* User Details Modal */}
        <Modal 
          isOpen={!!selectedUser} 
          onClose={() => setSelectedUser(null)} 
          title="Ficha del Usuario"
        >
          {selectedUser && (
            <div className="space-y-5">
              <div className="pb-4 border-b border-[#2b292d]">
                <h2 className="font-sans font-semibold text-lg text-[#e5e5e5]">{selectedUser.name}</h2>
                <span className={`inline-block mt-1 ${getRoleBadge(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="bg-[#1a191b] border border-[#2b292d] p-3 rounded-[6px]">
                  <p className="text-[#7c7a85] text-[11px] mb-1">Correo Electrónico</p>
                  <p className="text-[#eeeef0] break-all font-medium">{selectedUser.email}</p>
                </div>
                <div className="bg-[#1a191b] border border-[#2b292d] p-3 rounded-[6px]">
                  <p className="text-[#7c7a85] text-[11px] mb-1">Visitas Completadas</p>
                  <p className="text-[#71d083] tabular-nums font-bold text-sm">{selectedUser.totalVisits ?? 0}</p>
                </div>
                <div className="bg-[#1a191b] border border-[#2b292d] p-3 rounded-[6px]">
                  <p className="text-[#7c7a85] text-[11px] mb-1">Fecha de Registro</p>
                  <p className="text-[#eeeef0] tabular-nums">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('es-CO') : 'Reciente'}</p>
                </div>
                <div className="bg-[#1a191b] border border-[#2b292d] p-3 rounded-[6px]">
                  <p className="text-[#7c7a85] text-[11px] mb-1">Estado de Cuenta</p>
                  <p className={`font-medium ${selectedUser.isActive !== false ? 'text-[#71d083]' : 'text-rose-400'}`}>
                    {selectedUser.isActive !== false ? '● Activa y Verificada' : '○ Desactivada'}
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-[#2b292d] flex justify-end">
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="btn-depot-primary !py-2 !px-5"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}
