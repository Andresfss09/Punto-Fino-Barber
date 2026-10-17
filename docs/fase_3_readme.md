# 💈 FASE 3: Plataforma Web Pública, Concurrencia Atómica y Notificaciones Transaccionales

**Punto Fino · Corte & Cuidado Masculino · Villacolombia, Cali**  
*Arquitectura Full Stack Senior · Diseño de Producto & Dirección de Arte*

---

## 🎯 Alcance Entregado en Fase 3

En esta fase se implementó la capa crítica de reserva pública, la lógica de concurrencia para evitar doble reserva en horas pico caleñas y el sistema automatizado de notificaciones por correo electrónico transaccional con calendario RFC 5545 `.ics`.

```
                  ┌───────────────────────────────────────────────┐
                  │      CLIENTE EN WEB PÚBLICA (/reservar)       │
                  │   (Verificación OTP correo, optimizado 4G)    │
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
         │  • Adjunto .ics iCal │ │ • Datos Correo  │ │ • Resumen COP   │
         │  • Enlace token HMAC │ │   y Servicio    │ │                 │
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
- **Mecanismo:** Antes del checkout, el cliente bloquea temporalmente la franja por **8 minutos**. Si otro cliente en Cali intenta apartar el mismo barbero en la misma ventana, recibe inmediatamente un código HTTP `409 Conflict` con el mensaje: *"Alguien está completando la reserva en esta misma franja. Te sugerimos el siguiente horario libre."*
- **Sello Final:** En `POST /api/appointments`, la creación se ejecuta en una transacción `prisma.$transaction` que verifica colisiones de citas confirmadas y asocia el `holdId` para liberar el slot.

### 2. Generador de Calendarios RFC 5545 (`calendarService.js`)
- **Estándar:** iCalendar RFC 5545 compatible nativamente con Google Calendar, Apple Calendar (iOS/macOS) y Outlook.
- **Alarmas:** Contiene bloque `VALARM` con `TRIGGER:-PT2H` para notificar al cliente 2 horas antes de su cita.
- **Identificador Único:** `UID: PF-[CODE]-[ID]@puntofinobarberia.com` evitando eventos duplicados al sincronizar.
- **Zona Horaria:** Bloqueado a hora legal colombiana `America/Bogota` (UTC-5).

### 3. Terna de Correos Transaccionales (`emailTemplates.js`)
Plantillas artesanales HTML responsivas (probadas para móviles) y versión alternativa en texto plano:
1. **Cliente:** Código legible `PF-XXXX`, servicio en COP, dirección exacta en Barrio Villacolombia (`Carrera 12 #53-51`) con enlace a Google Maps, archivo `.ics` adjunto, disclaimer legal de Ley 1581 (Habeas Data) y enlaces directos de autogestión sin cuenta.
2. **Barbero:** Notificación en tiempo real con nombre del cliente, correo electrónico, servicio, hora estimada y notas opcionales.
3. **Administrador:** Resumen de cita agendada, valor total y porcentaje de ocupación proyectado para el día.

### 4. Motor de Cola con Reintentos (`emailQueue.js`)
- Desacoplamiento total: la respuesta HTTP al cliente nunca se bloquea por latencia de red en el envío de correos.
- Reintentos con retroceso exponencial (*Exponential Backoff*): 1s, 3s, 7s.
- Si se agotan los 3 intentos, el registro pasa a estado `FAILED` con el mensaje `lastError` para trazabilidad del equipo.

### 5. Webhook de Resend (`webhookController.js`)
- **Ruta:** `POST /api/webhooks/resend`
- Procesa eventos entrantes:
  - `email.delivered`: Actualiza `EmailAuditLog.status` a `DELIVERED`.
  - `email.bounced`: Actualiza estado a `BOUNCED` y persiste la razón técnica del rebote.

### 6. Autogestión Segura por Token de Un Solo Uso (HMAC)
- **Reprogramación:** `POST /api/appointments/token/:token/reschedule`
  - Valida que no exista conflicto en la nueva hora y conserva siempre al mismo barbero.
  - Actualiza la cita, invalida el token usado y emite un nuevo `actionToken` de un solo uso.
- **Cancelación:** `POST /api/appointments/token/:token/cancel`
  - Marca la cita como `CANCELLED` (con hasta 3 horas de anticipación) y destruye el token (`actionToken: null`).
