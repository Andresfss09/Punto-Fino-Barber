# Fase 6: Landing Page Oficial de Punto Fino, Identidad de Marca, Catálogo Real, 3 Barberos y SEO Local (Cali)

## 1. Resumen Ejecutivo de la Fase

En la **Fase 6**, se consolidó la presencia digital pública y oficial de **Punto Fino**, en **Santiago de Cali, Valle del Cauca, Colombia** (Barrio Villacolombia, Carrera 12 #53-51). Se integraron los activos de marca oficiales proporcionados por el negocio:
1. **Logotipo Oficial**: Monograma minimalista y sobrio "PF" con línea vertical divisoria y la inscripción "PUNTO FINO".
2. **Catálogo Oficial de Servicios y Precios COP**: 4 servicios oficiales con duraciones y tarifas exactas del establecimiento, ofrecidos por igual por todos los barberos.
3. **Equipo Real de 3 Barberos**: Juan David (Barbero & Administrador), Emanuel Torres (Barbero) y Juan Diego (Barbero), en tarjetas tipográficas sin fotos de perfil ni especialidades individuales.
4. **Arquitectura de Rol Dual para Juan David**: Coexistencia armónica en base de datos como Administrador del sistema (`role: ADMIN`) y Barbero en silla activa (`BarberProfile`), con selector de vista entre `/admin` y `/barber`.
5. **SEO Local para Santiago de Cali**: Microdatos Schema.org `BarberShop` en JSON-LD, coordenadas geográficas en Barrio Villacolombia (`3.44428, -76.50652`), horarios oficiales los 7 días de la semana y comunicación exclusiva por correo y formulario web.

---

## 2. Catálogo Oficial de Servicios y Precios (COP)

Todos los barberos ofrecen todos los servicios con la misma duración y el mismo precio:

| Servicio Oficial | Duración | Tarifa (COP) | Descripción |
| :--- | :---: | :---: | :--- |
| **Corte sencillo** | 40 min | **$ 22.000 COP** | Corte clásico o degradado a máquina y tijera, limpieza de contorno con navaja y peinado final. |
| **Corte + cejas** | 45 min | **$ 25.000 COP** | Corte completo a máquina y tijera acompañado de perfilado limpio de cejas con navaja. |
| **Corte + barba** | 55 min | **$ 30.000 COP** | Servicio integral de corte de cabello y arreglo de barba delineada a navaja con toalla tibia. |
| **Barba** | 25 min | **$ 10.000 COP** | Arreglo, rebajado y perfilado de barba con navaja libre y loción refrescante. |

---

## 3. Equipo Real de 3 Barberos y Días de Descanso

| Barbero | Rol en el Negocio | Día de Descanso Semanal |
| :--- | :--- | :---: |
| **Juan David** | **Barbero & Administrador** | Miércoles |
| **Emanuel Torres** | **Barbero** | Lunes |
| **Juan Diego** | **Barbero** | Miércoles |

---

## 4. Local SEO y Schema.org en Santiago de Cali

Se implementó el estándar de datos estructurados Schema.org `BarberShop` en formato JSON-LD dentro de `frontend/index.html`:
- **Nombre Legal y Comercial**: Punto Fino
- **Dirección Física**: Carrera 12 #53-51, Barrio Villacolombia, Santiago de Cali, Valle del Cauca, Colombia.
- **Geolocalización**: Latitud `3.44428`, Longitud `-76.50652`.
- **Correo de Contacto**: `contacto@puntofino.co`.
- **Horarios Oficiales de Atención**:
  - Lunes: 8:00 a. m. a 8:30 p. m. (`08:00–20:30`)
  - Martes a Sábado: 9:00 a. m. a 8:30 p. m. (`09:00–20:30`)
  - Domingo: 9:00 a. m. a 4:00 p. m. (`09:00–16:00`)
