import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Wifi, WifiOff, Plus, Clock, Award, Shield, CheckCircle } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme/tokens';
import { InChairCard } from '../components/InChairCard';
import { WalkInModal } from '../components/WalkInModal';
import { PosCheckoutModal } from '../components/PosCheckoutModal';
import { localDB, CachedAppointment } from '../storage/localDatabase';
import { apiClient } from '../api/client';

export const BarberHomeScreen: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [appointments, setAppointments] = useState<CachedAppointment[]>([]);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [selectedForCheckout, setSelectedForCheckout] = useState<CachedAppointment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, lastSync: 'Al día' });

  // Cargar citas iniciales
  const loadAppointments = () => {
    const list = localDB.getCachedAppointments();
    setAppointments(list);
    setSyncStatus({
      pending: localDB.getPendingSyncCount(),
      lastSync: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    });
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isOnline) {
      try {
        const res = await apiClient.get('/barbers/me/daily-summary');
        if (res.data?.success && res.data?.appointments) {
          // Actualizar caché
          localDB.setCachedAppointments(res.data.appointments);
          loadAppointments();
        }
      } catch (err) {
        console.warn('Error refrescando desde API, usando datos locales.');
      }
    }
    setRefreshing(false);
  };

  // Manejar creación de Walk-in
  const handleWalkInSubmit = (name: string, serviceName: string, priceCOP: number, notes?: string) => {
    localDB.addWalkInOffline(name, serviceName, priceCOP, notes);
    loadAppointments();
    Alert.alert('✅ Cliente en Silla', `${name} ha sido sentado en la silla. El temporizador comenzó.`);
  };

  // Manejar Cobro en Silla
  const handleConfirmCheckout = (appointmentId: string, paymentMethod: string, tipsCOP: number, barberNotes?: string) => {
    localDB.checkoutOffline(appointmentId, paymentMethod, tipsCOP, barberNotes);
    loadAppointments();
    Alert.alert('💵 Turno Cobrado', `Cobro registrado vía ${paymentMethod}. Ingreso sumado a caja y comisión del barbero.`);
  };

  // Forzar sincronización manual
  const handleForceSync = async () => {
    if (!isOnline) {
      Alert.alert('Modo Offline', 'Estás en modo sin conexión. Conéctate a la red del local para sincronizar con Neon DB.');
      return;
    }

    const res = await localDB.drainSyncQueue(apiClient);
    setSyncStatus({
      pending: localDB.getPendingSyncCount(),
      lastSync: 'Recién sincronizado',
    });
    Alert.alert('Sincronización Completa', `${res.syncedCount} operaciones sincronizadas con Neon PostgreSQL.`);
  };

  const inChairAppointment = appointments.find(a => a.status === 'IN_PROGRESS');
  const upcomingAppointments = appointments.filter(a => a.status === 'CONFIRMED');
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED');

  const totalEarnedCOP = completedAppointments.reduce((sum, a) => sum + a.totalPriceCOP, 0);
  const commissionCOP = Math.round(totalEarnedCOP * 0.5);

  return (
    <View style={styles.container}>
      {/* Header del Barbero */}
      <View style={styles.header}>
        <View style={styles.barberProfile}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarInitial}>BM</Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.barberName}>Juan David</Text>
              <Text style={styles.nickname}>"Admin & Barbero"</Text>
            </View>
            <Text style={styles.chairLabel}>Silla #1 · Santiago de Cali (Villacolombia)</Text>
          </View>
        </View>

        {/* Toggle de Red / Modo Offline */}
        <TouchableOpacity
          style={[styles.networkBadge, !isOnline && styles.networkBadgeOffline]}
          onPress={() => setIsOnline(!isOnline)}
          activeOpacity={0.8}
        >
          {isOnline ? <Wifi size={12} color={colors.available} /> : <WifiOff size={12} color={colors.offline} />}
          <Text style={[styles.networkBadgeText, !isOnline && styles.networkBadgeTextOffline]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          {syncStatus.pending > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{syncStatus.pending}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.terracota} />}
      >
        {/* Banner de Ganancias & Comisión del Día */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View>
              <Text style={styles.earningsEyebrow}>LIQUIDACIÓN HOY (50%)</Text>
              <Text style={styles.earningsValue}>$ {commissionCOP.toLocaleString('es-CO')} COP</Text>
              <Text style={styles.earningsLegal}>* REVISAR CON CONTADOR / ABOGADO LABORAL</Text>
            </View>
            <View style={styles.statsBadge}>
              <Text style={styles.statsNumber}>{completedAppointments.length}</Text>
              <Text style={styles.statsLabel}>cortes listos</Text>
            </View>
          </View>
        </View>

        {/* Cita Activa En Silla */}
        {inChairAppointment ? (
          <InChairCard
            appointment={inChairAppointment}
            onFinishCheckout={(apt) => setSelectedForCheckout(apt)}
            onEditFormula={(apt) => Alert.alert('Fórmula de Corte', apt.technicalNotes || 'Sin notas registradas')}
          />
        ) : (
          <View style={styles.emptyChairCard}>
            <Text style={styles.emptyChairTitle}>SILLA LIBRE AHORA</Text>
            <Text style={styles.emptyChairSubtitle}>No hay ningún cliente sentado en este momento.</Text>
            <TouchableOpacity style={styles.emptyWalkInBtn} onPress={() => setShowWalkIn(true)}>
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.emptyWalkInBtnText}>Sentar Cliente Walk-in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Acciones Rápidas del Barbero */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowWalkIn(true)}
            activeOpacity={0.8}
          >
            <Plus size={18} color={colors.terracota} />
            <Text style={styles.actionBtnTitle}>+ Cliente Walk-in</Text>
            <Text style={styles.actionBtnSubtitle}>Llegó sin cita previa (2 toques)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert('Pausa de 20 min', 'Se han bloqueado 20 minutos en la web pública para descanso.')}
            activeOpacity={0.8}
          >
            <Clock size={18} color={colors.brass} />
            <Text style={styles.actionBtnTitle}>Pausa / Descanso</Text>
            <Text style={styles.actionBtnSubtitle}>Bloquear 20 min en la agenda</Text>
          </TouchableOpacity>
        </View>

        {/* Cola de Sincronización */}
        {syncStatus.pending > 0 && (
          <TouchableOpacity style={styles.syncAlert} onPress={handleForceSync} activeOpacity={0.8}>
            <View style={styles.syncAlertContent}>
              <Text style={styles.syncAlertTitle}>
                {syncStatus.pending} operaciones pendientes por enviar a Neon DB
              </Text>
              <Text style={styles.syncAlertSubtitle}>
                Tocá aquí para forzar sincronización ahora mismo.
              </Text>
            </View>
            <CheckCircle size={16} color={colors.available} />
          </TouchableOpacity>
        )}

        {/* Timeline del Día (Próximas Citas) */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>AGENDA DE HOY ({upcomingAppointments.length} PENDIENTES)</Text>
            <Text style={styles.timelineDate}>Cali · Villacolombia</Text>
          </View>

          {upcomingAppointments.length === 0 ? (
            <Text style={styles.noAppointmentsText}>No hay más citas programadas por hoy.</Text>
          ) : (
            upcomingAppointments.map((apt) => (
              <View key={apt.id} style={styles.appointmentItem}>
                <View>
                  <View style={styles.aptTimeRow}>
                    <Text style={styles.aptTime}>
                      {new Date(apt.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {apt.isWalkIn && (
                      <View style={styles.walkInPill}>
                        <Text style={styles.walkInPillText}>Sin Cita</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.aptClientName}>{apt.clientName}</Text>
                  <Text style={styles.aptServiceName}>{apt.serviceNames}</Text>
                </View>

                <View style={styles.aptPriceBox}>
                  <Text style={styles.aptPrice}>$ {apt.totalPriceCOP.toLocaleString('es-CO')}</Text>
                  <Text style={styles.aptStatus}>Confirmado</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modales Interactivos */}
      <WalkInModal
        visible={showWalkIn}
        onClose={() => setShowWalkIn(false)}
        onSubmit={handleWalkInSubmit}
      />

      <PosCheckoutModal
        visible={Boolean(selectedForCheckout)}
        appointment={selectedForCheckout}
        onClose={() => setSelectedForCheckout(null)}
        onConfirmCheckout={handleConfirmCheckout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.carbon,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barberProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.terracotaMuted,
    borderWidth: 1.5,
    borderColor: colors.terracota,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.bone,
    fontWeight: '800',
    fontSize: 13,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barberName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.bone,
  },
  nickname: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.terracota,
  },
  chairLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  networkBadgeOffline: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  networkBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.available,
  },
  networkBadgeTextOffline: {
    color: colors.offline,
  },
  pendingBadge: {
    backgroundColor: colors.offline,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  earningsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsEyebrow: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.brass,
    fontWeight: '800',
    letterSpacing: 1,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.bone,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  earningsLegal: {
    fontSize: 8,
    color: colors.subtle,
    fontStyle: 'italic',
    marginTop: 2,
  },
  statsBadge: {
    alignItems: 'center',
    backgroundColor: colors.carbon,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.terracota,
    fontFamily: 'monospace',
  },
  statsLabel: {
    fontSize: 9,
    color: colors.muted,
  },
  emptyChairCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  emptyChairTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.available,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  emptyChairSubtitle: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyWalkInBtn: {
    backgroundColor: colors.terracota,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  emptyWalkInBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  actionBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.bone,
    marginTop: 2,
  },
  actionBtnSubtitle: {
    fontSize: 10,
    color: colors.muted,
  },
  syncAlert: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncAlertContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  syncAlertTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.available,
  },
  syncAlertSubtitle: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  timelineSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  timelineTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineDate: {
    fontSize: 10,
    color: colors.subtle,
  },
  noAppointmentsText: {
    fontSize: 11,
    color: colors.muted,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  appointmentItem: {
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aptTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aptTime: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: colors.bone,
  },
  walkInPill: {
    backgroundColor: colors.brassMuted,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  walkInPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.brassLight,
  },
  aptClientName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bone,
    marginTop: 1,
  },
  aptServiceName: {
    fontSize: 10,
    color: colors.muted,
  },
  aptPriceBox: {
    alignItems: 'flex-end',
  },
  aptPrice: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: colors.terracota,
  },
  aptStatus: {
    fontSize: 9,
    color: colors.available,
  },
});

