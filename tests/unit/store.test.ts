import { beforeEach, describe, expect, it } from 'vitest';

import { DemoStore } from '@/lib/data/store';
import { DISTRICT_DATA_PROVINCES } from '@/lib/geo';
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

  it('81 ilin tamamında ilçe haritası ve yoğunluk özeti vardır', () => {
    expect(DISTRICT_DATA_PROVINCES).toHaveLength(81);
    expect(store.getDistrictSummaries('06').length).toBeGreaterThan(20);
    expect(store.getDistrictSummaries('35').some((district) => district.name === 'Bornova')).toBe(true);
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

describe('Yayın Atölyesi alan hakkı', () => {
  const ownerA = profileId('elif.demo');
  const ownerB = profileId('baran.demo');
  const rect = { x: 2, y: 3, width: 8, height: 6 };

  it('her an sonraki yedi açık sayı ve en fazla beş sayfa sunar', () => {
    const windows = store.listPublicationWindows(NOW);
    expect(windows).toHaveLength(7);
    expect(windows.every((window) => window.open)).toBe(true);
    expect(new Date(windows[0].closesAt).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('rezervasyon niyettir; başka kullanıcının ödemesini engellemez', () => {
    const issueDate = store.listPublicationWindows(NOW)[0].issueDate;
    const first = store.startPublicationDraft(ownerA, { issueDate, page: 1, rect }, NOW);
    const second = store.startPublicationDraft(ownerB, { issueDate, page: 1, rect }, NOW);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(store.reservePublicationArea(ownerA, first.draft.id, first.draft.revision, NOW).ok).toBe(true);
    const savedSecond = store.savePublicationDraft(ownerB, second.draft.id, {
      blocks: [{
        id: uid('publication-block', 'reservation-payment'), role: 'creative', type: 'image',
        ...rect, content: '/uploads/publication/reservation.png', altText: 'Rezervasyon ilanı',
        color: '#FFFFFF', borderRadius: 0, objectFit: 'contain', archived: false,
      }],
      anonymous: false,
      revision: second.draft.revision,
      submit: true,
    }, NOW);
    if (!savedSecond.ok) return;
    const paid = store.purchasePublicationArea(ownerB, second.draft.id, savedSecond.draft.revision, NOW);
    expect(paid.ok).toBe(true);
    if (paid.ok) expect(paid.price).toBe(456);
  });

  it('kesin satın alınmış alan ödeme başlamadan çakışmayı durdurur', () => {
    const issueDate = store.listPublicationWindows(NOW)[0].issueDate;
    const first = store.startPublicationDraft(ownerA, { issueDate, page: 2, rect }, NOW);
    const second = store.startPublicationDraft(ownerB, { issueDate, page: 2, rect }, NOW);
    if (!first.ok || !second.ok) return;

    const creative = (suffix: string) => ({
      id: uid('publication-block', suffix), role: 'creative' as const, type: 'image' as const,
      ...rect, content: `/uploads/publication/${suffix}.png`, altText: 'Gazete ilan tasarımı',
      color: '#FFFFFF', borderRadius: 0, objectFit: 'contain' as const, archived: false,
    });
    const savedFirst = store.savePublicationDraft(ownerA, first.draft.id, { blocks: [creative('paid-first')], anonymous: false, revision: first.draft.revision, submit: true }, NOW);
    const savedSecond = store.savePublicationDraft(ownerB, second.draft.id, { blocks: [creative('paid-second')], anonymous: false, revision: second.draft.revision, submit: true }, NOW);
    if (!savedFirst.ok || !savedSecond.ok) return;
    expect(store.purchasePublicationArea(ownerA, first.draft.id, savedFirst.draft.revision, NOW).ok).toBe(true);
    const result = store.purchasePublicationArea(ownerB, second.draft.id, savedSecond.draft.revision, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('conflict');
  });

  it('alan dışındaki blok kaydedilemez, alan değişince bloklar arşivlenir', () => {
    const issueDate = store.listPublicationWindows(NOW)[0].issueDate;
    const started = store.startPublicationDraft(ownerA, { issueDate, page: 3, rect }, NOW);
    if (!started.ok) return;
    const block = {
      id: uid('publication-block', 'outside'),
      role: 'creative' as const,
      type: 'image' as const,
      x: 0,
      y: 0,
      width: 4,
      height: 4,
      content: '/uploads/publication/test.png',
      altText: 'Deney tasarımı',
      color: '#E9EFF7',
      borderRadius: 8,
      objectFit: 'cover' as const,
      archived: false,
    };
    const rejected = store.savePublicationDraft(ownerA, started.draft.id, {
      blocks: [block],
      anonymous: false,
      revision: started.draft.revision,
    }, NOW);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.code).toBe('outside');

    const inside = { ...block, x: 3, y: 4 };
    const saved = store.savePublicationDraft(ownerA, started.draft.id, {
      blocks: [inside],
      anonymous: false,
      revision: started.draft.revision,
    }, NOW);
    if (!saved.ok) return;
    const resized = store.resizePublicationDraft(ownerA, saved.draft.id, { x: 12, y: 4, width: 8, height: 6 }, saved.draft.revision, NOW);
    expect(resized.ok).toBe(true);
    if (resized.ok) {
      expect(resized.draft.blocks).toHaveLength(0);
      expect(resized.draft.archivedBlocks).toHaveLength(1);
    }
  });

  it('standart ve abone CTA sınırlarını sunucuda uygular', () => {
    const issueDate = store.listPublicationWindows(NOW)[0].issueDate;
    const started = store.startPublicationDraft(ownerA, { issueDate, page: 4, rect }, NOW);
    if (!started.ok) return;

    const creative = {
        id: uid('publication-block', 'creative-standard'),
        role: 'creative' as const,
        type: 'image' as const,
        x: 3,
        y: 4,
        width: 6,
        height: 4,
        content: '/uploads/publication/standard.png',
        altText: 'Standart ilan tasarımı',
        color: '#FFFFFF',
        borderRadius: 0,
        objectFit: 'contain' as const,
        archived: false,
      };
    const externalButton = {
      id: uid('publication-block', 'external-button'),
      role: 'cta' as const,
      type: 'shape' as const,
      x: 3,
      y: 8,
      width: 5,
      height: 1,
      content: 'Siteye git',
      linkUrl: 'https://example.com',
      altText: '',
      color: '#FFFFFF',
      backgroundColor: '#2563EB',
      borderRadius: 999,
      objectFit: 'contain' as const,
      buttonVariant: 'gradient' as const,
      animation: 'shine' as const,
      archived: false,
    };
    const rejected = store.savePublicationDraft(ownerA, started.draft.id, {
      blocks: [creative, externalButton],
      anonymous: false,
      revision: started.draft.revision,
    }, NOW);
    expect(rejected.ok).toBe(false);

    const subscriberDraft = store.startPublicationDraft(ownerB, { issueDate, page: 5, rect }, NOW);
    if (!subscriberDraft.ok) return;
    const saved = store.savePublicationDraft(ownerB, subscriberDraft.draft.id, {
      blocks: [{ ...creative, id: uid('publication-block', 'creative-subscriber') }, externalButton],
      anonymous: false,
      revision: subscriberDraft.draft.revision,
      submit: true,
    }, NOW);
    expect(saved.ok).toBe(true);
    if (saved.ok) expect(saved.draft.blocks[1]).toMatchObject({ linkUrl: 'https://example.com', buttonVariant: 'gradient', animation: 'shine' });
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

  it('gizli hesapta doğrudan takip yerine onay isteği oluşturur', () => {
    const viewer = profileId('elif.demo');
    const target = profileId('zeynep.bio');
    store.updateProfile(target, { isPrivate: true });

    expect(store.toggleFollow(viewer, target)).toBe(false);
    expect(store.isFollowing(viewer, target)).toBe(false);
    expect(store.hasFollowRequest(viewer, target)).toBe(true);
    expect(store.canViewProfile(target, viewer)).toBe(false);

    expect(store.resolveFollowRequest(target, viewer, true)).toBe(true);
    expect(store.isFollowing(viewer, target)).toBe(true);
    expect(store.canViewProfile(target, viewer)).toBe(true);
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

/**
 * Kalici platform amaclari yalnizca bir profil alani degil, siralamayi gercekten
 * degistiren bir katman olmali (PROJECT_SPEC 7.10 / 17.18-10). Aksi hâlde
 * "iki katmanli kisisellestirme" iddiasi arayuzde kalirdi.
 */
describe('kalıcı platform amaçları akışı etkiler', () => {
  it('yerel ekosistem amacı, aynı kullanıcı için yerel içeriği yukarı taşır', () => {
    const store = new DemoStore();
    const viewer = store.getProfileByUsername('elif.demo');
    expect(viewer).toBeTruthy();
    if (!viewer) return;

    const localFirst = store.getFeed({ viewerId: viewer.id, intentMode: null, limit: 40 });

    store.updateProfile(viewer.id, { goalKeys: ['casual_discussion', 'socialize'] });
    const socialFirst = store.getFeed({ viewerId: viewer.id, intentMode: null, limit: 40 });

    // Ayni veri, ayni mod (yok), yalnizca amaclar farkli -> siralama farkli.
    const a = localFirst.map((entry) => entry.post.id).join(',');
    const b = socialFirst.map((entry) => entry.post.id).join(',');
    expect(a).not.toEqual(b);
  });

  it('mod seçilmemişken de kişiselleştirilmiş bir akış döner', () => {
    const store = new DemoStore();
    const viewer = store.getProfileByUsername('elif.demo');
    if (!viewer) return;

    const feed = store.getFeed({ viewerId: viewer.id, intentMode: null, limit: 10 });
    expect(feed.length).toBeGreaterThan(0);
    // Siralama gerekce uretebiliyorsa kisisellestirme calisiyor demektir.
    expect(feed.some((entry) => entry.reason !== null)).toBe(true);
  });
});
