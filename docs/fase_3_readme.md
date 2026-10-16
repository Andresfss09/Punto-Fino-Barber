# 💈 FASE 3: Plataforma Web Pública, Concurrencia Atómica y Notificaciones Transaccionales

**Punto Fino · Barbería de Barrio (Santiago de Cali, Colombia)**  
*Arquitectura Full Stack Senior · Diseño de Producto & Dirección de Arte*

---

## 🎯 Alcance Entregado en Fase 3

En esta fase se implementó la capa crítica de reserva pública, la lógica de concurrencia para evitar doble reserva en horas pico caleñas y el sistema automatizado de notificaciones por correo electrónico transaccional con calendario RFC 5545 `.ics`.

```
                  ┌───────────────────────────────────────────────┐
                  │      CLIENTE EN WEB PÚBLICA (/reservar)       │
                  │   (Sin login obligatorio, optimizado 4G)      │
                  └───────────────────────┬───────────────────────┘
                                          │
                         1. POST /api/appointments/hold
                         (Bloqueo atómico 8 min - SlotHold)
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │     NEON SERVERLESS POSTGRESQL (Prisma)       │
                  │   $transaction atómica anti-colisión          │
                  └───────────────────────┬───────────────────────┘
                                          │
                         2. POST /api/appointments
                         (Consenso Habeas Data Ley 1581)
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │       MOTOR DE COLA ASÍNCRONA (emailQueue)    │
                  │   3 Reintentos · Exponential Backoff          │
                  └───┬───────────────────┬───────────────────┬───┘
                      │                   │                   │
         ┌────────────▼─────────┐ ┌───────▼─────────┐ ┌───────▼─────────┐
         │       CLIENTE        │ │     BARBERO     │ │  ADMINISTRADOR  │
         │  • HTML + Plaintext  │ │ • Alerta Cita   │ │ • Ocupación Día │
         │  • Adjunto .ics iCal │ │ • WhatsApp 1-tap│ │ • Resumen COP   │
         │  • Enlace token HMAC │ │   (wa.me/57...) │ │                 │
         └──────────────────────┘ └─────────────────┘ └─────────────────┘
                      │
           POST /api/webhooks/resend
         (email.delivered / email.bounced)
                      │
                      ▼
         ┌────────────────────────┐
         │   EmailAuditLog (DB)   │
         │  QUEUED ➔ SENT ➔       │
         │  DELIVERED / BOUNCED   │
         └────────────────────────┘
```

---

## 🛠️ Componentes Técnicos Implementados

### 1. Concurrencia Atómica & Anti-Doble Reserva (`SlotHold`)
- **Ruta:** `POST /api/appointments/hold`
- **Mecanismo:** Antes del checkout, el cliente bloquea temporalmente el turno por **8 minutos**. Si otro cliente en Cali intenta apartar el mismo barbero en la misma ventana, recibe inmediatamente un código HTTP `409 Conflict` con el mensaje: *"Alguien está completando la reserva en este mismo turno. Te sugerimos el siguiente horario libre."*
- **Sello Final:** En `POST /api/appointments`, la creación se ejecuta en una transacción `prisma.$transaction` que verifica colisiones de citas confirmadas y asocia el `holdId` para liberar el slot.

### 2. Generador de Calendarios RFC 5545 (`calendarService.js`)
- **Estándar:** iCalendar RFC 5545 compatible nativamente con Google Calendar, Apple Calendar (iOS/macOS) y Outlook.
- **Alarmas:** Contiene bloque `VALARM` con `TRIGGER:-PT2H` para notificar al cliente 2 horas antes de su turno.
- **Identificador Único:** `UID: PF-[CODE]-[ID]@puntofinobarberia.com` evitando eventos duplicados al sincronizar.
- **Zona Horaria:** Bloqueado a hora legal colombiana `America/Bogota` (UTC-5).

