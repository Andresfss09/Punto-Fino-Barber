/**
 * Gestor de Base de Datos Local y Cola de Sincronización Offline (SQLite)
 * Diseñado para la realidad operativa de Cali: cortes de energía o caídas de internet en el local.
 */

export interface CachedAppointment {
  id: string;
  bookingCode: string;
  clientName: string;
  clientPhone: string;
  serviceNames: string;
  totalPriceCOP: number;
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isWalkIn: boolean;
  startTime: string;
  technicalNotes?: string;
  synced: boolean;
}

export interface SyncAction {
  id: string;
  type: 'WALK_IN' | 'CHECKOUT' | 'UPDATE_NOTES' | 'UPDATE_STATUS';
  payload: any;
  createdAt: string;
  attempts: number;
}

class LocalDatabaseManager {
  private appointments: CachedAppointment[] = [];
  private syncQueue: SyncAction[] = [];
  private clientNotes: Record<string, string> = {};

  constructor() {
    this.initDefaultSeed();
  }

  private initDefaultSeed() {
    // Datos en caché inicial para arrancar de pie
    this.appointments = [
      {
        id: 'apt-offline-1',
        bookingCode: 'PF-1042',
        clientName: 'Andrés Felipe Caicedo',
        clientPhone: '+573158294012',
        serviceNames: 'Corte Clásico + Barba Vaporizada',
        totalPriceCOP: 45000,
        status: 'IN_PROGRESS',
        isWalkIn: false,
        startTime: new Date().toISOString(),
        technicalNotes: 'Fade #0.5 en sienes, cerquillo recto con navaja, toalla caliente.',
        synced: true,
      },
      {
        id: 'apt-offline-2',
        bookingCode: 'PF-2081',
        clientName: 'Mateo Holguín (Web)',
        clientPhone: '+573157894210',
        serviceNames: 'Corte Clásico Punto Fino',
        totalPriceCOP: 25000,
        status: 'CONFIRMED',
        isWalkIn: false,
        startTime: new Date(Date.now() + 45 * 60000).toISOString(),
        technicalNotes: 'Lleva foto de referencia para degradado medio.',
        synced: true,
      },
    ];

    this.clientNotes['client-1'] = 'Fade #0.5 en sienes, cerquillo recto con navaja, piel sensible en cuello.';
  }

  // 1. Obtener citas cacheadas
  getCachedAppointments(): CachedAppointment[] {
    return [...this.appointments];
  }

  // 2. Cachear citas descargadas del servidor
  setCachedAppointments(apts: CachedAppointment[]) {
    this.appointments = apts.map(a => ({ ...a, synced: true }));
  }

  // 3. Registrar Walk-in en Modo Offline
  addWalkInOffline(name: string, serviceName: string, priceCOP: number, notes?: string): CachedAppointment {
    const localId = `local_walkin_${Date.now()}`;
    const randomCode = `PF-W${Math.floor(100 + Math.random() * 900)}`;

    const newApt: CachedAppointment = {
      id: localId,
      bookingCode: randomCode,
      clientName: `${name} (Walk-in)`,
      clientPhone: '+573000000000',
      serviceNames: serviceName,
      totalPriceCOP: priceCOP,
      status: 'IN_PROGRESS',
      isWalkIn: true,
      startTime: new Date().toISOString(),
      technicalNotes: notes || 'Cliente sin cita registrado en local.',
      synced: false,
    };

    this.appointments.unshift(newApt);

    // Encolar para sincronización
    this.syncQueue.push({
      id: `sync_${Date.now()}`,
      type: 'WALK_IN',
      payload: {
        clientName: name,
        serviceNames: serviceName,
        priceCOP,
        barberNotes: notes,
      },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    return newApt;
  }

  // 4. Cobrar en Silla en Modo Offline
  checkoutOffline(appointmentId: string, paymentMethod: string, tipsCOP: number = 0, notes?: string) {
    const apt = this.appointments.find(a => a.id === appointmentId);
    if (apt) {
      apt.status = 'COMPLETED';
      apt.synced = false;
      if (notes) apt.technicalNotes = notes;
    }

    this.syncQueue.push({
      id: `sync_${Date.now()}`,
      type: 'CHECKOUT',
      payload: {
        appointmentId,
        paymentMethod,
        tipsCOP,
        barberNotes: notes,
      },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
  }

  // 5. Guardar fórmula técnica de corte
  saveTechnicalNotes(clientId: string, notes: string) {
    this.clientNotes[clientId] = notes;
    this.syncQueue.push({
      id: `sync_${Date.now()}`,
      type: 'UPDATE_NOTES',
      payload: { clientId, technicalNotes: notes },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
  }

  getTechnicalNotes(clientId: string): string {
    return this.clientNotes[clientId] || 'Sin notas registradas aún.';
  }

  // 6. Conteo de acciones pendientes por sincronizar
  getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  // 7. Vaciar y sincronizar cola hacia el backend cuando vuelve internet
  async drainSyncQueue(apiClient: any): Promise<{ syncedCount: number; errors: number }> {
    if (this.syncQueue.length === 0) return { syncedCount: 0, errors: 0 };

    let syncedCount = 0;
    let errors = 0;
    const remainingQueue: SyncAction[] = [];

    for (const action of this.syncQueue) {
      try {
        if (action.type === 'WALK_IN') {
          await apiClient.post('/appointments/walk-in', action.payload);
        } else if (action.type === 'CHECKOUT') {
          if (!action.payload.appointmentId.startsWith('local_')) {
            await apiClient.post(`/appointments/${action.payload.appointmentId}/checkout`, action.payload);
          }
        } else if (action.type === 'UPDATE_NOTES') {
          await apiClient.put(`/users/${action.payload.clientId}/technical-notes`, {
            technicalNotes: action.payload.technicalNotes,
          });
        }
        syncedCount++;
      } catch (err) {
        errors++;
        action.attempts++;
        remainingQueue.push(action);
      }
    }

    this.syncQueue = remainingQueue;
    return { syncedCount, errors };
  }
}

export const localDB = new LocalDatabaseManager();
