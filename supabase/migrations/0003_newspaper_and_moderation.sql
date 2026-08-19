-- =============================================================================
-- nSosyal 5N1K · 0003 · nGazete, ilanlar, moderasyon ve bildirimler
--
-- Ürün kuralı (PROJECT_SPEC 1.1 madde 6 / 7.9):
-- Ücretli görünürlük yalnızca gazete içinde yaşar. Bu şemada bilinçli olarak
-- HİÇBİR "boost", "promoted", "feed_rank" veya benzeri alan yoktur; ödeme
-- kişisel akış sıralamasına dokunamaz.
-- =============================================================================

create table if not exists public.newspaper_issues (
  id uuid primary key default gen_random_uuid(),
  issue_date date not null unique,
  title text not null,
  standfirst text not null default '',
  cover_emoji text not null default '📰',
  theme text,
  publish_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create index if not exists newspaper_issues_published_idx
  on public.newspaper_issues (issue_date desc) where status = 'published';

create table if not exists public.newspaper_items (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.newspaper_issues (id) on delete cascade,
  item_type newspaper_item_type not null,
  title text not null,
  body text not null default '',
  linked_entity_type text check (
    linked_entity_type in ('post', 'project', 'event', 'community', 'profile', 'resource', 'why_story')
  ),
  linked_entity_id uuid,
  -- true ise arayüzde zorunlu "Sponsorlu" etiketi gösterilir.
  sponsored boolean not null default false,
  sponsor_name text,
  position integer not null default 0,
  created_at timestamptz not null default now(),

  -- Sponsorlu kartın kimin verdiği her zaman bilinir; anonim ücretli içerik olmaz.
  constraint newspaper_sponsored_needs_sponsor
    check (not sponsored or sponsor_name is not null)
);

create index if not exists newspaper_items_issue_idx
  on public.newspaper_items (issue_id, position);

create table if not exists public.ad_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.profiles (id) on delete cascade,
  contact_email text not null,
  placement_type newspaper_item_type not null
    check (placement_type in ('event_ad', 'org_ad', 'project_showcase')),
  requested_issue_date date,
  theme text,
  title text not null,
  body text not null,
  creative_url text,
  link_url text,
  status moderation_status not null default 'pending',
  published_item_id uuid references public.newspaper_items (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists ad_requests_status_idx on public.ad_requests (status, created_at desc);
create index if not exists ad_requests_org_idx on public.ad_requests (organization_id);

-- --- Bildirimler -------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in (
    'event_reminder', 'community_application', 'community_joined',
    'comment', 'moderation', 'newspaper', 'ad_request'
  )),
  title text not null,
  body text not null default '',
  entity_type text,
  entity_id uuid,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_idx
  on public.notifications (profile_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (profile_id) where read_at is null;

-- --- Raporlar ve moderasyon kaydı -------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  detail text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- Denetim kaydı: her yönetim işlemi yazılır ve normal kullanıcı göremez.
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists moderation_actions_created_idx
  on public.moderation_actions (created_at desc);

-- --- Ürün analitiği ----------------------------------------------------------
-- Üçüncü taraf izleme yerine kendi tablomuz (PROJECT_SPEC 13.4).
-- Kişisel veri değil, olay adı ve küçük bir payload tutulur.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on public.analytics_events (name, created_at desc);

-- --- Sayaç tetikleyicileri ---------------------------------------------------
-- Sayaçları uygulama koduna bırakmak yerine veritabanında tutuyoruz; böylece
-- iki farklı istemci aynı anda yazsa da tutarlı kalır.

create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_sync_count on public.post_likes;
create trigger post_likes_sync_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_like_count();

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_sync_count on public.comments;
create trigger comments_sync_count
  after insert or delete on public.comments
  for each row execute function public.sync_post_comment_count();

create or replace function public.sync_community_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = new.community_id;
  elsif tg_op = 'DELETE' then
    update public.communities set member_count = greatest(0, member_count - 1)
      where id = old.community_id;
  end if;
  return null;
end;
$$;

drop trigger if exists community_members_sync_count on public.community_members;
create trigger community_members_sync_count
  after insert or delete on public.community_members
  for each row execute function public.sync_community_member_count();

create or replace function public.sync_follower_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set follower_count = follower_count + 1 where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set follower_count = greatest(0, follower_count - 1)
      where id = old.following_id;
  end if;
  return null;
end;
$$;

drop trigger if exists follows_sync_count on public.follows;
create trigger follows_sync_count
  after insert or delete on public.follows
  for each row execute function public.sync_follower_count();
