-- =============================================================================
-- nSosyal 5N1K · 0004 · Row Level Security
--
-- İlke: RLS kapalı tablo bırakılmaz (PROJECT_SPEC 11.3 / 17.3).
-- Her politika neden var olduğunu açıklayan bir yorumla birlikte yazılır.
--
-- Not: service_role anahtarı RLS'i atlar. Bu anahtar YALNIZCA sunucu tarafında
-- kullanılır ve hiçbir koşulda istemci paketine girmez.
-- =============================================================================

-- Tüm tablolarda RLS'i aç.
do $$
declare
  t text;
begin
  foreach t in array array[
    'provinces', 'districts', 'profiles', 'topics', 'profile_topics', 'follows',
    'communities', 'community_members', 'community_applications',
    'media', 'projects', 'project_members', 'project_updates', 'project_communities',
    'events', 'reminders', 'why_stories', 'resources',
    'posts', 'post_media', 'comments', 'post_likes', 'post_saves',
    'post_topics', 'project_topics', 'event_topics', 'resource_topics', 'why_story_topics',
    'newspaper_issues', 'newspaper_items', 'ad_requests',
    'notifications', 'reports', 'moderation_actions', 'analytics_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    -- Tablo sahibinin de politikalara uymasını sağlar; kazara atlama olmasın.
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- --- Referans veriler --------------------------------------------------------
-- İl/ilçe ve konu listeleri herkese açık okunur; yazma yalnızca migration ve
-- service_role üzerinden yapılır (politika tanımlanmadığı için engellenir).

drop policy if exists provinces_read on public.provinces;
create policy provinces_read on public.provinces for select using (true);

drop policy if exists districts_read on public.districts;
create policy districts_read on public.districts for select using (true);

drop policy if exists topics_read on public.topics;
create policy topics_read on public.topics for select using (true);

drop policy if exists topics_admin_write on public.topics;
create policy topics_admin_write on public.topics for all
  using (public.is_admin()) with check (public.is_admin());

-- --- Profiller ---------------------------------------------------------------

-- Profiller herkese açıktır; sosyal ağın temel davranışı bu.
-- Konum alanları yalnızca kullanıcının seçtiği görünürlük düzeyinde anlam taşır
-- ve zaten en fazla il/ilçe kodudur (kesin koordinat hiç tutulmaz).
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);

-- Kullanıcı yalnızca kendi profilini günceller.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Rol yükseltme profil güncellemesiyle yapılamaz: rol ve doğrulama rozeti
-- yalnızca yönetici işlemiyle değişir. Politikalar OLD/NEW karşılaştıramadığı
-- için bu kural tetikleyiciyle uygulanır.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Rol yalnızca yönetici tarafından değiştirilebilir.';
  end if;
  if new.verified is distinct from old.verified then
    raise exception 'Doğrulama rozeti yalnızca yönetici tarafından değiştirilebilir.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- --- İlgi alanları ve takip --------------------------------------------------

drop policy if exists profile_topics_read on public.profile_topics;
create policy profile_topics_read on public.profile_topics for select using (true);

drop policy if exists profile_topics_own on public.profile_topics;
create policy profile_topics_own on public.profile_topics for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows for select using (true);

-- Yalnızca kendi adına takip edip bırakabilirsin.
drop policy if exists follows_own on public.follows;
create policy follows_own on public.follows for all
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- --- Topluluklar -------------------------------------------------------------

drop policy if exists communities_read on public.communities;
create policy communities_read on public.communities for select using (status = 'active' or public.is_moderator());

-- KRİTİK: topluluk doğrudan oluşturulamaz. Yalnızca moderatör/yönetici satır
-- ekleyebilir ve bunu onaylanmış bir başvuru üzerinden yapar (PROJECT_SPEC 7.3).
drop policy if exists communities_moderator_insert on public.communities;
create policy communities_moderator_insert on public.communities for insert
  with check (public.is_moderator());

-- Topluluk yöneticisi kendi topluluğunun tanıtım alanlarını güncelleyebilir.
drop policy if exists communities_manager_update on public.communities;
create policy communities_manager_update on public.communities for update
  using (
    public.is_moderator()
    or exists (
      select 1 from public.community_members m
      where m.community_id = communities.id
        and m.profile_id = auth.uid()
        and m.role in ('manager', 'moderator')
    )
  )
  with check (
    public.is_moderator()
    or exists (
      select 1 from public.community_members m
      where m.community_id = communities.id
        and m.profile_id = auth.uid()
        and m.role in ('manager', 'moderator')
    )
  );

