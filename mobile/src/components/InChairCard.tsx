import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Scissors, Clock, User, AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { CachedAppointment } from '../storage/localDatabase';

interface InChairCardProps {
  appointment: CachedAppointment;
  onFinishCheckout: (appointment: CachedAppointment) => void;
  onEditFormula: (appointment: CachedAppointment) => void;
}

export const InChairCard: React.FC<InChairCardProps> = ({
  appointment,
  onFinishCheckout,
  onEditFormula,
}) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(24);

  useEffect(() => {
    // Calcular minutos transcurridos
    const start = new Date(appointment.startTime).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const diffMins = Math.max(1, Math.floor((now - start) / 60000));
      setElapsedMinutes(diffMins);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [appointment.startTime]);

  return (
    <View style={styles.cardContainer}>
      {/* Encabezado: Estado En Silla & Timer */}
      <View style={styles.headerRow}>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTagText}>EN SILLA AHORA</Text>
        </View>
        <View style={styles.timerTag}>
          <Clock size={12} color={colors.muted} />
          <Text style={styles.timerText}>Lleva {elapsedMinutes} min</Text>
        </View>
      </View>

      {/* Datos del Cliente y Servicio */}
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{appointment.clientName}</Text>
        <Text style={styles.serviceName}>{appointment.serviceNames}</Text>
        <Text style={styles.priceCOP}>$ {appointment.totalPriceCOP.toLocaleString('es-CO')} COP</Text>
      </View>

      {/* Ficha Técnica Privada del Barbero */}
      <TouchableOpacity 
        style={styles.formulaBox}
        onPress={() => onEditFormula(appointment)}
        activeOpacity={0.8}
      >
        <View style={styles.formulaHeader}>
          <Text style={styles.formulaTitle}>Fórmula técnica del cliente:</Text>
          <Text style={styles.formulaEditBtn}>Editar ✎</Text>
        </View>
        <Text style={styles.formulaText} numberOfLines={3}>
          {appointment.technicalNotes || 'Sin notas previas. Tocá para registrar peine guía y cerquillo.'}
        </Text>
      </TouchableOpacity>

      {/* Botón de Acción Principal: Cobrar en Silla */}
      <TouchableOpacity
        style={styles.checkoutBtn}
        onPress={() => onFinishCheckout(appointment)}
        activeOpacity={0.85}
      >
        <Scissors size={18} color="#FFFFFF" />
        <Text style={styles.checkoutBtnText}>FINALIZAR SERVICIO & COBRAR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderActive,
    shadowColor: colors.terracota,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.terracota,
  },
  liveTagText: {
    color: colors.terracota,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  clientInfo: {
    marginTop: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.bone,
  },
  serviceName: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  priceCOP: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.terracota,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  formulaBox: {
    backgroundColor: colors.carbon,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 4,
  },
  formulaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  formulaTitle: {
    color: colors.brass,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  formulaEditBtn: {
    color: colors.brassLight,
    fontSize: 10,
  },
  formulaText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  checkoutBtn: {
    backgroundColor: colors.terracota,
    borderRadius: radius.sm,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
