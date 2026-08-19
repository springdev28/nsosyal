-- =============================================================================
-- nSosyal 5N1K · 0001 · Türler, kimlik ve konu taksonomisi
--
-- PROJECT_SPEC bölüm 10'daki veri modelinin ilk parçası.
-- Kurallar:
--   * Birincil anahtarlar uuid, zaman damgaları timestamptz.
--   * Konum yalnızca il/ilçe koduyla tutulur; bireysel kesin koordinat YOK.
--   * Migration'lar sıralı ve tekrar çalıştırılabilir (idempotent) yazılır.
-- =============================================================================

create extension if not exists "pgcrypto";

-- --- Numaralandırmalar -------------------------------------------------------

do $$ begin
  create type app_role as enum ('user', 'community_manager', 'organization', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type intent_mode as enum ('sosyallesme', 'kesfet', 'ogren', 'uret');
exception when duplicate_object then null; end $$;

-- Varsayılan `hidden`: konum paylaşımı tamamen isteğe bağlıdır (PROJECT_SPEC 11.1).
do $$ begin
  create type location_visibility as enum ('hidden', 'province', 'district', 'online_only');
exception when duplicate_object then null; end $$;

do $$ begin
  create type community_kind as enum ('root', 'branch');
exception when duplicate_object then null; end $$;

do $$ begin
  create type community_scope as enum ('local', 'national', 'online');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum ('pending', 'approved', 'rejected', 'changes_requested');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_type as enum (
    'text', 'image', 'video', 'question',
    'project_update', 'event_announcement', 'why_link', 'resource_suggestion'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('fikir', 'prototip', 'test', 'yayinda', 'arsiv');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_mode as enum ('physical', 'online', 'hybrid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_level as enum ('baslangic', 'orta', 'ileri');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_type as enum ('rehber', 'baglanti', 'video', 'kontrol_listesi', 'soru_cevap');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('community', 'moderator_verified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type newspaper_item_type as enum (
    'lead', 'editorial', 'local', 'project_showcase', 'event_ad', 'org_ad'
  );
exception when duplicate_object then null; end $$;

-- --- Coğrafya referansı ------------------------------------------------------
-- Sabit referans tabloları. Herkes okuyabilir, yalnızca migration yazar.

create table if not exists public.provinces (
  code text primary key check (code ~ '^[0-9]{2}$'),
  name text not null,
  center_lng double precision not null,
  center_lat double precision not null
);

create table if not exists public.districts (
  code text primary key,
  province_code text not null references public.provinces (code) on delete cascade,
  name text not null
);

create index if not exists districts_province_idx on public.districts (province_code);

-- --- Profiller ---------------------------------------------------------------
-- auth.users ile bire bir. Kayıt sonrası tetikleyici profil satırını oluşturur.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._]{3,24}$'),
  display_name text not null,
  bio text not null default '',
  avatar_emoji text not null default '🙂',
  avatar_tone text not null default '#0f7d72',
  kind text not null default 'person' check (kind in ('person', 'organization')),
  role app_role not null default 'user',
  verified boolean not null default false,
  province_code text references public.provinces (code) on delete set null,
  district_code text references public.districts (code) on delete set null,
  location_visibility location_visibility not null default 'hidden',
  intent_mode intent_mode not null default 'sosyallesme',
  follower_count integer not null default 0 check (follower_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- İlçe seçildiyse il de dolu olmalı; tutarsız konum kaydı tutulmaz.
  constraint profiles_district_requires_province
    check (district_code is null or province_code is not null),

  -- Konum gizliyken kod tutulmaz: "kaldırdım" gerçekten kaldırmak demektir.
  constraint profiles_hidden_has_no_location
    check (location_visibility <> 'hidden' or (province_code is null and district_code is null))
);

create index if not exists profiles_province_idx on public.profiles (province_code)
  where location_visibility in ('province', 'district');
create index if not exists profiles_district_idx on public.profiles (district_code)
  where location_visibility = 'district';

-- --- Konular ("Ne" boyutunun kökü) ------------------------------------------

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  emoji text not null default '🏷️',
  description text not null default '',
  parent_id uuid references public.topics (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_topics (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  weight real not null default 1,
  primary key (profile_id, topic_id)
);

-- --- Takip grafiği -----------------------------------------------------------

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

-- --- Yardımcılar -------------------------------------------------------------

-- Rol kontrolü politikalarda tekrar tekrar gerekiyor. `security definer` ile
-- profiles üzerindeki RLS'e takılmadan okur; `search_path` sabitlenir.
create or replace function public.current_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('moderator', 'admin'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Yeni kayıt olan her kullanıcı için profil satırı.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    -- Çakışmayı önlemek için kısa bir sonek eklenir; kullanıcı onboarding'de değiştirir.
    lower(left(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9._]', '', 'g'), 16))
      || '_' || left(replace(new.id::text, '-', ''), 4),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
