# Demo

Prototip demo moduyla gelir: veri sunucu belleğinde üretilir, hiçbir dış servise
bağlanılmaz. Kurulum için Supabase projesi, API anahtarı veya internet gerekmez.

```bash
npm install && npm run dev     # http://localhost:3000
```

Sunum için `npm run build && npm start` tercih edilir; geliştirme sunucusunun ilk
derleme gecikmeleri sahnede fark edilir.

## Demo hesapları

Giriş ekranında dört hesap kart olarak listelenir; **tıklamak yeterlidir, parola
yoktur.** Tüm hesaplar sentetiktir ve arayüzde `demo` rozetiyle işaretlenir.

| Hesap | Rol | Neyi gösterir |
| --- | --- | --- |
| **Elif** — gündelik kullanıcı | `user` | Ana akış, harita keşfi, topluluğa katılma, etkinlik hatırlatma. İzmir/Bornova, konumunu ilçe düzeyinde paylaşıyor. |
| **Baran** — üreten kullanıcı | `user` | Proje oluşturma, pitch videosu, Neden hikâyesi. Rüzgâr ölçer projesinin kurucusu. |
| **Ege Teknopark** — kurum | `organization` | Etkinlik duyurusu, nGazete ilan başvurusu. Doğrulanmış kurum hesabı. |
| **Deniz** — moderatör | `moderator` | Topluluk onay kuyruğu, raporlar, moderasyon kayıtları. |

Hesap değiştirmek için **Ayarlar → Çıkış yap** (`/settings`) sonra giriş ekranından
başka bir kart seçilir.

## Seed veri seti

| Varlık | Adet |
| --- | --- |
| Profil (kişi + kurum) | 21 |
| Konu | 8 |
| Topluluk (kök + dal) | 18 |
| Gönderi | 60 |
| Kısa video | 21 |
| Proje | 9 |
| Etkinlik | 12 |
| Neden hikâyesi | 12 |
| Nasıl kaynağı | 15 |
| Gazete sayısı | 3 |
| Sponsorlu ilan başvurusu | 4 |

Tarihler çalıştırma anına göre üretilir: "bugün" her zaman bugündür, geçmiş ve
gelecek etkinlikler her demoda anlamlı kalır. Kimlikler deterministiktir, bu yüzden
`/projects/ruzgar-olcer` gibi bağlantılar sunucu yeniden başlasa da çalışır.

## 6–8 dakikalık sunum sırası

| Süre | Ne gösterilir | Nerede |
| --- | --- | --- |
| 0:20 | Problem ve ürün cümlesi | — |
| 0:45 | Gündelik sosyal içerik, kısa video, "Neden gösteriliyor?" | `/feed`, `/video` |
| 1:30 | Keşfet → Nerede → İzmir → tarih filtresi → etkinlik → hatırlatma | `/explore/map`, `/explore/time` |
| 1:00 | Topluluk sayfası ve Nasıl kaynakları | `/communities/izmir-havacilik` |
| 1:00 | Neden hikâyesi → bağlı proje sayfası | `/explore/why` → `/projects/ruzgar-olcer` |
| 1:00 | nGazete, sponsorlu alan ve akış sıralamasından ayrılığı | `/newspaper` |
| 0:45 | Moderatörün topluluk başvurusunu onaylaması | `/admin/moderation` (Deniz ile) |
| 0:30 | Ölçüm, erişilebilirlik ve mimari özeti | `/about` |

Vurgulanacak üç fark:

1. **Bağlam:** her kart nerede/ne zaman/hangi topluluk bilgisini taşıyor, ama bunu
   doldurmak zorunlu değil.
2. **Açıklanabilirlik:** "Neden gösteriliyor?" gerçek bir sinyali söylüyor; kara
   kutu yok.
3. **Ayrım:** ücretli görünürlük yalnızca gazetede. Akışta sponsorlu içerik yok —
   bu bir tercih değil, kod düzeyinde kısıt.

## İlk oturumda gazete

nGazete günün sayısıyla oturum başına bir kez açılır ve kapatma düğmesi kısa bir
gecikmeden sonra etkinleşir (gelir modelinin gösterimi). Erişilebilirlik
tercihlerinde bu gecikme kalkar. Sunumda kapatıp akışa geçmek yeterlidir; gazeteye
sol gezinmeden istediğiniz zaman dönebilirsiniz.

## Demo dayanıklılığı

- **Ağ yok, servis yok.** Harita, video, görseller, veri — hepsi repodan gelir.
  Etkinlikteki internet çökse bile demo çalışır.
- **Tek tıkla giriş.** Sahnede parola yazılmaz.
- **Yerel harita.** Tile sunucusu kullanılmadığı için harita her koşulda açılır;
  harita bir şekilde yüklenemezse sayfa aynı sonuçları liste olarak gösterir.
- **Küçük videolar.** 21 klip toplam ~6 MB, hepsi önceden yüklenmiş.
- **Sıfırlama.** `POST /api/demo/reset` seed'i yeniden üretir (yalnızca demo
  modunda). Provalar arasında temiz başlangıç için kullanılabilir.
- **Aynı commit.** Sunumdan önce üretim derlemesi ve yerel derleme aynı commit'te
  denenmelidir.
- **Yedek.** İnternet veya cihaz sorununa karşı kısa bir ekran kaydı hazır
  bulundurulmalıdır.

## Sık sorulan iki soru

**"Veriler gerçek mi?"** Hayır. Tümü bu prototip için üretilmiş sentetik veridir ve
arayüzde `demo` olarak işaretlenir. Gerçek kişi veya kurum taklit edilmez.

**"Sıralamada yapay zekâ var mı?"** Hayır. Ağırlıklı, açıklanabilir bir skor
kullanılır; ağırlıklar `/about` sayfasında tablo olarak yayımlanır. Doğrulanmamış
bir model, ürün vaadinin arkasına saklanacak bir kutu olurdu.
