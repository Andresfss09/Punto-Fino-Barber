-- ========================================================
-- PUNTO FINO · ESQUEMA COMPLETO PARA POSTGRESQL / SUPABASE
-- ========================================================

-- 1. Habilitar extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "btree_gist";

-- 2. Tipos Enum
do $$ begin
  create type public.user_role as enum ('cliente', 'barbero', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum ('pendiente', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_show');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('pendiente', 'pagado', 'reembolsado');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum ('efectivo', 'transferencia', 'nequi', 'daviplata', 'otro');
exception
  when duplicate_object then null;
end $$;

-- 3. Tabla: profiles (vinculada a auth.users, sin teléfono ni foto de perfil)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  email text not null unique,
  address text default 'Carrera 12 #53-51, Villacolombia, Cali',
  role public.user_role default 'cliente',
  loyalty_points integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Tabla: barbers (perfil profesional de los 3 barberos de Punto Fino, todos ofrecen todos los servicios)
create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique,
  name text not null,
  email text,
  bio text default '',
  rest_day_of_week integer not null default 3,
  schedule jsonb default '[]'::jsonb,
  commission_rate numeric(4,2) default 50.0,
  is_available boolean default true,
  created_at timestamptz default now()
);

-- 5. Tabla: services (catálogo oficial de servicios de Punto Fino)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text default '',
  price integer not null check (price >= 0),
  duration integer not null check (duration >= 5),
  category text not null default 'Cortes',
  is_popular boolean default false,
  is_active boolean default true,
  order_num integer default 0,
  created_at timestamptz default now()
);

-- 6. Tabla: appointments (un único servicio por cita, sin teléfono)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  confirmation_code text not null unique,
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_address text default 'Cali',
  is_guest boolean default false,
  barber_id uuid references public.barbers(id) on delete set null,
  service_id uuid references public.services(id) on delete restrict,
  date date not null,
  start_time text not null,
  end_time text not null,
  total_price integer not null,
  total_duration integer not null,
  status public.appointment_status default 'pendiente',
  payment_status public.payment_status default 'pendiente',
  payment_method public.payment_method default 'efectivo',
  notes text default '',
  cancel_reason text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Trigger para crear automáticamente el perfil al registrarse en auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'cliente')
  )
  on conflict (id) do update set
    name = excluded.name;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Función para actualizar timestamps en updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
