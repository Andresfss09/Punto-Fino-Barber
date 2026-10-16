# 💈 Backend API & Base de Datos — Punto Fino
**Fase 2: Backend, Autenticación, Roles y Modelo de Datos en Neon PostgreSQL**

Este módulo implementa el núcleo del backend para **Punto Fino**, conectándose directamente a la base de datos serverless en **Neon PostgreSQL**, con autenticación JWT, rotación de sesiones móviles, control de roles (RBAC) y cumplimiento normativo de Habeas Data (Ley 1581 de 2012).

---

## 🏗️ Arquitectura y Tecnologías
- **Runtime:** Node.js v24 + Express 5
- **ORM & Migraciones:** Prisma v6.4.1 con client tipado
- **Base de Datos:** Neon Serverless PostgreSQL (`production / neondb`)
  - Runtime: Connection Pooling (PgBouncer)
  - Migraciones: Conexión directa
- **Seguridad:** Argon2 / Bcrypt para contraseñas, JWT con Bearer tokens, Helmet, Rate Limiting y CORS restrictivo
- **Tiempo Real:** Socket.io para actualización instantánea de citas entre la web pública y las apps internas

---

## 🗄️ Modelo de Datos (Prisma Schema)
El esquema completo se encuentra en [`prisma/schema.prisma`](./prisma/schema.prisma) e incluye 16 entidades:
1. `User`: Cuentas con roles `SUPER_ADMIN`, `ADMIN`, `RECEPTIONIST`, `BARBER`, `CLIENT`.
2. `BarberProfile`: Perfiles con apodo, biografía, foto real y tasa de comisión (50%).
3. `ClientProfile`: Ficha técnica privada de corte y tarjeta de sellos digital.
4. `BarberSchedule` & `BarberAbsence`: Horarios semanales y bloqueos/descansos.
5. `Service` & `BarberService`: Catálogo de servicios en COP con duraciones.
6. `Appointment` & `AppointmentItem`: Citas con código amigable (`PF-XXXX`) y token de autogestión firmado.
7. `SlotHold`: Bloqueo atómico temporal de cupos (8 min) para prevención estricta de doble reserva.
8. `CashSession` & `CashTransaction`: Control de apertura, cierre ciego y arqueo con métodos de pago de barrio (Efectivo, Nequi, Daviplata, Datáfono).
9. `Product` & `InventoryMovement`: Inventario de pomadas, aceites y cuchillas con stock mínimo.
10. `CommissionSettlement`: Liquidación periódica de honorarios (*REVISAR CON CONTADOR / ABOGADO LABORAL*).
11. `HabeasDataConsent`: Registro inmutable de consentimiento legal (Ley 1581 de 2012) con IP, User-Agent y timestamp.
12. `EmailAuditLog`: Registro de correos transaccionales para entrega con Resend.
13. `StaffDeviceSession`: Sesiones por dispositivo con soporte para biometría en la app móvil.
14. `AuditLog`: Registro inmutable de auditoría para cambios de precios, caja y citas.

---

## 🔑 Credenciales Semilla (Seed Data)
Pobladas exitosamente en Neon PostgreSQL:
- **Administrador:**
  - Correo: `admin@puntofino.com`
  - Contraseña: `PuntoFino2026!`
- **Barbero (Silla #1):**
  - Correo: `brayan@puntofino.com`
  - Contraseña: `Barbero2026!`
- **Barbero (Silla #2):**
  - Correo: `carlos@puntofino.com`
  - Contraseña: `Barbero2026!`
- **Barbero (Silla #3):**
  - Correo: `andres@puntofino.com`
  - Contraseña: `Barbero2026!`

---

## 📡 Endpoints de la API

### Autenticación (`/api/auth`)
- `POST /api/auth/login`: Inicio de sesión (personal y admin) con soporte para `deviceId` móvil.
- `GET /api/auth/me`: Perfil del usuario autenticado vía Bearer token.
- `POST /api/auth/register-staff`: Registro de nuevos barberos (exclusivo Admin).
- `POST /api/auth/logout`: Cierre de sesión y revocación remota de dispositivos.

### Servicios (`/api/services`)
- `GET /api/services`: Catálogo público de servicios ordenados con precios en COP.
- `GET /api/services/:slug`: Detalle de un servicio específico.
- `POST /api/services`: Crear nuevo servicio (Admin).
- `PUT /api/services/:id`: Actualizar servicio (Admin).
- `DELETE /api/services/:id`: Desactivar servicio (Admin).

### Barberos & Disponibilidad (`/api/barbers`)
- `GET /api/barbers`: Lista de barberos activos con sus especialidades, fotos y horarios.
- `GET /api/barbers/:id/availability?date=YYYY-MM-DD&duration=MIN`: Disponibilidad en tiempo real calculando descansos, citas existentes y bloqueos temporales.

### Citas & Concurrencia (`/api/appointments`)
- `POST /api/appointments/hold`: Bloqueo atómico de cupo por 8 minutos (`SlotHold`).
- `POST /api/appointments`: Confirmación de cita con registro de consentimiento de Habeas Data (Ley 1581).
- `GET /api/appointments/code/:code`: Consulta pública por código de reserva sin login.
- `POST /api/appointments/token/:token/:action`: Reprogramar o cancelar cita mediante token seguro de un solo uso.
- `GET /api/appointments`: Listado de citas para el equipo con filtros de fecha y estado.
- `PUT /api/appointments/:id/status`: Actualización de estado (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).

---

## 🧪 Pruebas de Integración Ejecutadas
Para ejecutar las pruebas automáticas contra la base de datos Neon:
```bash
node src/tests/test_api_fase2.js
```
**Resultado:** 15 / 15 pruebas superadas con éxito.
