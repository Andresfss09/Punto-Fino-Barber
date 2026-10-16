# 💈 Módulo de Prototipos & Sistema de Diseño — Punto Fino
**Fase 1: Prototipos de Pantallas Clave & Dirección de Arte**

Este módulo implementa el **Design System** y los **4 prototipos interactivos funcionales** para la barbería "Punto Fino" en Santiago de Cali, Colombia.

---

## 🚀 Cómo Ejecutar e Interactuar

El servidor de desarrollo está corriendo en:
```
http://localhost:5173/prototipos
```

Puedes navegar directamente a cada prototipo mediante la barra superior o con los parámetros URL:
1. **Design System:** `http://localhost:5173/prototipos?tab=design-system`
2. **Web Pública de Reservas:** `http://localhost:5173/prototipos?tab=public-web`
3. **App Móvil de Barberos:** `http://localhost:5173/prototipos?tab=barber-mobile`
4. **Panel de Administración:** `http://localhost:5173/prototipos?tab=admin-panel`
5. **Correo Transaccional:** `http://localhost:5173/prototipos?tab=customer-email`

---

## 🎨 1. Sistema de Diseño (Design System)

### Paleta de Color
- **Tinta Carbón (Base):** `#111215` (`bg-pf-carbon`)
- **Superficie Studio:** `#18191E` (`bg-pf-surface`)
- **Elevado / Inputs:** `#22242B` (`bg-pf-elevated`)
- **Terracota Caleño (Acento Primario):** `#E15233` (`bg-pf-terracota`)
- **Latón Ahumado (Acento Secundario):** `#B89758` (`bg-pf-brass`)
- **Lino Hueso (Canvas / Texto):** `#F7F5F0` (`text-pf-bone`)
- **Verde Disponible (Punto Live):** `#2EA063` (`bg-pf-available`)

### Tipografía de Autor
- **Titulares & Display:** `Syne` (Bold / ExtraBold) — Escultórica, contemporánea, con filo y destreza artesanal.
- **Interfaz & Formularios:** `Plus Jakarta Sans` — Geometría limpia, excelente legibilidad en pantallas móviles bajo el sol de Cali.
- **Precios & Horas:** `JetBrains Mono` con cifras tabulares (`tabular-nums`) para precios en COP (`$ 45.000 COP`) y horas.

---

## 📱 2. Resumen de Pantallas Prototipadas

### 2.1 Plataforma Web Pública de Reservas (`PublicBookingView.jsx`)
- **Paso 1 (Servicios):** Selección múltiple de servicios con cálculo instantáneo de duración y precio total en COP.
- **Paso 2 (Barbero):** Tarjetas con fotos reales del equipo (`Brayan "El Fino"`, `Carlos "El Primo"`, `Andrés "Junior"`) y opción *"El primero disponible"*.
- **Paso 3 (Fecha y Hora):** Simulación de `SlotHold` atómico con temporizador regresivo de 8 minutos para evitar doble reserva.
- **Paso 4 (Datos del Cliente):** Formulario sin login obligatorio con validación de celular colombiano (+57), notas de corte, casilla obligatoria de Habeas Data (Ley 1581 de 2012) con modal legal y casilla separada para promociones.
- **Paso 5 (Resumen & Confirmación):** Ticket sastre, código `PF-8492`, botones para Google Calendar, descarga de archivo `.ics` y enlace firmado para cancelar o reprogramar.

### 2.2 App Móvil Interna para Barberos (`BarberMobileView.jsx`)
- **En Silla Ahora:** Vista del cliente actual en atención, cronómetro de tiempo transcurrido y ficha privada de corte (degradado, navaja, sensibilidad).
- **Acción Rápida Walk-in:** Registro de cliente que llega sin cita en solo 2 toques, bloqueando automáticamente el turno en la web pública.
- **Modo Offline:** Simulador de estado online/offline con almacenamiento local en SQLite.
- **Cierre de Servicio POS:** Cobro con métodos de pago de barrio (Efectivo con cálculo de cambio, Nequi, Daviplata, Datáfono), propina opcional y cálculo de comisión en vivo (50%).

### 2.3 Panel del Administrador (`AdminDashboardView.jsx`)
- **Métricas del Día:** Ocupación del local (84%), facturación discriminada por método de pago y liquidación estimada del equipo.
- **Sillas en Vivo:** Monitoreo de cada barbero con reasignación de citas en un clic y alerta automática a los involucrados.
- **Alertas Operativas:** Control de stock de insumos críticos (cuchillas, toallas esterilizadas) y salud de envíos en Resend.

### 2.4 Correo Transaccional al Cliente (`CustomerEmailView.jsx`)
- Plantilla responsiva (móvil y desktop) basada en React Email y Resend.
- Diseño sobrio con los colores de Punto Fino, resumen completo, archivo `.ics` adjunto, dirección con enlace a Google Maps y botones seguros de autogestión sin cuenta.

---

## 📸 3. Evidencias Visuales Capturadas

Las capturas generadas directamente del navegador se encuentran en:
- `docs/screenshots/fase_1/01_design_system.png`
- `docs/screenshots/fase_1/02_web_publica_reservas.png`
- `docs/screenshots/fase_1/03_app_movil_barbero.png`
- `docs/screenshots/fase_1/04_panel_administrador.png`
- `docs/screenshots/fase_1/05_correo_confirmacion.png`

