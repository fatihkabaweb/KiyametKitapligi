---
baslik: Güneş Paneli, Akü ve 12 Volt Sistemler
ozet: Küçük bir güneş enerjisi sistemini doğru boyutlandırmak, kurmak ve aküleri güvenle kullanmak için hesaplar ve kurallar.
etiketler: güneş paneli, solar, akü, batarya, şarj kontrol cihazı, mppt, pwm, invertör, 12 volt, lifepo4, watt, amper, enerji
sira: 2
---

Küçük bir güneş paneli ve bir akü; aydınlatma, telefon ve telsiz şarjı, radyo ve hatta bir dizüstü bilgisayar için yıllarca sessiz ve yakıtsız enerji sağlayabilir. Sistem yanlış boyutlandırılırsa akü birkaç ayda bozulur; yanlış kurulursa yangın çıkabilir. Bu makale, temel hesapları ve güvenlik kurallarını adım adım verir.

## Temel Kavramlar

| Kavram | Birim | Açıklama |
|---|---|---|
| Gerilim | Volt (V) | Elektriğin "basıncı". Küçük sistemler genellikle 12 V'tur. |
| Akım | Amper (A) | Akan elektriğin miktarı. Kablo kalınlığını akım belirler. |
| Güç | Watt (W) | **W = V × A.** Bir cihazın anlık tükettiği enerji. |
| Enerji | Watt-saat (Wh) | **Wh = W × saat.** Günlük ihtiyacınızı bununla hesaplarsınız. |
| Akü kapasitesi | Amper-saat (Ah) | **Wh = V × Ah.** 12 V 100 Ah akü = 1200 Wh (kâğıt üzerinde). |

## Bir Sistemin Parçaları

1. **Güneş paneli:** Işığı elektriğe çevirir. Üzerindeki watt değeri ideal koşullardaki gücüdür; gerçekte genellikle bunun **yüzde 70–80'i** alınır.
2. **Şarj kontrol cihazı:** Paneli aküye bağlar, aküyü aşırı şarjdan ve aşırı boşalmadan korur. **PWM** türü ucuzdur; **MPPT** türü daha pahalıdır ama özellikle soğuk havada ve düşük akü seviyesinde panelden belirgin şekilde daha fazla enerji alır.
3. **Akü:** Enerjiyi depolar.
4. **İnvertör:** Akünün 12 V doğru akımını 220 V alternatif akıma çevirir. Mümkün olduğunca **12 V ile doğrudan çalışan** cihazlar (USB şarj soketleri, 12 V lambalar) kullanın; her dönüşüm enerji kaybettirir.
5. **Sigortalar ve kablolar:** Yangına karşı tek korumanızdır.

## Adım Adım Boyutlandırma

### 1. Günlük tüketimi hesaplayın

| Cihaz | Güç | Süre (saat/gün) | Enerji (Wh/gün) |
|---|---|---|---|
| 2 adet LED lamba | 2 × 5 W | 5 | 50 |
| 2 telefon şarjı | yaklaşık 20 Wh/şarj | 1'er tam şarj | 40 |
| Radyo | 2 W | 4 | 8 |
| Dizüstü bilgisayar | 45 W | 2 | 90 |
| **Toplam** | | | **188** |

Kablo, kontrol cihazı ve invertör kayıpları için **yüzde 20** ekleyin: 188 × 1,2 ≈ **225 Wh/gün**.

Cihazın gücünü etiketinden okuyun. Etikette yalnızca amper yazıyorsa volt ile çarpın (ör. 12 V × 2 A = 24 W).

### 2. Aküyü seçin

Akü, güneşsiz geçen **2–3 günü** karşılayabilmelidir.

1. Gereken kullanılabilir enerji: 225 Wh × 2 gün = **450 Wh**.
2. Kurşun asitli akülerin ömrü için kapasitenin en fazla **yarısını** kullanın: 450 ÷ 0,5 = 900 Wh. 12 V'ta: 900 ÷ 12 = **75 Ah**. En yakın büyük boy: **100 Ah**.
3. Lityum demir fosfat (LiFePO4) akülerde kapasitenin yaklaşık **yüzde 80'i** güvenle kullanılabilir: 450 ÷ 0,8 ≈ 560 Wh, 12 V'ta yaklaşık **47 Ah**. En yakın büyük boy: **50 Ah**.

