# Kıyamet Kitaplığı

**İnternet yokken de çalışan hayatta kalma kütüphanesi.** Afet, savaş, salgın, uzun süreli elektrik kesintisi ve yalnız hayatta kalma koşulları için hazırlanmış, telefona veya bilgisayara kurulabilen, içeriği **PDF olarak indirilebilen** ve **yazdırılabilen** bir bilgi arşivi.

> Bu kitaplıktaki bilgiler profesyonel tıbbi, hukuki veya teknik yardımın yerini tutmaz. Yardıma ulaşabiliyorsanız önce **112**'yi arayın.

## Neler var?

- **19 kategori, 100'ü aşkın makale:** ilk yardım, sağlık, su, gıda, barınak ve ısınma, yön bulma, iletişim, savaş ortamı, nükleer/kimyasal tehlikeler, deprem ve doğal afetler, hijyen, güvenlik, ruh sağlığı, beceriler, enerji, tarım ve hızlı başvuru tabloları.
- **Tamamen çevrim dışı:** Bir kez açıldıktan sonra her şey cihazda saklanır. Arama, PDF oluşturma ve yazdırma internetsiz çalışır.
- **ACİL ekranı:** Kalp masajı, kanama, boğulma, deprem, hava saldırısı, radyasyon gibi hayat kurtaran makalelere tek dokunuşla erişim; tek tuşla 112.
- **PDF ve yazdırma:** Tek makaleyi, bir kategoriyi, kaydettiklerinizi veya kitaplığın tamamını kapak sayfası ve içindekiler ile birlikte PDF'e dönüştürün ya da doğrudan yazdırın. A4 veya A5 (cep boyu), üç yazı boyutu.
- **Tek dosya paylaşımı:** Uygulamanın tamamı (~2,7 MB) tek bir `.html` dosyası olarak indirilebilir. Bu dosya USB, Bluetooth veya mesajla başkalarına verilir ve herhangi bir tarayıcıda kurulum gerektirmeden, internetsiz açılır. Tek dosya sürümü de kendini kopyalayabilir; böylece kitaplık elden ele çoğalır.
- **İşaretlenebilir kontrol listeleri:** Acil durum çantası, ev stoku, ilk yardım çantası vb.
- **Not defteri:** Envanter, ilaç listesi, buluşma noktaları, günlük. Notlar yalnızca cihazda saklanır ve PDF'e eklenebilir.
- **Kaydedilenler:** Kendi el kitabınızı oluşturup tek seferde PDF olarak indirin.
- **Türkçe duyarsız arama:** "su aritma" yazınca "su arıtma" bulunur.
- **Temalar:** Karanlık, aydınlık, yüksek kontrast ve gece görüşünü koruyan **kırmızı gece** teması. Ayarlanabilir yazı boyutu.
- **Gizlilik:** Hiçbir veri dışarı gönderilmez; izleme, reklam veya hesap yoktur.

## Nasıl kullanılır?

### 1. İnternet sitesinden kurma (önerilen)

Depo GitHub Pages ile yayınlandığında uygulama `https://<kullanıcı-adı>.github.io/<depo-adı>/` adresinde açılır.

1. Adresi telefonunuzda açın ve sayfanın tamamen yüklenmesini bekleyin. Ana sayfada **"İnternetsiz kullanıma hazır"** yazısını görmelisiniz.
2. **Android (Chrome):** Menü > *Uygulamayı yükle* / *Ana ekrana ekle*.
   **iPhone (Safari):** *Paylaş* > *Ana Ekrana Ekle*.
3. Artık uygulama ana ekranınızda; internet olmadan da açılır.

### 2. Tek dosya sürümü

`kiyamet-kitapligi.html` dosyasını indirin (sitede veya uygulama içinde *Menü > PDF / Yazdır / Paylaş > Tek dosya indir*). Dosyayı çift tıklayarak veya telefonda bir tarayıcıyla açın. Hiçbir kurulum gerekmez.

### 3. Kâğıt kopya

*Menü > PDF / Yazdır / Paylaş* ekranından kitaplığın tamamını veya seçtiğiniz bölümleri PDF olarak indirip yazdırın. Elektrik ve batarya biter, kâğıt kalır.

## GitHub Pages'te yayınlama

1. Depoda **Settings > Pages > Build and deployment > Source** seçeneğini **GitHub Actions** yapın.
2. `main` dalına her gönderimde `.github/workflows/yayinla.yml` testleri çalıştırır ve siteyi yayınlar.

## Geliştirme

Gereken tek şey [Node.js](https://nodejs.org) 18 veya üzeri; harici paket yoktur.

```bash
node tools/check.mjs       # içeriği doğrula
node tools/build.mjs       # app/data/library.js, sw.js, manifest ve dist/ tek dosyayı üret
node --test tools/test.mjs # testler
python3 -m http.server 8080 --directory app   # http://localhost:8080 adresinde çalıştır
```

### Uygulamanın adını değiştirmek

Ad yalnızca bir yerde tutulur: [`app/js/config.js`](app/js/config.js). `name` ve `shortName` alanlarını değiştirip `node tools/build.mjs` çalıştırmanız yeterli; sayfa başlığı, manifest, PDF kapakları ve tek dosya adı buradan beslenir.

### Klasör yapısı

```
content/            Makaleler (Markdown). Her klasör bir kategori.
  kategoriler.json  Kategori adları, simgeleri ve açıklamaları
  README.md         İçerik yazım rehberi
app/                Yayınlanan uygulama (statik dosyalar)
  index.html
  css/app.css       Tasarım, temalar ve yazdırma stili
  js/config.js      Uygulama adı ve temel ayarlar
  js/markdown.js    Bağımlılıksız Markdown ayrıştırıcı
  js/search.js      Çevrim dışı Türkçe arama
  js/pdf.js         PDF belge oluşturucu (pdfmake)
  js/bundle.js      Tek dosya paketleyici
  js/storage.js     Cihazdaki kullanıcı verileri
  js/app.js         Ekranlar ve yönlendirme
  sw.js             Çevrim dışı önbellek (service worker)
  data/library.js   Derlenmiş içerik (otomatik üretilir)
  vendor/pdfmake/   PDF motoru (MIT lisanslı)
tools/              Derleme, doğrulama ve test betikleri
```

## İçeriğe katkı

Yeni makale eklemek veya mevcut bir makaleyi düzeltmek için [`content/README.md`](content/README.md) rehberine bakın. Her değişiklikten sonra `node tools/check.mjs` ve `node tools/build.mjs` çalıştırın.

Doğruluk bu kitaplığın en önemli özelliğidir. Bir bilginin yanlış veya eski olduğunu düşünüyorsanız lütfen kaynağıyla birlikte bildirin.

## Üçüncü taraf bileşenler

- [pdfmake](https://github.com/bpampuch/pdfmake) 0.2.20, MIT lisansı. Roboto yazı tipi, Apache 2.0 lisansı.
