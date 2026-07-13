-- Gym Rankeds — esquema de base de datos para Supabase
-- Pega este script completo en el SQL Editor de tu proyecto Supabase y ejecútalo.
-- Asume Supabase Auth (auth.users) para cuentas por correo.

-- ============================================================
-- 1. PROFILES (perfil público, 1:1 con auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  body_weight_kg numeric(6, 2) default 70,
  height_cm numeric(5, 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos de perfil por usuario, espejo 1:1 de auth.users.';

-- Crea automáticamente el perfil cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantiene updated_at al día
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. WORKOUT_LOGS (series registradas — el corazón del sistema de rankeds)
-- ============================================================
create table if not exists public.workout_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null, -- id del ejercicio en el dataset local (ej. "0025")
  weight numeric(7, 2) not null default 0,
  reps integer not null check (reps > 0),
  one_rep_max numeric(7, 2) not null,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists workout_logs_user_exercise_idx on public.workout_logs (user_id, exercise_id);
create index if not exists workout_logs_user_date_idx on public.workout_logs (user_id, performed_at desc);

-- ============================================================
-- 3. ACHIEVEMENTS_UNLOCKED (logros/medallas desbloqueados)
-- ============================================================
create table if not exists public.achievements_unlocked (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null, -- coincide con el id definido en src/lib/achievements.ts
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

-- ============================================================
-- 4. ROUTINES (rutinas de entrenamiento)
-- ============================================================
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_routines_updated_at on public.routines;
create trigger set_routines_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. ROUTINE_EXERCISES (ejercicios dentro de cada rutina)
-- ============================================================
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id text not null, -- id del ejercicio en el dataset local
  order_index integer not null default 0,
  target_sets integer,
  target_reps integer,
  target_weight numeric(7, 2),
  notes text
);

create index if not exists routine_exercises_routine_idx on public.routine_exercises (routine_id, order_index);

-- ============================================================
-- 6. ROW LEVEL SECURITY — cada usuario solo ve/edita lo suyo
-- ============================================================
alter table public.profiles enable row level security;
alter table public.workout_logs enable row level security;
alter table public.achievements_unlocked enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;

-- profiles: cualquiera autenticado puede leer perfiles (para futuros rankings entre amigos),
-- pero solo el dueño puede modificar el suyo.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- workout_logs: totalmente privado por usuario
drop policy if exists "workout_logs_all_own" on public.workout_logs;
create policy "workout_logs_all_own"
  on public.workout_logs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- achievements_unlocked: privado por usuario
drop policy if exists "achievements_all_own" on public.achievements_unlocked;
create policy "achievements_all_own"
  on public.achievements_unlocked for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- routines: privado por usuario
drop policy if exists "routines_all_own" on public.routines;
create policy "routines_all_own"
  on public.routines for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- routine_exercises: se autoriza vía la rutina dueña (join a routines)
drop policy if exists "routine_exercises_all_own" on public.routine_exercises;
create policy "routine_exercises_all_own"
  on public.routine_exercises for all
  to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. STORAGE — bucket público para fotos de perfil
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Lectura pública (para mostrar avatares sin autenticación)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Solo el dueño puede subir/actualizar/borrar dentro de su propia carpeta: avatars/{user_id}/archivo.ext
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
