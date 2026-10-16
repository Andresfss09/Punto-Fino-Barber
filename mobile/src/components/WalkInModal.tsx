import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { User, Scissors, X, Check } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme/tokens';

interface WalkInModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, serviceName: string, priceCOP: number, notes?: string) => void;
}

const PRESET_SERVICES = [
  { name: 'Corte Clásico Punto Fino', price: 25000, duration: 40 },
  { name: 'Ritual Barba con Vapor', price: 22000, duration: 35 },
  { name: 'Combo Completo (Corte + Barba)', price: 45000, duration: 75 },
  { name: 'Exfoliación & Masaje Facial', price: 20000, duration: 25 },
];

export const WalkInModal: React.FC<WalkInModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [selectedService, setSelectedService] = useState(PRESET_SERVICES[0]);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), selectedService.name, selectedService.price, notes.trim());
    setName('');
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>CLIENTE QUE LLEGA AL LOCAL</Text>
              <Text style={styles.title}>Registrar Walk-in (Sin Cita)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Nombre o Apodo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NOMBRE O APODO DEL CLIENTE *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: Don Carlos, El Mono, Mateo..."
              placeholderTextColor={colors.subtle}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          {/* Chips de Selección Rápida de Servicio */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SERVICIO A REALIZAR</Text>
            <View style={styles.chipsGrid}>
              {PRESET_SERVICES.map((serv) => {
                const isSelected = selectedService.name === serv.name;
                return (
                  <TouchableOpacity
                    key={serv.name}
                    style={[styles.serviceChip, isSelected && styles.serviceChipSelected]}
                    onPress={() => setSelectedService(serv)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.chipRow}>
                      <Text style={[styles.chipTitle, isSelected && styles.chipTitleSelected]}>
                        {serv.name}
                      </Text>
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.chipPrice, isSelected && styles.chipPriceSelected]}>
                      $ {serv.price.toLocaleString('es-CO')} COP · {serv.duration} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Nota rápida de corte */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>INDICACIÓN RÁPIDA (OPCIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Ej: Fade #1 lateral, no tocar arriba..."
              placeholderTextColor={colors.subtle}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Botón de Sentar en Silla */}
          <TouchableOpacity
            style={[styles.submitBtn, !name.trim() && styles.submitBtnDisabled]}
            onPress={handleConfirm}
            disabled={!name.trim()}
          >
            <Scissors size={16} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>SENTAR EN SILLA AHORA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.terracota,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.bone,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.bone,
    fontSize: 13,
  },
  textArea: {
    height: 50,
    textAlignVertical: 'top',
  },
  chipsGrid: {
    gap: 6,
  },
  serviceChip: {
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 8,
  },
  serviceChipSelected: {
    borderColor: colors.terracota,
    backgroundColor: colors.terracotaMuted,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bone,
  },
  chipTitleSelected: {
    color: colors.bone,
  },
  chipPrice: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  chipPriceSelected: {
    color: colors.terracota,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.terracota,
    borderRadius: radius.sm,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

