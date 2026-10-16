import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { DollarSign, Check, X, ShieldAlert } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme/tokens';
import { CachedAppointment } from '../storage/localDatabase';

interface PosCheckoutModalProps {
  visible: boolean;
  appointment: CachedAppointment | null;
  onClose: () => void;
  onConfirmCheckout: (appointmentId: string, paymentMethod: string, tipsCOP: number, barberNotes?: string) => void;
}

const PAYMENT_METHODS = [
  { id: 'NEQUI', label: 'Nequi', icon: '📱' },
  { id: 'EFECTIVO', label: 'Efectivo', icon: '💵' },
  { id: 'DAVIPLATA', label: 'Daviplata', icon: '📲' },
  { id: 'DATAFONO', label: 'Datáfono', icon: '💳' },
  { id: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia', icon: '🏦' },
];

const TIP_PRESETS = [0, 2000, 5000, 10000];

export const PosCheckoutModal: React.FC<PosCheckoutModalProps> = ({
  visible,
  appointment,
  onClose,
  onConfirmCheckout,
}) => {
  if (!appointment) return null;

  const [paymentMethod, setPaymentMethod] = useState('NEQUI');
  const [tip, setTip] = useState(5000);
  const [cashReceived, setCashReceived] = useState('50000');
  const [notes, setNotes] = useState(appointment.technicalNotes || '');

  const totalServicesCOP = appointment.totalPriceCOP;
  const totalCollectedCOP = totalServicesCOP + tip;
  const commissionEarnedCOP = Math.round(totalServicesCOP * 0.5); // 50% honorarios

  const cashNum = parseInt(cashReceived.replace(/\D/g, ''), 10) || totalCollectedCOP;
  const changeCOP = Math.max(0, cashNum - totalCollectedCOP);

  const handleFinish = () => {
    onConfirmCheckout(appointment.id, paymentMethod, tip, notes);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Encabezado */}
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>COBRO EN SILLA · POS MÓVIL</Text>
                <Text style={styles.title}>Cerrar y Cobrar Turno</Text>
                <Text style={styles.subtitle}>{appointment.clientName} · {appointment.bookingCode}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Método de Pago */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MÉTODO DE PAGO</Text>
              <View style={styles.paymentGrid}>
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[styles.paymentBtn, isSelected && styles.paymentBtnSelected]}
                      onPress={() => setPaymentMethod(pm.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.paymentIcon}>{pm.icon}</Text>
                      <Text style={[styles.paymentLabel, isSelected && styles.paymentLabelSelected]}>
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Calculadora de Vueltas para Efectivo */}
            {paymentMethod === 'EFECTIVO' && (
              <View style={styles.cashBox}>
                <Text style={styles.sectionLabel}>PAGO CON BILLETE (VUELTAS)</Text>
                <View style={styles.cashRow}>
                  <TextInput
                    style={styles.cashInput}
                    keyboardType="numeric"
                    value={cashReceived}
                    onChangeText={setCashReceived}
                    placeholder="50000"
                    placeholderTextColor={colors.subtle}
                  />
                  <View style={styles.changeDisplay}>
                    <Text style={styles.changeLabel}>Vueltas:</Text>
                    <Text style={styles.changeValue}>$ {changeCOP.toLocaleString('es-CO')} COP</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Propinas para el Barbero */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PROPINA VOLUNTARIA DEL CLIENTE</Text>
              <View style={styles.tipsRow}>
                {TIP_PRESETS.map((p) => {
                  const isSelected = tip === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.tipChip, isSelected && styles.tipChipSelected]}
                      onPress={() => setTip(p)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tipChipText, isSelected && styles.tipChipTextSelected]}>
                        {p === 0 ? 'Sin propina' : `$ ${p.toLocaleString('es-CO')}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Resumen de Liquidación */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Servicios:</Text>
                <Text style={styles.summaryVal}>$ {totalServicesCOP.toLocaleString('es-CO')} COP</Text>
              </View>
              {tip > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Propina (100% Barbero):</Text>
                  <Text style={styles.summaryVal}>+ $ {tip.toLocaleString('es-CO')} COP</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.totalLabel}>TOTAL A COBRAR:</Text>
                <Text style={styles.totalValue}>$ {totalCollectedCOP.toLocaleString('es-CO')} COP</Text>
              </View>

              <View style={styles.commissionBanner}>
                <Text style={styles.commissionTitle}>
                  Tu comisión estimada hoy: <Text style={styles.commissionHighlight}>$ {commissionEarnedCOP.toLocaleString('es-CO')} COP</Text>
                </Text>
                <Text style={styles.commissionLegal}>
                  * REVISAR CON CONTADOR / ABOGADO LABORAL: Honorarios 50%
                </Text>
              </View>
            </View>

            {/* Botón de Confirmación */}
            <TouchableOpacity style={styles.confirmBtn} onPress={handleFinish} activeOpacity={0.85}>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>COBRAR & LIBERAR SILLA</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.terracota,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.bone,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  closeBtn: {
    padding: 4,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentBtn: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  paymentBtnSelected: {
    borderColor: colors.terracota,
    backgroundColor: colors.terracotaMuted,
  },
  paymentIcon: {
    fontSize: 18,
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bone,
  },
  paymentLabelSelected: {
    color: colors.terracota,
  },
  cashBox: {
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 6,
  },
  cashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cashInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    color: colors.bone,
    fontSize: 14,
    fontFamily: 'monospace',
    width: 120,
  },
  changeDisplay: {
    alignItems: 'flex-end',
  },
  changeLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.available,
    fontFamily: 'monospace',
  },
  tipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tipChip: {
    flex: 1,
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tipChipSelected: {
    borderColor: colors.brass,
    backgroundColor: colors.brassMuted,
  },
  tipChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    fontFamily: 'monospace',
  },
  tipChipTextSelected: {
    color: colors.brassLight,
  },
  summaryBox: {
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  summaryVal: {
    fontSize: 11,
    color: colors.bone,
    fontFamily: 'monospace',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.bone,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.terracota,
    fontFamily: 'monospace',
  },
  commissionBanner: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  commissionTitle: {
    fontSize: 11,
    color: colors.muted,
  },
  commissionHighlight: {
    color: colors.brass,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  commissionLegal: {
    fontSize: 9,
    color: colors.subtle,
    fontStyle: 'italic',
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: colors.terracota,
    borderRadius: radius.sm,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
