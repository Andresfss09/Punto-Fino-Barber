-- ========================================================
-- PUNTO FINO · DATOS SEMILLA (SEED DATA)
-- Carrera 12 #53-51, Barrio Villacolombia, Cali
-- ========================================================

-- 1. Insertar Catálogo Oficial de Servicios (Todos los barberos realizan todos los servicios)
insert into public.services (name, description, price, duration, category, is_popular, is_active, order_num) values
(
  'Corte sencillo',
  'Corte clásico o degradado a máquina y tijera, limpieza de contorno con navaja y peinado final.',
  22000,
  40,
  'Cortes',
  true,
  true,
  1
),
(
  'Corte + cejas',
  'Corte completo a máquina y tijera acompañado de perfilado limpio de cejas con navaja.',
  25000,
  45,
  'Cortes',
  true,
  true,
  2
),
(
  'Corte + barba',
  'Servicio integral de corte de cabello y arreglo de barba delineada a navaja con toalla tibia.',
  30000,
  55,
  'Combos',
  true,
  true,
  3
),
(
  'Barba',
  'Arreglo, rebajado y perfilado de barba con navaja libre y loción refrescante.',
  10000,
  25,
  'Barba',
  false,
  true,
  4
)
on conflict (name) do update set
  description = excluded.description,
  price = excluded.price,
  duration = excluded.duration,
  category = excluded.category;

-- 2. Insertar Barberos Oficiales de Punto Fino (Sin teléfono ni especialidades individuales)
insert into public.barbers (id, name, email, bio, rest_day_of_week, is_available) values
(
  'a1111111-1111-1111-1111-111111111111',
  'Juan David',
  'juandavid@puntofino.com',
  'Barbero y administrador de Punto Fino. Todos los servicios del catálogo con dedicación y detalle.',
  3,
  true
),
(
  'b2222222-2222-2222-2222-222222222222',
  'Emanuel Torres',
  'emanuel@puntofino.com',
  'Barbero de Punto Fino. Atención dedicada en todos los servicios del catálogo.',
  1,
  true
),
(
  'c3333333-3333-3333-3333-333333333333',
  'Juan Diego',
  'juandiego@puntofino.com',
  'Barbero de Punto Fino. Atención dedicada en todos los servicios del catálogo.',
  3,
  true
)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  bio = excluded.bio,
  rest_day_of_week = excluded.rest_day_of_week;