drop policy if exists community_members_read on public.community_members;
create policy community_members_read on public.community_members for select using (true);

-- Katılma/ayrılma kullanıcının kendi işlemidir.
drop policy if exists community_members_join on public.community_members;
create policy community_members_join on public.community_members for insert
  with check (auth.uid() = profile_id and role = 'member');

drop policy if exists community_members_leave on public.community_members;
create policy community_members_leave on public.community_members for delete
  using (auth.uid() = profile_id or public.is_moderator());

-- Rol atama (yönetici/moderatör yapma) yalnızca topluluk yöneticisi veya platform
-- moderatörü tarafından yapılır.
drop policy if exists community_members_manage on public.community_members;
create policy community_members_manage on public.community_members for update
  using (
    public.is_moderator()
    or exists (
      select 1 from public.community_members m
      where m.community_id = community_members.community_id
        and m.profile_id = auth.uid()
        and m.role = 'manager'
    )
  )
  with check (true);

-- --- Topluluk başvuruları ----------------------------------------------------
-- Başvuran kendi başvurusunu görür; moderatör/yönetici tümünü görür.

drop policy if exists community_applications_read on public.community_applications;
create policy community_applications_read on public.community_applications for select
  using (auth.uid() = applicant_id or public.is_moderator());

drop policy if exists community_applications_insert on public.community_applications;
create policy community_applications_insert on public.community_applications for insert
  with check (auth.uid() = applicant_id and status = 'pending');

-- Başvuran yalnızca "düzenleme istendi" durumundaki başvurusunu düzeltebilir.
drop policy if exists community_applications_applicant_update on public.community_applications;
create policy community_applications_applicant_update on public.community_applications for update
  using (auth.uid() = applicant_id and status = 'changes_requested')
  with check (auth.uid() = applicant_id and status = 'pending');

-- Kararı yalnızca moderatör verir.
drop policy if exists community_applications_review on public.community_applications;
create policy community_applications_review on public.community_applications for update
  using (public.is_moderator()) with check (public.is_moderator());

-- --- Medya -------------------------------------------------------------------

drop policy if exists media_read on public.media;
create policy media_read on public.media for select using (true);

drop policy if exists media_own on public.media;
create policy media_own on public.media for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- --- Projeler ----------------------------------------------------------------

drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select using (true);

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert with check (auth.uid() = owner_id);

drop policy if exists projects_owner_write on public.projects;
create policy projects_owner_write on public.projects for update
  using (auth.uid() = owner_id or public.is_moderator())
  with check (auth.uid() = owner_id or public.is_moderator());

drop policy if exists projects_owner_delete on public.projects;
create policy projects_owner_delete on public.projects for delete
  using (auth.uid() = owner_id or public.is_moderator());

drop policy if exists project_members_read on public.project_members;
create policy project_members_read on public.project_members for select using (true);

drop policy if exists project_members_owner on public.project_members;
create policy project_members_owner on public.project_members for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists project_updates_read on public.project_updates;
create policy project_updates_read on public.project_updates for select using (true);

-- Güncellemeyi proje sahibi veya ekip üyesi yazabilir.
drop policy if exists project_updates_team on public.project_updates;
create policy project_updates_team on public.project_updates for insert
  with check (
    auth.uid() = author_id
    and (
      exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
      or exists (
        select 1 from public.project_members m
        where m.project_id = project_updates.project_id and m.profile_id = auth.uid()
      )
    )
  );

drop policy if exists project_updates_author_write on public.project_updates;
create policy project_updates_author_write on public.project_updates for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists project_communities_read on public.project_communities;
create policy project_communities_read on public.project_communities for select using (true);

drop policy if exists project_communities_owner on public.project_communities;
create policy project_communities_owner on public.project_communities for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- --- Etkinlikler -------------------------------------------------------------

drop policy if exists events_read on public.events;
create policy events_read on public.events for select using (true);

-- Etkinliği kendi adına bir profil veya yönettiği bir topluluk adına açabilir.
drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert
  with check (
    (organizer_profile_id is not null and organizer_profile_id = auth.uid())
    or (
      organizer_community_id is not null
      and exists (
        select 1 from public.community_members m
        where m.community_id = organizer_community_id
          and m.profile_id = auth.uid()
          and m.role in ('manager', 'moderator')
      )
    )
  );

