# 0012 — 5N seçici: kenara yaslanan yarım disk, pencereli yay

**Durum:** Kabul edildi

## Bağlam

5N seçici bu depoda **üç kez** yazıldı. İki denemenin de sonu aynıydı: testler
yeşil, ekran kullanılamaz. Bu kaydın asıl amacı dördüncü bir denemeyi
engellemek, yani neyin neden yanlış olduğunu yazıya geçirmek.

**Birinci sürüm — görünmez yay.** Öğeler zemini olmayan bir yay üzerinde küçük
dairelere dağıtılmıştı. Uzaktaki öğeler %12 opaklıktaydı; gerçek ekranda toz
zerresi gibi duruyor, aktif öğe de arkasındaki kartlarla iç içe geçiyordu.
Seçicinin nerede başlayıp nerede bittiği görülmüyordu.

**İkinci sürüm — pasta menü.** Dilimli, okunaklı bir çark. Bu kez sorun
okunaklılık değil, mekaniğin kendisiydi: beş seçeneği de aynı anda gösterdiği
için PROJECT_SPEC 4.4/2'nin "yayın iki ucu giderek saydamlaşır ve viewport
içinde kaybolur" ve 4.4/4'ün "kullanıcı yayı döndürür" kuralları anlamsızlaşıyordu.
Döndürecek bir şey yoktu.

**Üçüncü sürüm — ilk hâli.** Dolu yarım disk fikri doğruydu ama panel
viewport'un `left: 0`'ına konumlandırılmıştı; oysa işaret Keşfet kolonunun sol
kenarındaydı. Panel işaretten koparak uygulamanın sol gezinme kolonunun üstüne
biniyor, merkezdeki N işareti de ekran dışında kalıp ikiye bölünüyordu. Zemin
sayfayla karışan bir gradyandı, dolayısıyla koyu temada "yay" diye algılanan bir
şey yoktu.

Ortak nokta: **her seferinde testler geçiyordu.** Çünkü testler "menuitem var
mı, tıklanıyor mu" diye soruyordu. Bu iki soru bir arayüzün kullanılabilir
olduğunu kanıtlamaz.

## Karar

Seçici, **işaretin yaslandığı duvara oturan dolu bir yarım disktir** ve
seçenekler bu diskin içindeki bir yay üzerinde **pencereli** olarak taşınır.

- Yarım diskin düz kenarı `anchor.x`'e, yani tetikleyicinin bulunduğu kolonun
  sol kenarına oturur. Viewport'un kenarına değil — panel işaretten kopmaz.
- Panel **opaktır** (`bg-bg-raised` + `ring`). Yayın nerede olduğu her temada
  bakışta bellidir.
- Merkezdeki animasyonlu N işareti duvara yaslanır, ortalanmaz: dairenin
  geometrik merkezi düz kenardadır ve oraya ortalanan bir düğmenin yarısı
  ekran dışında kalır.
- Aynı anda yaklaşık üç seçenek okunur durumdadır. `FADE_FROM`/`FADE_TO`
  penceresinin dışındaki öğeler saydamlaşır ama **DOM'dan silinmez**: menü
  semantiği beş boyutu da saymalı, ekran okuyucu listenin tamamını görebilmeli.
  Yalnızca boyaları ve işaretleme hedefleri kalkar.
- Yay tekerlek, sürükleme ve ok tuşlarıyla döner. Seçici açıkken sayfa kaydırma
  kilitlenir; aksi hâlde yayı çevirme jesti sayfayı kaydırıp seçiciyi parmağın
  altından kaçırıyordu.
- **Görünen herhangi bir seçeneğe dokunmak onu seçer.** Önce seçim noktasına
  kayar, sonra onaylanır. Önceki davranışta ilk dokunuş yalnızca döndürüyordu;
  kullanıcı gördüğü seçeneğe basıyor ve hiçbir şey olmuyordu.
- Sürükleme jestinin kuyruğundaki `click` seçim sayılmaz (`draggedRef`).
- `role="menu"` yalnızca öğeleri saran kutuya verilir. Panel zemini, yörünge
  izi, etiket ve göbek düğmesi menünün *dışındadır*; hepsi menünün içindeyken
  axe `aria-required-children` kuralını kritik seviyede ihlal ediyordu.

## Sonuçlar

- `tests/e2e/five-n-selector.spec.ts` artık ölçüyor: aktif öğenin opaklığı 1,
  dokunma hedefi ≥ 44×44, hiçbir kenarı viewport dışında değil, göbek işareti
  bütünüyle ekranda, en uzak boyutun opaklığı 0 ve açıkken sayfa kaymıyor.
  "Var ve tıklanabilir" testleri yeterli değildi; bu ölçümler o boşluğu kapatır.
- Yarım disk açıkken sayfa içeriğinin bir kısmını örter. Bu kabul edilmiştir:
  seçici modal bir jest yüzeyidir, arkasında karartma vardır ve seçim bitince
  tamamen kaybolur (spec 4.4/6).
- Marka işaretinin kendisi bu kararın kapsamında değildir; o Figma master
  vector'undan gelir ve elle düzeltilmez (spec 17.18/2).
