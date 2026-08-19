-- =============================================================================
-- nSosyal 5N1K · 0005 · Kalıcı platform amaçları
--
-- PROJECT_SPEC 10.1.1 ve 17.18/10: tek bir intent_mode alanı kişiselleştirme
-- için yetersizdir. Kişiselleştirme iki zaman ölçeğinde çalışır:
--
--   1. KALICI  — kullanıcının platformdan genel olarak ne beklediği. Birden
--                fazla amaç aynı anda seçilebilir ve Ayarlar'dan değiştirilir.
--   2. ANLIK   — Sosyalleş / Keşfet / Öğren / Üret. Profil amaçlarını SİLMEZ,
--                yalnızca o oturumdaki sıralama ağırlıklarını geçici olarak
--                yeniden dağıtır.
--
-- Bu migration kalıcı katmanı ekler ve anlık katmanı isteğe bağlı hâle getirir.
-- =============================================================================

-- --- Kontrollü sözlük --------------------------------------------------------
-- Serbest metin tutulmaz: sıralama (rank.ts) ve analitik ancak kapalı bir
-- değer kümesine bağlanabilir. Liste spec 10.1.1'den birebir alınmıştır.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_key') then
    create type goal_key as enum (
      'socialize',
      'meet_people',
      'find_communities',
      'discover_events',
      'discover_projects',
      'share_projects',
      'find_collaborators',
      'learn',
      'find_resources',
      'follow_developments',
      'discover_local_ecosystem',
      'find_institutions',
      'discover_opportunities',
      'casual_discussion',
      'follow_creation_stories',
      'discover_people'
    );
  end if;
end $$;

-- --- Kalıcı amaçlar ----------------------------------------------------------
create table if not exists public.profile_goals (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  goal_key goal_key not null,
  -- 0-1 arası. Prototipte hepsi 1.0; arayüz ileride amaçlara ağırlık
  -- verdirebilsin diye alan şimdiden duruyor.
  weight numeric(3, 2) not null default 1.00 check (weight >= 0 and weight <= 1),
  created_at timestamptz not null default now(),
  primary key (profile_id, goal_key)
);

comment on table public.profile_goals is
  'Kullanıcının kalıcı platform amaçları. Anlık niyet modundan (profiles.intent_mode) ayrıdır ve onun tarafından silinmez.';

-- Sıralama her akış isteğinde kullanıcının amaçlarını okur.
create index if not exists profile_goals_profile_idx on public.profile_goals (profile_id);

-- --- Anlık niyet artık zorunlu değil -----------------------------------------
-- Spec 7.10: "Kullanıcı isterse hiçbir modu özellikle seçmeden varsayılan
-- kişiselleştirilmiş akışı kullanabilmelidir." Kolonun not null + default
-- olması bu seçimi imkânsız kılıyordu: mod seçmemekle 'sosyallesme' seçmek
-- veritabanında aynı şeye düşüyordu.
alter table public.profiles alter column intent_mode drop default;
alter table public.profiles alter column intent_mode drop not null;

comment on column public.profiles.intent_mode is
  'Anlık niyet modu. NULL = kullanıcı mod seçmedi; akış yalnızca profile_goals üzerinden kişiselleştirilir.';

-- --- RLS ---------------------------------------------------------------------
alter table public.profile_goals enable row level security;
alter table public.profile_goals force row level security;

-- Amaçlar profilin bir parçasıdır ve profil zaten herkese açık okunur;
-- "neden gösteriliyor?" açıklamasının doğrulanabilir olması da buna bağlı.
drop policy if exists profile_goals_read on public.profile_goals;
create policy profile_goals_read on public.profile_goals for select using (true);

-- Yalnızca kendi amaçlarını yazabilirsin.
drop policy if exists profile_goals_own on public.profile_goals;
create policy profile_goals_own on public.profile_goals for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