### 3. Terna de Correos Transaccionales (`emailTemplates.js`)
Plantillas artesanales HTML responsivas (probadas para móviles) y versión alternativa en texto plano:
1. **Cliente:** Código legible `PF-XXXX`, servicios desglosados en COP, dirección exacta en Barrio Tequendama con enlace a Google Maps/Waze, archivo `.ics` adjunto, disclaimer legal de Ley 1581 (Habeas Data) y enlaces directos de autogestión sin cuenta.
2. **Barbero:** Notificación en tiempo real con nombre del cliente, servicios, hora estimada y **botón directo para abrir chat de WhatsApp** (`https://wa.me/57...`).
3. **Administrador:** Resumen de turno agendado, valor total y porcentaje de ocupación proyectado para el día.

### 4. Motor de Cola con Reintentos (`emailQueue.js`)
- Desacoplamiento total: la respuesta HTTP al cliente nunca se bloquea por latencia de red en el envío de correos.
- Reintentos con retroceso exponencial (*Exponential Backoff*): 1s, 3s, 7s.
- Si se agotan los 3 intentos, el registro pasa a estado `FAILED` con el mensaje `lastError` para trazabilidad del equipo.
- Soporta integración nativa con **Resend API REST**, Nodemailer SMTP y modo de simulación controlada para desarrollo y pruebas.

### 5. Webhook de Resend (`webhookController.js`)
- **Ruta:** `POST /api/webhooks/resend`
- Procesa eventos entrantes:
  - `email.delivered`: Actualiza `EmailAuditLog.status` a `DELIVERED`.
  - `email.bounced`: Actualiza estado a `BOUNCED` y persiste la razón técnica del rebote.
- Emisión de sockets en tiempo real (`email:status_update`) para actualizar el panel administrativo sin recargar la página.

### 6. Autogestión Segura por Token de Un Solo Uso (HMAC)
- **Reprogramación:** `POST /api/appointments/token/:token/reschedule`
  - Valida que no exista conflicto en la nueva hora.
  - Actualiza la cita, invalida el token usado y emite un nuevo `actionToken` de un solo uso.
  - Despacha confirmación con el archivo `.ics` actualizado.
- **Cancelación:** `POST /api/appointments/token/:token/cancel`
  - Marca la cita como `CANCELLED`, deja el cupo libre para otros clientes y destruye el token (`actionToken: null`).

---

## 🧪 Pruebas Automatizadas de Integración

Se desarrollaron 11 pruebas de integración end-to-end contra la base de datos Neon PostgreSQL real:

```bash
node src/tests/test_fase3_concurrency_emails.js
```

### Resultados de la Suite (11/11 Aprobadas):
1. `✅ [PASS] 1. Validación RFC 5545 de calendario .ics con alarma de 2 horas`
2. `✅ [PASS] 2. Bloqueo atómico de cupo por 8 minutos (POST /api/appointments/hold)`
3. `✅ [PASS] 3. Prevención de colisión: Cliente B intenta apartar el mismo turno (409 Conflict)`
4. `✅ [PASS] 4. Crear cita confirmada con Habeas Data Ley 1581 (POST /api/appointments)`
5. `✅ [PASS] 5. Prevención de doble reserva sobre cita ya confirmada (409 Conflict)`
6. `✅ [PASS] 6. Auditoría y despacho de la terna de correos (Cliente, Barbero, Admin)`
7. `✅ [PASS] 7. Webhook de Resend: Recepción de evento email.delivered`
8. `✅ [PASS] 8. Webhook de Resend: Recepción de evento email.bounced con registro de error`
9. `✅ [PASS] 9. Autogestión: Reprogramar cita mediante token (POST /token/:token/reschedule)`
10. `✅ [PASS] 10. Seguridad: Token antiguo queda invalidado tras su primer uso`
11. `✅ [PASS] 11. Autogestión: Cancelar cita con el nuevo token válido (POST /token/:token/cancel)`

*Suite acumulada del backend (Fase 2 + Fase 3): 26 / 26 pruebas superadas.*

---

## 📸 Evidencias Visuales

Las capturas de pantalla de la experiencia pública de reservas y correos se encuentran en:
- `docs/screenshots/fase_3/01_web_publica_reservar.png`
- `docs/screenshots/fase_3/02_flujo_reserva_completo.png`
- `docs/screenshots/fase_3/03_correo_transaccional_ics.png`