### 3. Paneli seçin

**Panel gücü (W) = Günlük ihtiyaç (Wh) ÷ (Tam güneş saati × 0,75)**

"Tam güneş saati", günlük güneş enerjisinin, panelin tam güçte çalıştığı saat sayısına çevrilmiş halidir. Türkiye'de kabaca **kışın 2–3**, **yazın 6–7** saattir; kuzeyde ve dağlık, bulutlu bölgelerde daha düşüktür.

- Kış için: 225 ÷ (2,5 × 0,75) = 120 W, yani **en az 150 W** panel.
- Yaz için: 225 ÷ (6 × 0,75) = 50 W yeterlidir.

Sistemi **kışa göre** boyutlandırın; yazın fazla enerjiyi başka işlerde kullanırsınız.

### 4. Şarj kontrol cihazını seçin

**Akım (A) = Panel gücü ÷ Akü gerilimi × 1,25**

150 W ÷ 12 V × 1,25 ≈ 16 A, yani **20 A**'lik bir kontrol cihazı. Panelin açık devre geriliminin (etikette "Voc") kontrol cihazının kabul ettiği en yüksek giriş geriliminin **altında** kaldığını kontrol edin; soğuk havada panel gerilimi yükselir.

### 5. İnvertörü seçin

Aynı anda çalışacak cihazların toplam gücünü **1,25** ile çarpın. Motorlu cihazlar (pompa, buzdolabı, matkap) çalışırken **birkaç kat** fazla kalkış gücü çeker. Bilgisayar ve tıbbi cihazlar için **tam sinüs** (pure sine) invertör kullanın. Kullanmadığınızda invertörü kapatın; boşta bile akü tüketir.

> [!UYARI] 12 V'ta büyük güç, büyük akım demektir
> 12 V'ta 1000 W çeken bir invertör aküden yaklaşık **90–100 amper** akım çeker. Bu, ince kabloları dakikalar içinde ısıtıp eritebilir. İnvertör kılavuzundaki kablo kesitine mutlaka uyun (bu güçte genellikle 25–35 mm² kalınlığında, mümkün olduğunca kısa kablolar önerilir). Büyük sistemler 24 V veya 48 V ile kurulur.

## Kurulum

