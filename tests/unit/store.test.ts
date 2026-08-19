import { beforeEach, describe, expect, it } from 'vitest';

import { DemoStore } from '@/lib/data/store';
import { profileId } from '@/lib/seed/profiles';
import { communityId } from '@/lib/seed/communities';
import { eventId } from '@/lib/seed/events';
import { uid } from '@/lib/seed/ids';
import { resolvePreset, toIstanbulDateKey } from '@/lib/time';

/**
 * Veri deposu ve ürün kuralları testleri.
 *
 * Buradaki testlerin çoğu "kod çalışıyor mu"dan çok "ürün kuralı korunuyor mu"
 * sorusunu sorar: topluluk onaysız açılamaz, konum gizli olan kullanıcı yerel
 * sonuçlarda görünmez, onaylanan ilan akışa dokunmaz.
 */

const NOW = new Date('2026-08-18T09:00:00Z');

let store: DemoStore;

beforeEach(() => {
  store = new DemoStore(NOW);
});

describe('seed bütünlüğü', () => {
  it('yarışma için önerilen demo veri hacmini karşılar (PROJECT_SPEC 15.1)', () => {
    expect(store.listProfiles().length).toBeGreaterThanOrEqual(12);
    expect(store.listCommunities({ kind: 'root' }).length).toBeGreaterThanOrEqual(6);
    expect(store.listCommunities({ kind: 'branch' }).length).toBeGreaterThanOrEqual(8);
    expect(store.getFeed({ viewerId: null, limit: 500 }).length).toBeGreaterThanOrEqual(40);
    expect(store.listProjects().length).toBeGreaterThanOrEqual(8);
    expect(store.listEvents().length).toBeGreaterThanOrEqual(10);
    expect(store.listWhyStories().length).toBeGreaterThanOrEqual(8);
    expect(store.listResources().length).toBeGreaterThanOrEqual(12);
    expect(store.listIssues().length).toBeGreaterThanOrEqual(2);
  });

  it('her profil sentetik olarak işaretlidir', () => {
    for (const profile of store.listProfiles()) {
      expect(profile.demo).toBe(true);
    }
  });

  it('gönderi referansları çözülebilir: kırık bağlantı yok', () => {
    for (const view of store.getFeed({ viewerId: null, limit: 500 })) {
      expect(store.getProfile(view.post.authorId), `yazar ${view.post.authorId}`).not.toBeNull();
      if (view.post.communityId) expect(store.getCommunity(view.post.communityId)).not.toBeNull();
      if (view.post.projectId) expect(store.getProject(view.post.projectId)).not.toBeNull();
      if (view.post.eventId) expect(store.getEvent(view.post.eventId)).not.toBeNull();
      for (const mediaId of view.post.mediaIds) {
        expect(store.getMedia(mediaId), `medya ${mediaId}`).not.toBeNull();
      }
    }
  });

  it('demo senaryosu için gerekli veri hazır: gelecek 30 günde İzmir havacılık etkinliği', () => {
    const topic = store.getTopicBySlug('havacilik-uzay')!;
    const events = store.listEvents({
      provinceCode: '35',
      topicId: topic.id,
      range: resolvePreset('next-30', NOW),
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it('akış yalnızca proje içeriğinden oluşmaz: gündelik paylaşım ve mizah da var', () => {
    const posts = store.getFeed({ viewerId: null, limit: 500 }).map((view) => view.post);
    const casual = posts.filter((post) => post.type === 'text' || post.type === 'image');
    const production = posts.filter((post) => post.type === 'project_update');
    expect(casual.length).toBeGreaterThan(production.length);
  });
});

describe('topluluk üyeliği', () => {
  const viewer = profileId('elif.demo');
  const target = communityId('turkce-nlp');

  it('katılma üye sayısını artırır ve bildirim üretir', () => {
    const before = store.getCommunity(target)!.memberCount;
    expect(store.joinCommunity(target, viewer)).toBe(true);
    expect(store.getCommunity(target)!.memberCount).toBe(before + 1);
    expect(store.listNotifications(viewer)[0].type).toBe('community_joined');
  });

  it('aynı topluluğa iki kez katılmaz', () => {
    store.joinCommunity(target, viewer);
    const count = store.getCommunity(target)!.memberCount;
    expect(store.joinCommunity(target, viewer)).toBe(false);
    expect(store.getCommunity(target)!.memberCount).toBe(count);
  });

  it('ayrılma üyeliği kaldırır', () => {
    store.joinCommunity(target, viewer);
    expect(store.leaveCommunity(target, viewer)).toBe(true);
    expect(store.getCommunityRole(target, viewer)).toBeNull();
  });
});

describe('topluluk başvurusu ve moderatör onayı', () => {
  const moderator = profileId('moderator.demo');

  it('bekleyen başvurular moderatör kuyruğunda görünür', () => {
    expect(store.listApplications('pending').length).toBeGreaterThan(0);
  });

  it('benzer isimli aktif topluluklar moderatöre gösterilir', () => {
    const application = store
      .listApplications('pending')
      .find((entry) => entry.application.name.includes('İzmir'));
    expect(application).toBeDefined();
    expect(application!.similarCommunities.length).toBeGreaterThan(0);
  });

  it('onay topluluğu oluşturur ve başvuranı yönetici yapar', () => {
    const application = store.listApplications('pending')[0];
    const before = store.listCommunities().length;

    const result = store.reviewApplication(application.application.id, moderator, 'approved', 'Uygun.');

    expect(result?.community).not.toBeNull();
    expect(store.listCommunities().length).toBe(before + 1);
    expect(store.getCommunityRole(result!.community!.id, application.application.applicantId)).toBe('manager');
  });

  it('ret topluluğu oluşturmaz', () => {
    const application = store.listApplications('pending')[0];
    const before = store.listCommunities().length;

    const result = store.reviewApplication(application.application.id, moderator, 'rejected', 'Kurallara aykırı.');

    expect(result?.community).toBeNull();
    expect(store.listCommunities().length).toBe(before);
  });

  it('her karar denetim kaydına yazılır', () => {
    const application = store.listApplications('pending')[0];
    expect(store.listModerationActions()).toHaveLength(0);
    store.reviewApplication(application.application.id, moderator, 'approved', 'Uygun.');
    const actions = store.listModerationActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].action.action).toBe('community_application:approved');
    expect(actions[0].moderator.id).toBe(moderator);
  });

  it('başvurana sonuç bildirimi gider', () => {
    const application = store.listApplications('pending')[0];
    const applicant = application.application.applicantId;
    store.reviewApplication(application.application.id, moderator, 'rejected', 'Kurallara aykırı.');
    const notification = store.listNotifications(applicant)[0];
    expect(notification.type).toBe('moderation');
    expect(notification.title).toContain('reddedildi');
  });

  it('yeni başvuru moderatörlere bildirim gönderir', () => {
    const before = store.listNotifications(moderator).length;
    store.submitApplication({
      name: 'Deneysel Malzemeler Topluluğu',
      rootTopicId: store.getTopicBySlug('robotik')!.id,
      rationale: 'Yeni malzemelerle uğraşan küçük bir grubuz ve ortak bir alan istiyoruz. '.repeat(2),
      scope: 'online',
      provinceCode: null,
      districtCode: null,
      audience: 'Genel',
      rules: 'Saygılı olun.',
      applicantId: profileId('elif.demo'),
    });
    expect(store.listNotifications(moderator).length).toBeGreaterThan(before);
  });
});

describe('etkinlik hatırlatmaları', () => {
  const viewer = profileId('elif.demo');
  const target = eventId('izmir-model-roket-atolyesi');

  it('hatırlatma oluşturur ve bildirim üretir', () => {
    const reminder = store.createReminder(viewer, target);
    expect(reminder).not.toBeNull();
    expect(store.getReminders(viewer)).toHaveLength(1);
    expect(store.listNotifications(viewer)[0].type).toBe('event_reminder');
  });

  it('aynı etkinlik için tekrar hatırlatma oluşturmaz', () => {
    const first = store.createReminder(viewer, target);
    const second = store.createReminder(viewer, target);
    expect(second?.id).toBe(first?.id);
    expect(store.getReminders(viewer)).toHaveLength(1);
  });

  it('hatırlatma etkinlikten önceye kurulur', () => {
    const reminder = store.createReminder(viewer, target)!;
    const event = store.getEvent(target)!;
    expect(new Date(reminder.remindAt).getTime()).toBeLessThan(new Date(event.startsAt).getTime());
  });

  it('iptal edilen hatırlatma listede görünmez', () => {
    store.createReminder(viewer, target);
    expect(store.cancelReminder(viewer, target)).toBe(true);
    expect(store.getReminders(viewer)).toHaveLength(0);
  });

  it('hatırlatmalar kişiseldir: başka kullanıcı göremez', () => {
    store.createReminder(viewer, target);
    expect(store.getReminders(profileId('baran.demo'))).toHaveLength(0);
  });
});

describe('konum mahremiyeti', () => {
  it('konumu gizli olan kullanıcı yerel kişi sonuçlarında görünmez', () => {
    const hidden = store.listProfiles().find((profile) => profile.locationVisibility === 'online_only')!;
    const results = store.discover({ provinceCode: hidden.provinceCode ?? '35' });
    expect(results.profiles.some((entry) => entry.id === hidden.id)).toBe(false);
  });

  it('yalnızca il düzeyinde paylaşan kullanıcı ilçe filtresinde çıkmaz', () => {
    const provinceOnly = store
      .listProfiles()
      .find((profile) => profile.locationVisibility === 'province' && profile.provinceCode === '34');
    expect(provinceOnly).toBeDefined();

    const results = store.discover({ provinceCode: '34', districtCode: '34-01' });
    expect(results.profiles.some((entry) => entry.id === provinceOnly!.id)).toBe(false);
  });

  it('konum kaldırıldığında profil yerel sonuçlardan çıkar', () => {
    const target = profileId('elif.demo');
    expect(store.discover({ provinceCode: '35' }).profiles.some((p) => p.id === target)).toBe(true);

    store.updateProfile(target, { locationVisibility: 'hidden', provinceCode: null, districtCode: null });

    expect(store.discover({ provinceCode: '35' }).profiles.some((p) => p.id === target)).toBe(false);
  });
});

describe('nGazete ve gelir modeli', () => {
  const admin = profileId('admin.demo');

  it('bugünün sayısı Europe/Istanbul gününe göre bulunur', () => {
    // Sunucu UTC'de calisirken 21:00'den sonra Istanbul ertesi gune gecer.
    // Sayi tarihi sunucu gunune gore uretilseydi "bugunun sayisi" kaybolurdu.
    const lateUtc = new Date('2026-08-18T23:30:00Z');
    const lateStore = new DemoStore(lateUtc);
    expect(toIstanbulDateKey(lateUtc)).toBe('2026-08-19');
    expect(lateStore.hasIssueForToday(lateUtc)).toBe(true);
    expect(lateStore.getIssueByDate('2026-08-19')).not.toBeNull();
  });

  it('sponsorlu kartların hepsinin sponsoru bilinir', () => {
    for (const issue of store.listIssues()) {
      for (const entry of issue.items) {
        if (entry.item.sponsored) expect(entry.item.sponsorName).toBeTruthy();
      }
    }
  });

  it('her sayıda editoryal içerik vardır: gazete yalnızca reklamdan oluşmaz', () => {
    for (const issue of store.listIssues()) {
      const editorial = issue.items.filter((entry) => !entry.item.sponsored);
      const sponsored = issue.items.filter((entry) => entry.item.sponsored);
      expect(editorial.length).toBeGreaterThan(sponsored.length);
    }
  });

  it('onaylanan ilan gazete sayısına sponsorlu kart olarak eklenir', () => {
    const pending = store.listAdRequests('pending')[0];
    const issueDate = store.getLatestIssue()!.issue.issueDate;
    const before = store.getIssueByDate(issueDate)!.items.length;

    store.reviewAdRequest(pending.request.id, admin, 'approved', issueDate);

    const after = store.getIssueByDate(issueDate)!;
    expect(after.items.length).toBe(before + 1);
    expect(after.items[after.items.length - 1].item.sponsored).toBe(true);
  });

  it('KRİTİK: onaylanan ilan hiçbir kullanıcının akış sıralamasını değiştirmez', () => {
    const viewer = profileId('elif.demo');
    const before = store.getFeed({ viewerId: viewer, limit: 100 }).map((view) => view.post.id);

    const pending = store.listAdRequests('pending')[0];
    store.reviewAdRequest(pending.request.id, admin, 'approved', store.getLatestIssue()!.issue.issueDate);

    const after = store.getFeed({ viewerId: viewer, limit: 100 }).map((view) => view.post.id);
    expect(after).toEqual(before);
  });

  it('gazete içeriği akışa hiç girmez', () => {
    const feedIds = new Set(store.getFeed({ viewerId: null, limit: 500 }).map((view) => view.post.id));
    for (const issue of store.listIssues()) {
      for (const entry of issue.items) {
        expect(feedIds.has(entry.item.id)).toBe(false);
      }
    }
  });

  it('reddedilen ilan yayımlanmaz', () => {
    const pending = store.listAdRequests('pending')[0];
    const issueDate = store.getLatestIssue()!.issue.issueDate;
    const before = store.getIssueByDate(issueDate)!.items.length;

    store.reviewAdRequest(pending.request.id, admin, 'rejected');

    expect(store.getIssueByDate(issueDate)!.items.length).toBe(before);
  });
});

describe('beğeni ve kaydetme', () => {
  const viewer = profileId('baran.demo');

  it('beğeni sayacı iki yönde de doğru çalışır', () => {
    const post = store.getFeed({ viewerId: viewer, limit: 1 })[0].post;
    const before = post.likeCount;

    expect(store.toggleLike(viewer, post.id)).toBe(true);
    expect(store.getPost(post.id)!.likeCount).toBe(before + 1);

    expect(store.toggleLike(viewer, post.id)).toBe(false);
    expect(store.getPost(post.id)!.likeCount).toBe(before);
  });

  it('kaydedilenler kişiseldir', () => {
    const post = store.getFeed({ viewerId: viewer, limit: 1 })[0].post;
    store.toggleSave(viewer, post.id);
    expect(store.listSavedPosts(viewer).map((view) => view.post.id)).toContain(post.id);
    expect(store.listSavedPosts(profileId('elif.demo')).map((view) => view.post.id)).not.toContain(post.id);
  });
});

describe('takip', () => {
  it('kullanıcı kendini takip edemez', () => {
    const viewer = profileId('elif.demo');
    expect(store.toggleFollow(viewer, viewer)).toBe(false);
    expect(store.isFollowing(viewer, viewer)).toBe(false);
  });

  it('takip sayacı güncellenir', () => {
    const viewer = profileId('elif.demo');
    const target = profileId('zeynep.bio');
    const before = store.getProfile(target)!.followerCount;

    store.toggleFollow(viewer, target);
    expect(store.getProfile(target)!.followerCount).toBe(before + 1);

    store.toggleFollow(viewer, target);
    expect(store.getProfile(target)!.followerCount).toBe(before);
  });
});

describe('kimlikler kararlıdır', () => {
  it('aynı anahtar için aynı kimlik üretilir', () => {
    expect(uid('project', 'ruzgar-olcer')).toBe(uid('project', 'ruzgar-olcer'));
  });

  it('farklı anahtarlar farklı kimlik üretir', () => {
    expect(uid('project', 'a')).not.toBe(uid('project', 'b'));
    expect(uid('project', 'a')).not.toBe(uid('post', 'a'));
  });

  it('UUID biçimindedir', () => {
    expect(uid('post', 'x')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('yeniden başlatmada kimlikler değişmez: paylaşılan bağlantılar bozulmaz', () => {
    const first = new DemoStore(NOW).getProjectBySlug('ruzgar-olcer')!.id;
    const second = new DemoStore(new Date('2027-01-01T00:00:00Z')).getProjectBySlug('ruzgar-olcer')!.id;
    expect(second).toBe(first);
  });
});
