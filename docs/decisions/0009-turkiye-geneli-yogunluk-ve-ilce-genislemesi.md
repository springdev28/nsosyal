# 0009 - Türkiye geneli yoğunluk haritası ve genişletilebilir ilçe katmanı

**Durum:** Kabul edildi

## Bağlam

İlk Nerede implementasyonu Türkiye province polygon'larını gösteriyor, fakat
harita esas olarak region selection görevi yapıyordu. Ayrıca repo yalnızca İzmir
icin district GeoJSON içerdiği için bu implementasyon sınırı zamanla ürünün
"pilot city" kararı gibi yorumlandı.

Bu yorum ürün amacını karşılamaz. Kullanıcının asıl sorusu yalnızca "bu region'ı
seç" değil, "seçtiğim topic/entity türünde Türkiye'nin nerelerinde daha fazla
hareket var?"dır.

## Karar

Nerede product architecture Türkiye-wide'dır.

Province-level map, aktif query için density/choropleth gösterir. Query en az:

- topic;
- metric/entity type;
- time range

bağlamlarını taşıyabilir. Participation/online-hybrid gibi ek filtreler ihtiyaç
olduğunda aynı query modeline eklenir.

Örnek metric'ler:

- communities;
- events;
- projects;
- institutions;
- people;
- posts;
- resources;
- opportunities.

Her metric mevcut veri desteğine göre açılır.

Density population değildir. Her region için selected entity count veya aynı
query içindeki normalized score hesaplanır. UI raw count/value ve low-high legend
sunmalıdır.

Color scale tek nSosyal blue/cyan family kullanır. Rainbow red/yellow/green
heatmap kullanılmaz.

## District modeli

Province seçildiğinde region detail açılır. District data varsa aynı query
architecture district düzeyinde tekrar çalışır.

İzmir district GeoJSON'unun mevcut olması yalnızca mevcut veri envanteridir.
Ürün hiçbir city'yi özel pilot olarak tanımlamaz. Yeni district data eklemek map
logic'ini veya product information architecture'i değiştirmemelidir.

## Privacy

Harita kişisel canlı konum haritası değildir. User kendi location'ını paylaşmadan
bütün Türkiye map'ini keşfedebilir. Exact/live individual coordinates saklanmaz veya
gösterilmez.

Personal location tercihi yalnızca local-person visibility ve recommendation
uygunluğunu etkileyebilir.

## Accessibility

Her density result eşdeğer text/list view'da bulunmalıdır. Region selection,
metric value ve entity results keyboard ile erişilebilir olmalıdır. Color tek
başına value/state taşımamalıdır.

## Sonuçlar

- Nerede bir demo map değil, gerçek discovery surface olur.
- Büyük şehirler ve farklı bölgeler tek architecture içinde karşılaştırılabilir.
- District coverage veri eklenerek büyür.
- Demo seed'in coğrafi dağılımı ürün kapsamını daha doğru temsil etmelidir.

## İlişkili kararlar

- [0003](0003-yerel-geojson-ile-tile-sunucusuz-harita.md): dış tile bağımlılığı
  olmadan yerel polygon katmanı.
- [0006](0006-tasarim-dilini-canli-siteden-almak.md): mevcut nSosyal görsel dili.