1. Paneli Türkiye'de **güneye** bakacak şekilde yerleştirin.
2. Eğim açısı yaklaşık bulunduğunuz **enlem** kadar olsun (Türkiye'de 36–42 derece). Kışın enleme **15 derece ekleyin**, yazın **15 derece çıkarın**.
3. Panelin hiçbir kısmının gölgede kalmamasına dikkat edin. **Küçük bir gölge bile** üretimi büyük oranda düşürür.
4. Bağlantı sırası: **önce aküyü** kontrol cihazına, **sonra paneli** bağlayın. Sökerken tersini yapın: önce paneli, sonra aküyü ayırın. Kendi cihazınızın kılavuzunu kontrol edin.
5. Akünün artı (+) kutbuna, kutba **olabildiğince yakın** (mümkünse 20 cm içinde) bir ana sigorta takın. Sigorta değeri, kablonun taşıyabileceği akımdan düşük olmalıdır.
6. Kabloları kısa tutun, uçlarını pabuçla sıkıca bağlayın, renklerle işaretleyin (kırmızı artı, siyah eksi).
7. Paneli tozdan, kardan ve kuş pisliğinden arındırmak için ara ara suyla ve yumuşak bir bezle silin.

> [!TEHLIKE] Paneli doğrudan aküye bağlamayın
> Kontrol cihazı olmadan bağlanan bir panel aküyü aşırı şarj ederek bozar, kaynatır ve patlama riskini artırır. Yalnızca çok küçük, akü bakım amaçlı panellerde bu kuralın istisnası olabilir.

## Akü Türleri

| Tür | Artısı | Eksisi |
|---|---|---|
| Sulu kurşun asitli | Ucuz, her yerde bulunur | Saf su eklenmesi gerekir; şarjda **hidrojen gazı** çıkarır; havalandırma şart |
| Kapalı kurşun asitli (AGM, jel) | Bakım istemez, sızdırmaz | Pahalıdır; aşırı şarja hassastır |
| Otomobil (marş) aküsü | Kolay bulunur | Derin boşaltmaya uygun değildir; sık derin boşaltılırsa kısa sürede bozulur |
| Lityum demir fosfat (LiFePO4) | Hafif; binlerce şarj döngüsü; kapasitenin çoğu kullanılabilir | Pahalı; **0 °C'nin altında şarj edilmemelidir** |

### Kurşun asitli akünün doluluk oranı

Akü en az birkaç saat şarj ve yükten ayrı dinlendikten sonra ölçülen gerilim (yaklaşık değerler):

| Gerilim | Doluluk |
|---|---|
| 12,6 V ve üstü | yaklaşık yüzde 100 |
| 12,4 V | yaklaşık yüzde 75 |
| 12,2 V | yaklaşık yüzde 50 (bunun altına düzenli inmeyin) |
| 12,0 V | yaklaşık yüzde 25 |
| 11,9 V ve altı | boş |

Lityum akülerin gerilimi neredeyse sabit kaldığından doluluk gerilimle anlaşılmaz; dahili yönetim sisteminin göstergesine bakın.

## Akü Güvenliği

> [!TEHLIKE]
> - **Hidrojen gazı:** Kurşun asitli aküler şarj olurken patlayıcı hidrojen gazı çıkarır. Aküyü havadar bir yerde tutun; yakınında sigara, kıvılcım ve açık alev olmasın. Kutupları ayırırken veya bağlarken kıvılcım çıkabilir.
> - **Kısa devre:** Bir anahtar, tel veya yüzük artı ve eksi kutba aynı anda değerse metal kızarır, erir ve ciddi yanık oluşur. Yüzük, saat ve bileziği çıkarın; kutupların üstünü kapatın; aletleri akü üzerine koymayın.
> - **Asit:** Akü asidi gözü kör edebilir. Koruyucu gözlük ve eldiven kullanın. Göze veya cilde sıçrarsa **en az 15 dakika** bol suyla yıkayın. Dökülen asidi karbonat (sodyum bikarbonat) serperek nötralize edin.
> - **Donmuş akü:** Donmuş veya şişmiş bir aküyü şarj etmeyin; patlayabilir.
> - **Lityum aküler:** Hasarlı, şişmiş veya ısınan lityum aküyü kullanmayın. Lityum akü yangını söndürmesi zordur; aküyü yanıcı malzemelerden uzakta şarj edin.

## Pratik İpuçları

- Telefon ve küçük cihazlar için **USB çıkışlı katlanır güneş panelleri** ile **taşınabilir şarj cihazları** (powerbank) en basit sistemdir.
- Araç aküsünü şarj etmek için motoru çalıştırmanız gerekiyorsa aracı **asla kapalı garajda** çalıştırmayın: [[karbonmonoksit]].
- Gündüz, güneş varken en çok enerji harcayan işleri (bilgisayar, şarj) yapın; akü gece için dolu kalsın.
- Bir avometre (multimetre) bulundurun; gerilimi ölçmeden akünün durumunu bilemezsiniz.

## Akılda Tutun

- Wh = V × Ah ve W = V × A: tüm hesaplar bu iki formüle dayanır.
- Günlük tüketimi hesaplayın, yüzde 20 kayıp ekleyin, 2–3 günlük yedek akü planlayın.
- Kurşun asitli aküyü yarısının altına düzenli boşaltmayın; LiFePO4'ü donmuşken şarj etmeyin.
- Panel güneye, gölgesiz; sigorta aküye en yakın noktada.
- Hidrojen, kısa devre ve asit: aküyle çalışırken üçüne de dikkat edin.

**İlgili:** [[elektriksiz-yasam]], [[jenerator-ve-yakit]], [[sebeke-kesintisinde-iletisim]], [[olcu-ve-birimler]]
