# Fase 4: App Móvil Interna (React Native / Expo) para Barberos y Administrador

**PUNTO FINO — Corte & Cuidado Masculino**  
*Carrera 12 #53-51, Barrio Villacolombia, Santiago de Cali, Colombia*

---

## 1. Resumen Ejecutivo de la Fase 4

La **Fase 4** consolida la **Superficie 2** del ecosistema digital de Punto Fino: la **aplicación móvil nativa**, construida en **React Native con Expo SDK 52 y TypeScript**, diseñada **exclusivamente para el personal** (administrador y equipo de barberos).

> **REGLA CENTRAL DE PRODUCTO (CUMPLIDA):**
> Los clientes **NUNCA** usan ni descargan esta app móvil; reservan directamente en la web pública sin cuenta. Esta aplicación está optimizada para la operación física de taller: uso con una sola mano de pie junto al sillón hidráulico, botones de alto impacto visual, alto contraste contra luces de barbería y **resiliencia total ante caídas de internet (Offline-First)**.

---

## 2. Arquitectura Técnica y Capacidades Implementadas

### A. Resiliencia Offline-First (SQLite Local + Cola de Sincronización)
En Cali, la conectividad puede fluctuar durante la jornada. La app nunca bloquea la atención de un barbero:
- **Base de datos local SQLite (`mobile/src/storage/localDatabase.ts`)**: almacena la agenda del día, el estado del sillón y el catálogo.
- **Sync Queue transaccional**: cuando se registra un cliente sin cita (*Walk-in*) o se cobra un servicio sin conexión, la mutación se encola localmente (`PENDING_SYNC`).
- **Drenaje automático (`drainSyncQueue`)**: al restablecerse la red (o mediante pulsación manual del badge de red), la app sincroniza en lote con **Neon Serverless PostgreSQL**.

### B. Temporizador en Silla (*In-Chair Timer*)
- Tarjeta de atención activa con cronómetro en tiempo real (`minutos transcurridos`).
- Indicador pulsante `EN SILLA AHORA` y cálculo visual de avance respecto a la duración del servicio.
- Acceso inmediato a la **Ficha Técnica Privada del Cliente** (`technicalNotes`): fórmula de navaja, número de peines (#0.5, #1.5), toalla caliente y sensibilidad dérmica.

### C. Cliente *Walk-In* en 2 Toques
- Formulario ultra-rápido de 2 toques: nombre o apodo + servicio.
- Sienta al cliente de inmediato en la silla (`IN_PROGRESS`).
- Si hay conexión, bloquea automáticamente la franja en la web pública (`POST /api/appointments/walk-in`) para evitar que un cliente web reserve en ese mismo instante.

### D. Cobro POS en Silla
- Modal de liquidación inmediata al terminar el corte (`POST /api/appointments/:id/checkout`).
- Métodos de pago adaptados a la operación de Cali:
  - 💵 **Efectivo** (con calculadora interactiva de devuelta para billetes de $50k y $100k).
  - 📱 **Nequi** (cuenta del negocio).
  - 🔴 **Daviplata**.
  - 💳 **Datáfono Bold / Redeban**.
  - 🏦 **Transferencia Bancaria (Bancolombia)**.
- Selector de propinas voluntarias ($0, $2k, $5k, $10k) y productos Rolda/Nevera.
- **Liquidación de comisión del 50%**: calculada en tiempo real.
  > `* [REVISAR CON CONTADOR / ABOGADO LABORAL: Honorarios por prestación de servicios independientes en Colombia]`.

### E. Seguridad, Dispositivos y Biometría
- Vinculación de dispositivo móvil del personal (`POST /api/auth/register-device`) registrado en la tabla `StaffDeviceSession`.
- Soporte para desbloqueo biométrico instantáneo (**Face ID / Sensor de Huella**) mediante `expo-local-authentication`.
- Identificación por correo institucional (`juandavid@puntofino.com`, `emanuel@puntofino.com`, `juandiego@puntofino.com`).

### F. Arqueo de Caja y Panel de Control (Administrador)
- Pantalla dedicada de arqueo (`mobile/src/screens/AdminAuditScreen.tsx`):
  - Facturación total de la jornada en COP.
  - Conciliación de efectivo en gaveta vs. canales digitales.
  - Rendimiento y comisiones quincenales por barbero (Juan David, Emanuel Torres, Juan Diego).