drop policy if exists events_organizer_write on public.events;
create policy events_organizer_write on public.events for update
  using (
    organizer_profile_id = auth.uid()
    or public.is_moderator()
    or exists (
      select 1 from public.community_members m
      where m.community_id = events.organizer_community_id
        and m.profile_id = auth.uid()
        and m.role in ('manager', 'moderator')
    )
  )
  with check (true);

-- --- Hatırlatmalar -----------------------------------------------------------
-- Yalnızca sahibi görür ve yönetir. Başkasının hatırlatmalarını kimse okuyamaz.

drop policy if exists reminders_own on public.reminders;
create policy reminders_own on public.reminders for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- --- Neden hikâyeleri --------------------------------------------------------

drop policy if exists why_stories_read on public.why_stories;
create policy why_stories_read on public.why_stories for select
  using (visibility = 'public' or auth.uid() = author_id or public.is_moderator());

drop policy if exists why_stories_own on public.why_stories;
create policy why_stories_own on public.why_stories for all
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- --- Nasıl kaynakları --------------------------------------------------------

drop policy if exists resources_read on public.resources;
create policy resources_read on public.resources for select using (true);

-- Kaynağı yalnızca topluluk üyesi ekleyebilir.
drop policy if exists resources_member_insert on public.resources;
create policy resources_member_insert on public.resources for insert
  with check (
    auth.uid() = author_id
    and verification_status = 'community'
    and exists (
      select 1 from public.community_members m
      where m.community_id = resources.community_id and m.profile_id = auth.uid()
    )
  );

drop policy if exists resources_author_update on public.resources;
create policy resources_author_update on public.resources for update
  using (auth.uid() = author_id or public.is_moderator())
  with check (auth.uid() = author_id or public.is_moderator());

-- Doğrulama etiketi yalnızca moderatör işlemiyle değişir.
create or replace function public.guard_resource_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status and not public.is_moderator() then
    raise exception 'Doğrulama etiketi yalnızca moderatör tarafından değiştirilebilir.';
  end if;
  return new;
end;
$$;

drop trigger if exists resources_guard_verification on public.resources;
create trigger resources_guard_verification
  before update on public.resources
  for each row execute function public.guard_resource_verification();

-- --- Gönderiler ve etkileşim -------------------------------------------------

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select
  using (
    visibility = 'public'
    or public.is_moderator()
    or (
      -- Topluluk gönderileri yalnızca üyelere açıktır.
      community_id is not null
      and exists (
        select 1 from public.community_members m
        where m.community_id = posts.community_id and m.profile_id = auth.uid()
      )
    )
  );

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts for insert with check (auth.uid() = author_id);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts for delete
  using (auth.uid() = author_id or public.is_moderator());

drop policy if exists post_media_read on public.post_media;
create policy post_media_read on public.post_media for select using (true);

drop policy if exists post_media_author on public.post_media;
create policy post_media_author on public.post_media for all
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments for insert with check (auth.uid() = author_id);

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments for delete
  using (auth.uid() = author_id or public.is_moderator());

drop policy if exists post_likes_read on public.post_likes;
create policy post_likes_read on public.post_likes for select using (true);

drop policy if exists post_likes_own on public.post_likes;
create policy post_likes_own on public.post_likes for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Kaydedilenler kişiseldir: başka kullanıcılar göremez.
drop policy if exists post_saves_own on public.post_saves;
create policy post_saves_own on public.post_saves for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- --- 5N1K bağlam ilişkileri ----------------------------------------------------
-- Okuma herkese açık; yazma ilgili varlığın sahibine bağlı.

drop policy if exists post_topics_read on public.post_topics;
create policy post_topics_read on public.post_topics for select using (true);

drop policy if exists post_topics_author on public.post_topics;
create policy post_topics_author on public.post_topics for all
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

drop policy if exists project_topics_read on public.project_topics;
create policy project_topics_read on public.project_topics for select using (true);

drop policy if exists project_topics_owner on public.project_topics;
create policy project_topics_owner on public.project_topics for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists event_topics_read on public.event_topics;
create policy event_topics_read on public.event_topics for select using (true);

