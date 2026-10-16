import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { BarberHomeScreen } from './src/screens/BarberHomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { AdminAuditScreen } from './src/screens/AdminAuditScreen';
import { colors } from './src/theme/tokens';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'admin'>('home');

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.carbon} />
        <LoginScreen
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.carbon} />
      
      {/* Selector de Vista (Para Administrador / Barberos) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'home' && styles.tabButtonTextActive]}>
            Silla & Turnos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'admin' && styles.tabButtonActive]}
          onPress={() => setActiveTab('admin')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'admin' && styles.tabButtonTextActive]}>
            Arqueo & Caja
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setCurrentUser(null)}
        >
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'home' ? <BarberHomeScreen /> : <AdminAuditScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.carbon,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.elevated,
  },
  tabButtonActive: {
    backgroundColor: colors.terracota,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  tabButtonTextActive: {
    color: colors.bone,
  },
  logoutButton: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 11,
    color: colors.subtle,
  },
  content: {
    flex: 1,
  },
});
