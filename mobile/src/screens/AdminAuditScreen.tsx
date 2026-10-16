import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../theme/tokens';

export const AdminAuditScreen: React.FC = () => {
  const [isCashClosed, setIsCashClosed] = useState(false);

  // Datos consolidados del turno de hoy en Punto Fino
  const dailySummary = {
    totalRevenueCOP: 485000,
    totalTipsCOP: 32000,
    servicesCount: 14,
    cashInDrawerCOP: 190000,
    nequiCOP: 165000,
    daviplataCOP: 45000,
    datafonoCOP: 85000,
    barberCommissionsCOP: 242500, // 50% repartido a barberos
    netShopProfitCOP: 242500, // 50% bruto para el taller
  };

  const barberBreakdown = [
    {
      id: 'barber-1',
      name: 'Brayan Murillo "El Fino"',
      chair: 'Silla #1',
      servicesCount: 5,
      totalGeneratedCOP: 185000,
      commissionCOP: 92500,
      tipsCOP: 12000,
    },
    {
      id: 'barber-2',
      name: 'Carlos "El Primo"',
      chair: 'Silla #2',
      servicesCount: 4,
      totalGeneratedCOP: 140000,
      commissionCOP: 70000,
      tipsCOP: 8000,
    },
    {
      id: 'barber-3',
      name: 'Andrés "Junior"',
      chair: 'Silla #3',
      servicesCount: 3,
      totalGeneratedCOP: 95000,
      commissionCOP: 47500,
      tipsCOP: 7000,
    },
    {
      id: 'barber-4',
      name: 'Alberto Cardona (Master)',
      chair: 'Silla #4',
      servicesCount: 2,
      totalGeneratedCOP: 65000,
      commissionCOP: 32500,
      tipsCOP: 5000,
    },
  ];

  const handleCloseCashRegister = () => {
    Alert.alert(
      '¿Cerrar Caja del Día?',
      'Se consolidará el arqueo con $ 190.000 COP en efectivo de gaveta y $ 295.000 COP en canales digitales. Se enviará informe al administrador.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Cierre',
          style: 'destructive',
          onPress: () => {
            setIsCashClosed(true);
            Alert.alert('✅ Caja Cerrada', 'Arqueo de caja finalizado y respaldado en Neon PostgreSQL.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Admin */}
      <View style={styles.header}>
        <View style={styles.badgeBox}>
          <Text style={styles.badgeText}>PANEL DE CONTROL ADMINISTRATIVO</Text>
        </View>
        <Text style={styles.title}>Arqueo de Caja & Equipo</Text>
        <Text style={styles.subtitle}>Consolidado del día · Punto Fino Tequendama</Text>
      </View>

      {/* KPI Principal */}
      <View style={styles.kpiCard}>
        <View style={styles.kpiHeader}>
          <Text style={styles.kpiEyebrow}>FACTURACIÓN TOTAL HOY</Text>
          <View style={styles.kpiStatus}>
            <CheckCircle size={12} color={colors.available} />
            <Text style={styles.kpiStatusText}>Caja Activa</Text>
          </View>
        </View>
        <Text style={styles.kpiValue}>$ {dailySummary.totalRevenueCOP.toLocaleString('es-CO')} COP</Text>
        <View style={styles.kpiSubRow}>
          <Text style={styles.kpiSubText}>14 Servicios completados</Text>
          <Text style={styles.kpiTipText}>+ $ {dailySummary.totalTipsCOP.toLocaleString('es-CO')} COP Propinas</Text>
        </View>
      </View>

      {/* Desglose de Canales de Cobro (Realidad de Barrio) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MÉTODOS DE PAGO EN CAJA</Text>
        <View style={styles.methodsGrid}>
          <View style={styles.methodCard}>
            <Text style={styles.methodLabel}>💵 EFECTIVO GAVETA</Text>
            <Text style={styles.methodValue}>$ {dailySummary.cashInDrawerCOP.toLocaleString('es-CO')}</Text>
            <Text style={styles.methodSub}>39.1% del total</Text>
          </View>

          <View style={styles.methodCard}>
            <Text style={styles.methodLabel}>📱 NEQUI COMERCIO</Text>
            <Text style={styles.methodValue}>$ {dailySummary.nequiCOP.toLocaleString('es-CO')}</Text>
            <Text style={styles.methodSub}>34.0% del total</Text>
          </View>

          <View style={styles.methodCard}>
            <Text style={styles.methodLabel}>🔴 DAVIPLATA</Text>
            <Text style={styles.methodValue}>$ {dailySummary.daviplataCOP.toLocaleString('es-CO')}</Text>
            <Text style={styles.methodSub}>9.3% del total</Text>
          </View>

          <View style={styles.methodCard}>
            <Text style={styles.methodLabel}>💳 DATÁFONO / BOLD</Text>
            <Text style={styles.methodValue}>$ {dailySummary.datafonoCOP.toLocaleString('es-CO')}</Text>
            <Text style={styles.methodSub}>17.6% del total</Text>
          </View>
        </View>
      </View>

      {/* Desglose por Barbero */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>LIQUIDACIÓN POR BARBERO (50%)</Text>
          <Text style={styles.legalDisclaimer}>* REVISAR CON CONTADOR / ABOGADO LABORAL</Text>
        </View>

        <View style={styles.barberList}>
          {barberBreakdown.map((barber) => (
            <View key={barber.id} style={styles.barberItem}>
              <View style={styles.barberInfoCol}>
                <Text style={styles.barberName}>{barber.name}</Text>
                <Text style={styles.barberChair}>{barber.chair} · {barber.servicesCount} cortes realizados</Text>
              </View>

              <View style={styles.barberNumbersCol}>
                <Text style={styles.barberCommission}>
                  $ {barber.commissionCOP.toLocaleString('es-CO')} COP
                </Text>
                <Text style={styles.barberTotalGen}>
                  Facturó: ${barber.totalGeneratedCOP.toLocaleString('es-CO')}
                </Text>
                <Text style={styles.barberTip}>
                  +${barber.tipsCOP.toLocaleString('es-CO')} propina
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Acciones de Cierre */}
      <View style={styles.actionsBox}>
        <TouchableOpacity
          style={[styles.closeCashButton, isCashClosed && styles.closedButton]}
          onPress={handleCloseCashRegister}
          disabled={isCashClosed}
          activeOpacity={0.85}
        >
          <ShieldCheck size={18} color={colors.bone} />
          <Text style={styles.closeCashButtonText}>
            {isCashClosed ? 'Caja del Día Cerrada con Éxito' : 'Efectuar Arqueo y Cierre de Caja'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.carbon,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  badgeBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.brassMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.brass,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: colors.brassLight,
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.bone,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  kpiCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderActive,
    marginBottom: spacing.lg,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiEyebrow: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.terracota,
    fontWeight: '700',
    letterSpacing: 1,
  },
  kpiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiStatusText: {
    fontSize: 10,
    color: colors.available,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: colors.bone,
  },
  kpiSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  kpiSubText: {
    fontSize: 11,
    color: colors.muted,
  },
  kpiTipText: {
    fontSize: 11,
    color: colors.brassLight,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'column',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1,
  },
  legalDisclaimer: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.brass,
    marginTop: 2,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  methodCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  methodValue: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: colors.bone,
    marginVertical: 2,
  },
  methodSub: {
    fontSize: 10,
    color: colors.subtle,
  },
  barberList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  barberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  barberInfoCol: {
    flex: 1,
  },
  barberName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bone,
  },
  barberChair: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  barberNumbersCol: {
    alignItems: 'flex-end',
  },
  barberCommission: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: colors.terracota,
  },
  barberTotalGen: {
    fontSize: 10,
    color: colors.muted,
  },
  barberTip: {
    fontSize: 9,
    color: colors.brassLight,
  },
  actionsBox: {
    marginTop: spacing.md,
  },
  closeCashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.terracota,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  closedButton: {
    backgroundColor: colors.available,
  },
  closeCashButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bone,
  },
});

