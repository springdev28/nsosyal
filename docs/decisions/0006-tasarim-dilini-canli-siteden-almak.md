# 0006 - Tasarım dilini mevcut nSosyal'dan almak

**Durum:** Kabul edildi, marka işareti ve 5N interaction kurallarıyla genişletildi

## Bağlam

Prototipin ilk arayüzleri yazılı spec'ten fazla serbest türetildiğinde ürün
nsosyal.com ailesinden uzaklaştı. Farklı renk kimliği, rainbow 5N tonları, fazla
neon/glow, açıklama kartları ve generic dashboard bileşenleri nSosyal'ın devamı
gibi görünmeyen bir sonuç üretti.

nSosyal 5N'in görevi yeni ve bağımsız bir sosyal network visual identity icat etmek
değil, mevcut nSosyal'ın üstüne özgün 5N discovery interaction'ını eklemektir.

## Karar: ürün görsel ailesi

Mevcut nSosyal source ana referanstır:

- dark-first surface hierarchy;
- desktop'ta tanıdık sidebar + content + gerektiğinde right rail;
- mobile bottom navigation;
- rounded social cards ve pill controls;
- nSosyal blue accent;
- controlled cyan yalnızca uygun accent/motion context'inde;
- tek tip SVG icon system.

Reference semantic values dokümanda yaklaşık olarak:

```text
base      #0A0F1A
raised    #131B28
sunken    #0E1420
hover     #1A2333
text      #E9EFF7
muted     #94A3B8
border    #1F2937
accent    #3D9BFF
```

Canlı nSosyal source farklı exact value kullanıyorsa canlı source kazanır.

5N boyutları birbirinden kopuk violet, green, rose, amber gibi rainbow identity
almaz. Aynı blue/cyan family içinde tutulur. Dimension ayrımı icon, label, state,
position ve işlevle sağlanır.

## Karar: marka işareti

nSosyal 5N marka geometrisinin source of truth'u takımın Figma'da oluşturduğu
**master vector**dür.

- screenshot tracing yapılmaz;
- approximate SVG path üretilmez;
- iki endpoint ring eşit outer diameter taşır;
- inner diameter eşittir;
- stroke eşittir;
- connecting line uniform monoline kalınlığındadır;
- taper veya big/small endpoint hierarchy yoktur;
- static logo effectsiz çalışır;
- particle/glow ayrı motion layer olabilir.

Bu geometri uygulama asset'i için exact export veya aynı vector data ile
kullanılmalıdır.

## Karar: 5N selector

5N navigation generic radial wheel değildir.

- closed state yalnızca N connection mark gösterir;
- N'ye basınca half arc açılır;
- arc iki uçta transparency'ye fade olur;
- Ne, Nerede, Ne zaman, Nasıl, Neden arc üzerinde hareket eder;
- drag/scroll selection point'e option getirir;
- candidate option görsel vurgu alır;
- selection kısa snap/confirm state'iyle tamamlanır;
- ardından selector tamamen kaybolur ve gerçek functional panel açılır;
- N mark panel üzerinde kalır ve selector'ı yeniden açar.

Normal UI'da sürekli `çevir`, `seçim noktası`, `selector kapanacak` gibi öğretici
metinler gösterilmez. İlk-use hint gerekiyorsa ayrı, kısa ve dismissible behavior
olmalıdır.

Reduced motion ve keyboard equivalent zorunludur.

## Karar: açıklama yoğunluğu

Primary UI bir interactive technical report değildir. Uzun feature rationale,
algorithm explanation, business-model theory ve architecture notes ana product
screen'lerde kart olarak gösterilmez.

Kullanıcı kararını etkileyen bilgiler görünür kalır:

- sponsored label;
- privacy/security choice;
- validation error;
- destructive action warning;
- accessibility-relevant instruction.

Diğer uzun açıklamalar About, Help, advertiser, admin veya docs'a taşınır.

## Sonuçlar

- nSosyal 5N mevcut ürün ailesinin bir extension'ı gibi görünür.
- 5N özgünlüğü renk şovundan değil interaction modelinden gelir.
- Brand asset yaklaşık çizimlerle drift etmez.
- UI density azalır, gerçek task flow daha görünür olur.

## Değerlendirilen alternatifler

- hazır generic component library visual identity: reddedildi;
- bağımsız neon/rainbow startup theme: reddedildi;
- full radial 5N wheel: reddedildi;
- screenshot'tan yeniden çizilen logo: reddedildi;
- product rationale'ını sürekli UI kartlarında göstermek: reddedildi.