drop policy if exists event_topics_write on public.event_topics;
create policy event_topics_write on public.event_topics for all
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and (e.organizer_profile_id = auth.uid() or public.is_moderator())
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and (e.organizer_profile_id = auth.uid() or public.is_moderator())
    )
  );

drop policy if exists resource_topics_read on public.resource_topics;
create policy resource_topics_read on public.resource_topics for select using (true);

drop policy if exists resource_topics_author on public.resource_topics;
create policy resource_topics_author on public.resource_topics for all
  using (exists (select 1 from public.resources r where r.id = resource_id and r.author_id = auth.uid()))
  with check (exists (select 1 from public.resources r where r.id = resource_id and r.author_id = auth.uid()));

drop policy if exists why_story_topics_read on public.why_story_topics;
create policy why_story_topics_read on public.why_story_topics for select using (true);

drop policy if exists why_story_topics_author on public.why_story_topics;
create policy why_story_topics_author on public.why_story_topics for all
  using (exists (select 1 from public.why_stories w where w.id = why_story_id and w.author_id = auth.uid()))
  with check (exists (select 1 from public.why_stories w where w.id = why_story_id and w.author_id = auth.uid()));

-- --- nGazete -----------------------------------------------------------------
-- Yayımlanmış sayılar herkese açık; yayın işlemleri yalnızca yöneticide.

drop policy if exists newspaper_issues_read on public.newspaper_issues;
create policy newspaper_issues_read on public.newspaper_issues for select
  using (status = 'published' or public.is_admin());

drop policy if exists newspaper_issues_admin on public.newspaper_issues;
create policy newspaper_issues_admin on public.newspaper_issues for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists newspaper_items_read on public.newspaper_items;
create policy newspaper_items_read on public.newspaper_items for select
  using (
    exists (
      select 1 from public.newspaper_issues i
      where i.id = issue_id and (i.status = 'published' or public.is_admin())
    )
  );

drop policy if exists newspaper_items_admin on public.newspaper_items;
create policy newspaper_items_admin on public.newspaper_items for all
  using (public.is_admin()) with check (public.is_admin());

-- İlan başvurusu: kurum kendi başvurusunu görür, yönetici tümünü görür.
drop policy if exists ad_requests_read on public.ad_requests;
create policy ad_requests_read on public.ad_requests for select
  using (auth.uid() = organization_id or public.is_admin());

drop policy if exists ad_requests_insert on public.ad_requests;
create policy ad_requests_insert on public.ad_requests for insert
  with check (
    auth.uid() = organization_id
    and status = 'pending'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.kind = 'organization' or p.role = 'admin')
    )
  );

drop policy if exists ad_requests_admin_review on public.ad_requests;
create policy ad_requests_admin_review on public.ad_requests for update
  using (public.is_admin()) with check (public.is_admin());

-- --- Bildirimler, raporlar, denetim kaydı, analitik --------------------------

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for select using (auth.uid() = profile_id);

-- Okundu işaretleme kullanıcının kendi işlemidir.
drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications for update
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Bildirim ÜRETİMİ istemciden yapılmaz: sunucu tarafı (service_role) veya
-- tetikleyiciler yazar. Bu yüzden insert politikası bilerek tanımlanmadı.

drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select
  using (auth.uid() = reporter_id or public.is_moderator());

drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert
  with check (auth.uid() = reporter_id and status = 'open');

drop policy if exists reports_moderator_update on public.reports;
create policy reports_moderator_update on public.reports for update
  using (public.is_moderator()) with check (public.is_moderator());

-- Denetim kaydı normal kullanıcılara tamamen kapalıdır.
drop policy if exists moderation_actions_moderator on public.moderation_actions;
create policy moderation_actions_moderator on public.moderation_actions for select
  using (public.is_moderator());

drop policy if exists moderation_actions_insert on public.moderation_actions;
create policy moderation_actions_insert on public.moderation_actions for insert
  with check (public.is_moderator() and auth.uid() = moderator_id);

-- Analitik olayları: kullanıcı yalnızca kendi olayını yazabilir, okuma yönetici.
drop policy if exists analytics_events_insert on public.analytics_events;
create policy analytics_events_insert on public.analytics_events for insert
  with check (profile_id is null or auth.uid() = profile_id);

drop policy if exists analytics_events_admin_read on public.analytics_events;
create policy analytics_events_admin_read on public.analytics_events for select
  using (public.is_admin());
