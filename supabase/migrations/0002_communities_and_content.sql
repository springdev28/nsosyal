-- =============================================================================
-- nSosyal 5N1K · 0002 · Topluluklar, gönderiler, medya ve 5N1K bağlam ilişkileri
--
-- Ürün kuralı: topluluk doğrudan açılmaz. community_applications kaydı
-- moderatör onayından geçtikten sonra communities satırı oluşur
-- (PROJECT_SPEC 7.3).
-- =============================================================================

-- --- Topluluklar -------------------------------------------------------------

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  kind community_kind not null,
  root_topic_id uuid not null references public.topics (id) on delete restrict,
  scope community_scope not null default 'online',
  province_code text references public.provinces (code) on delete set null,
  district_code text references public.districts (code) on delete set null,
  audience text not null default 'Genel',
  rules text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'archived')),
  emoji text not null default '👥',
  member_count integer not null default 0 check (member_count >= 0),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),

  constraint communities_local_needs_province
    check (scope <> 'local' or province_code is not null)
);

create index if not exists communities_root_topic_idx on public.communities (root_topic_id);
create index if not exists communities_province_idx on public.communities (province_code);
create index if not exists communities_kind_status_idx on public.communities (kind, status);

create table if not exists public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'manager', 'moderator')),
  joined_at timestamptz not null default now(),
  primary key (community_id, profile_id)
);

create index if not exists community_members_profile_idx on public.community_members (profile_id);

create table if not exists public.community_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 4 and 80),
  root_topic_id uuid not null references public.topics (id) on delete restrict,
  rationale text not null check (char_length(rationale) >= 40),
  scope community_scope not null default 'online',
  province_code text references public.provinces (code) on delete set null,
  district_code text references public.districts (code) on delete set null,
  audience text not null default 'Genel',
  rules text not null default '',
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  status moderation_status not null default 'pending',
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  -- Onaylanan başvurunun oluşturduğu topluluk.
  created_community_id uuid references public.communities (id) on delete set null
);

create index if not exists community_applications_status_idx
  on public.community_applications (status, created_at desc);
create index if not exists community_applications_applicant_idx
  on public.community_applications (applicant_id);

-- --- Medya -------------------------------------------------------------------
-- Dosyaların kendisi Supabase Storage'da; burada yalnızca metadata durur.

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  caption text not null default '',
  -- Erişilebilirlik: görsel için alt metin, video için transkript özeti.
  alt_text text not null default '',
  duration_sec integer check (duration_sec is null or duration_sec between 1 and 90),
  poster_path text,
  created_at timestamptz not null default now()
);

create index if not exists media_owner_idx on public.media (owner_id);

-- --- Projeler ----------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  summary text not null default '',
  status project_status not null default 'fikir',
  province_code text references public.provinces (code) on delete set null,
  district_code text references public.districts (code) on delete set null,
  why_text text not null default '',
  how_text text not null default '',
  needs text not null default '',
  emoji text not null default '🧪',
  pitch_media_id uuid references public.media (id) on delete set null,
  started_at timestamptz not null default now(),
  target_end_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists projects_owner_idx on public.projects (owner_id);
create index if not exists projects_province_idx on public.projects (province_code);

create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_label text not null default 'Katkıda bulunan',
  primary key (project_id, profile_id)
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  is_milestone boolean not null default false,
  milestone_date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_updates_project_idx
  on public.project_updates (project_id, created_at desc);

create table if not exists public.project_communities (
  project_id uuid not null references public.projects (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  primary key (project_id, community_id)
);

-- --- Etkinlikler -------------------------------------------------------------
-- Zaman alanları bilinçli olarak ayrıdır: starts_at/ends_at etkinliğin
-- kendisidir, deadline_at başvuru son tarihidir. Filtrelerde karıştırılmaz
-- (PROJECT_SPEC 7.5).

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  organizer_type text not null check (organizer_type in ('profile', 'community', 'organization')),
  organizer_profile_id uuid references public.profiles (id) on delete cascade,
  organizer_community_id uuid references public.communities (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  deadline_at timestamptz,
  province_code text references public.provinces (code) on delete set null,
  district_code text references public.districts (code) on delete set null,
  venue text,
  online_url text,
  mode event_mode not null default 'physical',
  community_id uuid references public.communities (id) on delete set null,
  emoji text not null default '🗓️',
  created_at timestamptz not null default now(),

  constraint events_ends_after_starts check (ends_at >= starts_at),
  constraint events_has_one_organizer check (
    (organizer_profile_id is not null)::int + (organizer_community_id is not null)::int = 1
  ),
  constraint events_physical_needs_place check (mode <> 'physical' or province_code is not null)
);

create index if not exists events_starts_idx on public.events (starts_at);
create index if not exists events_province_starts_idx on public.events (province_code, starts_at);
create index if not exists events_deadline_idx on public.events (deadline_at) where deadline_at is not null;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  remind_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled')),
  created_at timestamptz not null default now(),
  -- Aynı etkinlik için tek aktif hatırlatma.
  unique (profile_id, event_id)
);

