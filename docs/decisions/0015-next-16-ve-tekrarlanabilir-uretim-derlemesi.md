# 0015 · Next 16 ve tekrarlanabilir üretim derlemesi

Tarih: 23 Ağustos 2026
Durum: Kabul edildi

## Bağlam

Next 15.5.23 üretim ağacında doğrudan uygulama kodundan kaynaklanmayan üç yüksek
seviye npm güvenlik kaydı kalıyordu. npm'in güvenli güncelleme yolu Next 16 ana
sürümüne geçişti. Next 16 ayrıca React render saflığı, ref kullanımı ve effect
içindeki senkron state zincirleri için daha sıkı lint kuralları getiriyor.

Next 16 varsayılan olarak Turbopack ile derlenir. Bu çalışma ortamında Turbopack'in
PostCSS işçisi yerel bir port açmaya çalıştığında işletim sistemi `EPERM` ile
engelliyor. Aynı kaynak ağacı Next 16'nın desteklenen Webpack yolu ile hatasız
derleniyor. Hostinger ve Render'ın aynı komutu kullanması, yerelde doğrulanan
çıktıyla dağıtım çıktısı arasındaki farkı azaltır.

## Karar

- Next, React, React DOM ve bunların tip paketleri açıklanabilir tekrarlar için
  tam sürüme sabitlenir.
- Next 16'nın kaldırdığı `next.config.ts > eslint` ayarı silinir; resmi flat ESLint
  dizileri doğrudan içe aktarılır.
- `npm run build`, `next build --webpack` çalıştırır. Bu bir framework geri dönüşü
  değildir; uygulama hâlâ Next 16 App Router kullanır, yalnız üretim paketleyicisi
  açıkça seçilir.
- React 19 render saflığı uyarıları kapatılmaz. Zaman kararı ViewModel'e taşınır,
  hydration ve hareket tercihi `useSyncExternalStore` ile okunur, MapLibre ref
  köprüsü effect sınırında tutulur ve Yayın Atölyesi bloğu saf alt bileşene ayrılır.
- ESLint 9.39.2 şimdilik korunur. ESLint 10.9.0 denendi ancak Next 16.3.2'nin
  paketlediği `eslint-plugin-import`, `eslint-plugin-jsx-a11y` ve
  `eslint-plugin-react` sürümleri ESLint 10'u peer aralığına almıyor; `npm ls`
  geçersiz bağımlılık ağacı raporluyor. Alt eklentiler destek verdiğinde bu karar
  yeniden gözden geçirilir.

## Sonuçlar

- Üretim bağımlılıklarında npm audit sonucu sıfır açığa iner.
- Yerel, Hostinger ve Render derlemeleri aynı açık Webpack komutunu kullanır.
- Yeni React yaşam döngüsü kodu hikâye portalı, gazete modalı, harita ve 5N seçici
  arasında ortak ve test edilebilir bir tarayıcı tercihi katmanı kullanır.
- Turbopack daha sonra yeniden denenebilir; bu karar onun uygulama geliştirmede
  kullanılmasını yasaklamaz, yalnız yayın kapısını deterministik tutar.
