# İçerik Yazım Rehberi

Postapokaliptik.org'un tüm bilgisi bu klasördeki Markdown (`.md`) dosyalarındadır. Her klasör bir kategoridir (`kategoriler.json` içinde tanımlı), her dosya bir makaledir. Dosya adı makalenin kalıcı kimliğidir: `content/su/su-aritma.md` dosyasının kimliği `su-aritma` olur.

Yeni makale ekledikten veya bir makaleyi değiştirdikten sonra:

```
node tools/check.mjs    # içeriği doğrular
node tools/build.mjs    # uygulamanın veri dosyasını yeniden üretir
```

## Dosya yapısı

```markdown
---
baslik: Suyu İçilebilir Hale Getirme
ozet: Kaynatma, çamaşır suyu ve güneş ışığı ile suyu mikroplardan arındırma.
etiketler: su, arıtma, kaynatma, klor
sira: 3
acil: evet
---

Kısa giriş paragrafı: konu neden hayati, ne zaman gerekir (1-3 cümle).

## Birinci Bölüm

1. Numaralı adımlar
2. ...

## Akılda Tutun

- Makalenin 3-6 maddelik özeti.

**İlgili:** [[su-bulma]], [[filtre-yapimi]]
```

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `baslik` | evet | Makale başlığı. |
| `ozet` | evet | Listelerde ve aramada görünen tek cümlelik özet. |
| `etiketler` | hayır | Virgülle ayrılmış arama kelimeleri (eş anlamlılar, halk arasındaki adlar). |
| `sira` | hayır | Kategori içindeki sıra (küçük olan önce gelir). |
| `acil` | hayır | `evet` ise makale "ACİL" ekranında hızlı erişim düğmesi olarak görünür. Yalnızca hayat kurtaran, panik anında okunacak makaleler için. |

## Kullanılabilen biçimler

- `## Başlık` ve `### Alt başlık` (makale içinde `# ` kullanmayın; başlık ön bilgiden gelir)
- `**kalın**`, `*italik*`
- `- madde`, `1. numaralı adım`, iç içe listeler (2 boşluk girinti)
- `- [ ] kontrol listesi öğesi` — uygulamada işaretlenebilir, işaretler cihazda saklanır
- Tablolar: `| Başlık | Başlık |` ve altında `|---|---|`
- Uyarı kutuları:
  - `> [!TEHLIKE]` hayati tehlike (kırmızı)
  - `> [!UYARI]` dikkat edilmesi gereken (turuncu)
  - `> [!IPUCU]` pratik öneri (yeşil)
  - `> [!NOT]` ek bilgi (mavi)
  - Kutuya başlık verebilirsiniz: `> [!UYARI] Karbonmonoksit`
- İç bağlantı: `[[makale-kimligi]]` veya `[[makale-kimligi|görünen metin]]`

## Yazım ilkeleri

1. **Doğruluk her şeyden önce gelir.** Bilgiler Dünya Sağlık Örgütü (WHO), AFAD, Kızılay, Uluslararası Kızılhaç Komitesi (ICRC), CDC ve benzeri güvenilir kaynakların yönergeleriyle uyumlu olmalı. Emin olmadığınız bir sayı veya dozu yazmayın.
2. **Panik anında okunabilir olsun.** Kısa cümleler, numaralı adımlar, önce en kritik bilgi.
3. **Ölçülebilir yazın.** "Biraz kaynatın" değil, "fokurdadıktan sonra 1 dakika kaynatın".
4. **Tehlikeleri açıkça belirtin.** Yanlış uygulandığında zarar verebilecek her yöntem için `[!UYARI]` veya `[!TEHLIKE]` kutusu ekleyin.
5. **Profesyonel yardımın yerini tutmaz.** Tıbbi makalelerde, ulaşılabiliyorsa 112'yi aramayı ve sağlık personeline başvurmayı hatırlatın.
6. **Zarar vermeye yönelik bilgi yok.** Silah, patlayıcı veya zehir yapımı; başkalarına saldırma yöntemleri bu kütüphaneye girmez. Güvenlik içerikleri yalnızca korunma, kaçınma ve savunma odaklıdır.
7. **Yalnızca PDF yazı tipinde bulunan karakterler.** Emoji, ok (→) ve onay işareti (✓) gibi simgeler kullanmayın; `node tools/check.mjs` bunları yakalar. Türkçe harfler, `°`, `×`, `±`, `–`, `—`, `…`, `½`, `≈`, `≤`, `≥` serbesttir.
8. **Türkiye bağlamı.** Mümkün olduğunda Türkiye'deki kurumları, iklimi, bitkileri ve koşulları örnek verin; ancak bilgiler dünyanın her yerinde işe yarayacak şekilde genel kalsın.