create index if not exists reminders_due_idx on public.reminders (remind_at) where status = 'scheduled';

-- --- Neden hikâyeleri --------------------------------------------------------

create table if not exists public.why_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  media_id uuid references public.media (id) on delete set null,
  linked_entity_type text check (linked_entity_type in ('project', 'profile', 'community')),
  linked_entity_id uuid,
  province_code text references public.provinces (code) on delete set null,
  visibility text not null default 'public'
    check (visibility in ('public', 'community', 'profile_only')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),

  constraint why_linked_pair check (
    (linked_entity_type is null and linked_entity_id is null)
    or (linked_entity_type is not null and linked_entity_id is not null)
  )
);

create index if not exists why_stories_author_idx on public.why_stories (author_id);
create index if not exists why_stories_linked_idx
  on public.why_stories (linked_entity_type, linked_entity_id);

-- --- Nasıl kaynakları --------------------------------------------------------

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  type resource_type not null default 'rehber',
  level resource_level not null default 'baslangic',
  estimated_minutes integer not null default 10 check (estimated_minutes between 1 and 600),
  url text,
  body text,
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  -- Doğrulama etiketi yalnızca moderatör işlemiyle değişir (RLS ile korunur).
  verification_status verification_status not null default 'community',
  created_at timestamptz not null default now(),

  constraint resources_has_content check (url is not null or body is not null)
);

create index if not exists resources_community_idx on public.resources (community_id);
create index if not exists resources_level_type_idx on public.resources (level, type);

-- --- Gönderiler --------------------------------------------------------------

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type post_type not null default 'text',
  body text not null default '',
  visibility text not null default 'public' check (visibility in ('public', 'community')),
  community_id uuid references public.communities (id) on delete set null,
  province_code text references public.provinces (code) on delete set null,
  district_code text references public.districts (code) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  why_story_id uuid references public.why_stories (id) on delete set null,
  resource_id uuid references public.resources (id) on delete set null,
  is_short_video boolean not null default false,
  video_kind text check (
    video_kind in ('gundelik', 'pitch', 'demo', 'ilerleme', 'nasil', 'neden', 'soru')
  ),
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  repost_count integer not null default 0 check (repost_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id, created_at desc);
create index if not exists posts_community_idx on public.posts (community_id, created_at desc);
create index if not exists posts_province_idx on public.posts (province_code, created_at desc);
create index if not exists posts_short_video_idx on public.posts (created_at desc) where is_short_video;

create table if not exists public.post_media (
  post_id uuid not null references public.posts (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  position integer not null default 0,
  primary key (post_id, media_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 600),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table if not exists public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- --- 5N1K bağlam ilişkileri ----------------------------------------------------
-- Her varlığa onlarca nullable kolon eklemek yerine join tabloları kullanılır
-- (PROJECT_SPEC 10.2). Konum ve zaman gibi sık sorgulanan alanlar ise doğrudan
-- ilgili tabloda durur.

create table if not exists public.post_topics (
  post_id uuid not null references public.posts (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  primary key (post_id, topic_id)
);

create table if not exists public.project_topics (
  project_id uuid not null references public.projects (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  primary key (project_id, topic_id)
);

create table if not exists public.event_topics (
  event_id uuid not null references public.events (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  primary key (event_id, topic_id)
);

create table if not exists public.resource_topics (
  resource_id uuid not null references public.resources (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  primary key (resource_id, topic_id)
);

create table if not exists public.why_story_topics (
  why_story_id uuid not null references public.why_stories (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  primary key (why_story_id, topic_id)
);

create index if not exists post_topics_topic_idx on public.post_topics (topic_id);
create index if not exists project_topics_topic_idx on public.project_topics (topic_id);
create index if not exists event_topics_topic_idx on public.event_topics (topic_id);
