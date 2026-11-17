# Uzaylı · Fizik ve Elektronik sitesi

Astro ile yazılmış statik site. İçerik `src/content` altındaki MDX dosyalarında durur; menü, ana sayfa ve liste sayfaları bu dosyalardan ve `src/site.config.ts` dosyasından kendiliğinden oluşur.

İçindekiler:

1. [Bilgisayarında çalıştırma (macOS)](#1-bilgisayarında-çalıştırma-macos)
2. [GitHub'a yükleme](#2-githuba-yükleme)
3. [Yayınlama: GitHub Pages](#3-yayınlama-github-pages)
4. [Yayınlama: Vercel](#4-yayınlama-vercel)
5. [Kendi domain'ini bağlama](#5-kendi-domainini-bağlama)
6. [İçerik ekleme ve düzenleme](#6-içerik-ekleme-ve-düzenleme)
7. [Kara delik bileşeni](#7-kara-delik-bileşeni)
8. [Klasör yapısı](#8-klasör-yapısı)
9. [Sık karşılaşılan sorunlar](#9-sık-karşılaşılan-sorunlar)

---

## 1. Bilgisayarında çalıştırma (macOS)

**Bir kereye mahsus kurulum:**

1. **Node.js kur.** [nodejs.org](https://nodejs.org) adresinden LTS sürümünün macOS kurulum dosyasını (.pkg) indirip kur. Sürüm 22 ya da üstü olmalı.
2. **Terminal'i aç** (Spotlight'a `Terminal` yaz) ve kontrol et:
   ```bash
   node -v     # v22.x ya da üstü yazmalı
   git --version
   ```
   `git` kurulu değilse macOS kurmayı teklif eder; kabul et (ya da `xcode-select --install` yaz).
3. **Proje klasörüne gir ve bağımlılıkları indir.** Zip'i açtığın klasör Masaüstü'ndeyse:
   ```bash
   cd ~/Desktop/uzayli-site
   npm install
   ```

**Her çalışmada:**

```bash
cd ~/Desktop/uzayli-site
npm run dev
```

Tarayıcıda `http://localhost:4321` adresini aç. Bir dosyayı kaydettiğin anda sayfa kendiliğinden yenilenir. Durdurmak için Terminal'de `Ctrl + C`.

Diğer komutlar:

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu. Taslak (`taslak: true`) sayfalar da görünür. |
| `npm run build` | Yayınlanacak siteyi `dist/` klasörüne üretir. Hata varsa burada çıkar. |
| `npm run preview` | `dist/` içindeki sitenin yayındaki halini gösterir. |

---

## 2. GitHub'a yükleme

1. [github.com](https://github.com) üzerinde hesabına gir, sağ üstten **New repository** de. Ad ver (ör. `uzayli-site`), **Public** seç, başka hiçbir kutuyu işaretleme, **Create repository**.
2. Terminal'de proje klasöründeyken:
   ```bash
   git init
   git add .
   git commit -m "İlk sürüm"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/uzayli-site.git
   git push -u origin main
   ```
   `KULLANICI_ADIN` yerine GitHub kullanıcı adını yaz. İlk `push` sırasında giriş istenir. Şifre yerine "personal access token" gerekir; bununla uğraşmamak için en kolayı [GitHub Desktop](https://desktop.github.com) uygulamasını kurup klasörü oradan "Add existing repository" ile eklemek ve **Publish** demektir.

**Sonraki her değişiklikte:**

```bash
git add .
git commit -m "Ne değiştirdiğini yaz"
git push
```

---

## 3. Yayınlama: GitHub Pages

Gerekli otomasyon dosyası projede hazır: `.github/workflows/yayinla.yml`. Tek yapman gereken Pages'i açmak.

1. GitHub'da deponun sayfasında **Settings → Pages**.
2. **Build and deployment → Source** kısmında **GitHub Actions** seç.
3. Bir `git push` yap (ya da **Actions** sekmesinden "Siteyi yayinla" iş akışını **Run workflow** ile elle çalıştır).
4. **Actions** sekmesinde iş yeşil olunca site yayındadır: `https://KULLANICI_ADIN.github.io/uzayli-site/`

Bundan sonra her `git push` siteyi kendiliğinden günceller (1–2 dakika sürer).

> Sitenin adresindeki `/uzayli-site` alt yolu derleme sırasında otomatik ayarlanır; kodda bir şey değiştirmen gerekmez.

---

## 4. Yayınlama: Vercel

GitHub Pages yerine (ya da onunla birlikte) kullanılabilir.

1. [vercel.com](https://vercel.com) üzerinde GitHub hesabınla giriş yap.
2. **Add New → Project**, listeden `uzayli-site` deposunu seç, **Import**.
3. Vercel projeyi Astro olarak kendisi tanır. Hiçbir ayarı değiştirmeden **Deploy**.
4. Bir iki dakika sonra `https://uzayli-site-xxxx.vercel.app` gibi bir adres verir.

Her `git push` Vercel'de de otomatik yayınlanır.

---

## 5. Kendi domain'ini bağlama

Domain'i herhangi bir firmadan alabilirsin. Aşağıdaki DNS kayıtları domain'i aldığın firmanın "DNS yönetimi" panelinden girilir. Kayıtların yayılması birkaç dakika ile birkaç saat arasında sürer.

### GitHub Pages ile

1. Deponun **Settings → Pages → Custom domain** kutusuna domain'ini yaz (ör. `alanadin.com`) ve **Save**.
2. DNS panelinde:
   - Kök domain (`alanadin.com`) için dört **A** kaydı: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www` için bir **CNAME** kaydı: `KULLANICI_ADIN.github.io`
3. GitHub doğrulamayı bitirince aynı sayfada **Enforce HTTPS** kutusunu işaretle.

IP adresleri ileride değişirse güncel hali GitHub'ın "Managing a custom domain for your GitHub Pages site" belgesinde yazar. Domain bağlanınca adresin sonundaki `/uzayli-site` kısmı kalkar; bunu da sistem kendisi halleder.

### Vercel ile

1. Vercel'de proje → **Settings → Domains** → domain'ini yaz → **Add**.
2. Vercel sana girmen gereken DNS kayıtlarını (bir A ve bir CNAME) gösterir; aynen DNS paneline gir.
3. HTTPS kendiliğinden kurulur.

---

## 6. İçerik ekleme ve düzenleme

Temel kural: **klasör yapısı = site yapısı.**

```
src/content/<bölüm>/<ders>/<konu>.mdx   →   /bölüm/ders/konu/
src/content/<bölüm>/<konu>.mdx          →   /bölüm/konu/        (derssiz bölümler: projeler, sorular)
```

Dosya ve klasör adlarında küçük harf kullan, Türkçe karakter kullanma, boşluk yerine tire koy (`ozel-gorelilik`, `lorentz-donusumu.mdx`). Sitede görünen ad başka yerden gelir, o istediğin gibi olabilir.

### Yeni konu (sayfa) eklemek

1. `sablonlar/` klasöründen uygun şablonu kopyala:
   | Şablon | Nereye kopyalanır |
   | --- | --- |
   | `fizik.mdx` | `src/content/fizik/<ders>/` |
   | `elektronik.mdx` | `src/content/elektronik/<ders>/` |
   | `okuma.mdx` | `src/content/okumalar/<kitap>/` |
   | `proje.mdx` | `src/content/projeler/` |
   | `soru.mdx` | `src/content/sorular/` |
2. Dosyanın adını değiştir (ör. `kepler-problemi.mdx`).
3. En üstteki `---` arasındaki bilgileri doldur, altına içeriği yaz. Kaydet.

Sayfa menüde, bölüm sayfasında ve ders listesinde kendiliğinden görünür. Başka hiçbir dosyaya dokunmana gerek yok.

**Sayfa başındaki bilgiler (frontmatter):**

| Alan | Zorunlu mu | Açıklama |
| --- | --- | --- |
| `baslik` | Evet | Sayfa başlığı |
| `ozet` | Hayır | Liste kartında görünen cümle |
| `sira` | Hayır | Ders içindeki sıra; küçük olan önce |
| `seviye` | Hayır | `giris`, `ileri` ya da kendi tanımladığın bir seviye |
| `etiketler` | Hayır | `[etiket1, etiket2]` |
| `onceki` | Hayır | "Önce şunu oku" bağlantısı. Değer sayfanın adresidir: `fizik/klasik-mekanik/basit-sarkac` |
| `ileri` | Hayır | "Daha ileri konular" bağlantıları: `[fizik/..., fizik/...]` |
| `taslak` | Hayır | `true` ise yayına çıkmaz, sadece `npm run dev` ile görünür |
| `bolum`, `ders` | Hayır | Klasörden farklı bir bölüm/ders altında göstermek istersen |

Aynı dersteki sayfalar arasında "önceki konu / sonraki konu" bağlantıları `sira` değerine göre kendiliğinden oluşur.

### Yeni ders eklemek

1. `src/content/fizik/` altında yeni bir klasör aç (ör. `genel-gorelilik`) ve içine ilk MDX dosyasını koy. Ders bu kadarıyla sitede görünür; adı klasör adından üretilir ("Genel Gorelilik").
2. Düzgün ad ve sıra vermek için `src/site.config.ts` dosyasında ilgili bölümün `dersler` listesine bir satır ekle:
   ```ts
   { id: 'genel-gorelilik', baslik: 'Genel Görelilik' },
   ```
   `id` klasör adıyla aynı olmalı. Listedeki sıra sitedeki sıradır.

İçi henüz boş olan bir dersi de bu listeye yazabilirsin; "henüz konu yok" notuyla görünür.

### Yeni bölüm eklemek

`src/site.config.ts` içindeki `bolumler` listesine ekle:

```ts
{ id: 'blog', baslik: 'Blog', aciklama: 'Kısa yazılar.' },
```

Sonra `src/content/blog/` klasörünü açıp içine MDX dosyaları koy. Bölüm menüye ve ana sayfaya kendiliğinden eklenir. `kapi: true` yazarsan ana sayfada kara deliğin yörüngesinde üçüncü bir istasyon olur.

### Ad, sıra değiştirmek ya da silmek

- **Ders ya da bölümün adını değiştirmek:** `site.config.ts` içinde `baslik` değerini değiştir.
- **Sırasını değiştirmek:** `site.config.ts` içinde satırın yerini değiştir.
- **Konunun sırasını değiştirmek:** MDX dosyasındaki `sira` sayısını değiştir.
- **Menüden gizlemek:** bölüme `menude: false` ekle.
- **Silmek:** satırı ve klasörü sil.

### Seviyeler

`site.config.ts` içindeki `seviyeler` listesi:

```ts
export const seviyeler = [
  { id: 'giris', baslik: 'Giriş' },
  { id: 'ileri', baslik: 'İleri' },
];
```

Yeni seviye için satır ekle (ör. `{ id: 'orta', baslik: 'Orta' }`), sayfada `seviye: orta` yaz. Bir listede birden fazla seviye varsa üstte süzgeç düğmeleri kendiliğinden çıkar. Hiçbir sayfaya `seviye` yazmazsan seviye sistemi hiç görünmez.

### Denklem yazmak

Satır içi: `$E = mc^2$`. Ayrı satırda:

```
$$
T = 2\pi\sqrt{\frac{L}{g}}
$$
```

### Fotoğraf eklemek

1. Fotoğrafı `public/gorseller/<konu>/` altına koy (ör. `public/gorseller/pcb/utuleme.jpg`).
2. MDX içinde:
   ```mdx
   import Foto from '@/components/Foto.astro';

   <Foto src="gorseller/pcb/utuleme.jpg" aciklama="Ütüleme sırasında" />
   ```
   `src` yazmazsan aynı yerde "fotoğraf eklenecek" kutusu görünür.

### Not kutusu

```mdx
import Not from '@/components/Not.astro';

<Not tur="dikkat">Metin.</Not>      {/* tur: bilgi | dikkat | ipucu */}
```

### Simülasyon eklemek

Simülasyonlar `src/components/sim/` altında durur. `Sarkac.astro` örnek iskelet: üstte tuval ve kaydırıcılar, altta sade JavaScript. Yeni simülasyon için bu dosyayı kopyala, adını değiştir, MDX sayfasında içe aktar:

```mdx
import Sarkac from '@/components/sim/Sarkac.astro';

<Sarkac />
<Sarkac uzunluk={2} aci={120} g={1.62} />
```

MDX'te `import` satırlarından sonra bir boş satır bırak.

### Bölüme bağlı olmayan tek sayfa (Hakkımda gibi)

`src/pages/hakkimda.mdx` dosyasını örnek al. Yeni bir tane için aynı klasöre kopyala ve menüde görünsün istiyorsan `site.config.ts` içindeki `ekSayfalar` listesine ekle.

### Ana sayfadaki yazılar

Tanıtım yazısı, site adı ve HUD'daki koordinat `site.config.ts` içindeki `site` nesnesindedir.

---

## 7. Kara delik bileşeni

- Motor: `src/scripts/kara-delik.js` (shader ve çizim döngüsü; sayfadan bağımsız)
- Bileşen: `src/components/KaraDelik.astro` (motoru sayfaya yerleştirir)

Herhangi bir sayfada:

```mdx
import KaraDelik from '@/components/KaraDelik.astro';

<div style="height: 420px">
  <KaraDelik parametreler={{ egim: 60, uzaklik: 22, etkilesim: false }} />
</div>
```

Parametreler:

| Parametre | Varsayılan | Açıklama |
| --- | --- | --- |
| `kutle` | 1 | Kütle. Schwarzschild yarıçapı kütleyle orantılı olduğu için her şey bu oranda büyür |
| `donme` | 0 | Kerr dönme parametresi (0–0.998). Şimdilik sadece diskin iç kenarını (ISCO) değiştirir |
| `uzaklik` | 17 | Gözlemci uzaklığı (Schwarzschild yarıçapı cinsinden) |
| `egim` | 80 | Bakış açısı: 0° tepeden, 90° kenardan |
| `yatis` | 7 | Kameranın yatma açısı |
| `diskIc` / `diskDis` | ISCO / 10.5 | Diskin iç ve dış yarıçapı |
| `diskHiz` | 1 | Diskin dönme hızı çarpanı |
| `pozlama` | 1.15 | Parlaklık |
| `salinim` | 1 | Kameranın kendiliğinden salınımı (0 kapatır) |
| `etkilesim` | true | Fareyle gökyüzü ve kamera kaysın mı |
| `kalite` | `'oto'` | `'oto'`, `'dusuk'`, `'yuksek'` |

**Kaydırıcılarla kontrol (ilerideki Genel Görelilik sayfası için):** bileşen hazır olunca motoru dış `<div>` üzerine koyar. Bir kaydırıcıdan şöyle çağırırsın:

```js
const el = document.querySelector('[data-kara-delik]');
el.karaDelik.ayarla({ kutle: 2, egim: 45 });
```

**Dürüst not:** Işık yolları Schwarzschild (dönmeyen) kara delik için hesaplanıyor. `donme` parametresi şu an sadece diskin iç yarıçapını değiştiriyor; gerçek Kerr geodezikleri (çerçeve sürüklenmesi, yassılaşmış gölge) için shader'daki ivme hesabının değişmesi gerekiyor. Yeri kodda işaretli.

WebGL yoksa `public/kara-delik.webp` gösterilir. Animasyonlar kapalıyken tek bir durağan kare çizilir.

---

## 8. Klasör yapısı

```
uzayli-site/
├─ astro.config.mjs            Astro ayarları (MDX, KaTeX)
├─ package.json
├─ README.md                   bu dosya
├─ .github/workflows/yayinla.yml   GitHub Pages otomatik yayın
├─ public/                     olduğu gibi kopyalanan dosyalar (görseller, favicon)
├─ sablonlar/                  kopyalanacak MDX şablonları (siteye dahil değil)
└─ src/
   ├─ site.config.ts           ★ bölümler, dersler, seviyeler, site yazıları
   ├─ content.config.ts        sayfa başı bilgilerinin (frontmatter) şeması
   ├─ content/                 ★ bütün içerik
   │  ├─ fizik/klasik-mekanik/basit-sarkac.mdx
   │  └─ projeler/utuyle-pcb.mdx
   ├─ pages/
   │  ├─ index.astro           ana sayfa
   │  ├─ [...yol].astro        bölüm, ders ve konu sayfalarını üreten tek şablon
   │  └─ hakkimda.mdx
   ├─ layouts/                 Base.astro (ortak iskelet), Sayfa.astro (tekil sayfalar)
   ├─ components/              KaraDelik, KonuListesi, Not, Foto, sim/Sarkac
   ├─ scripts/                 kara-delik.js, yildiz-alani.js, ayarlar.js
   ├─ lib/icerik.ts            içerik ağacını kuran yardımcılar
   └─ styles/global.css        renkler, yazı tipleri, bütün görünüm
```

Günlük kullanımda dokunacağın yerler ★ ile işaretli.

---

## 9. Sık karşılaşılan sorunlar

- **`npm run dev` hata veriyor, "Unexpected ..." diyor:** MDX dosyasında `import` satırlarından sonra boş satır bırakılmamış ya da metnin içinde tek başına `{` veya `<` var. Düz metinde bunları `\{` ve `\<` olarak yaz.
- **Sayfa yayında görünmüyor ama bilgisayarda görünüyor:** dosyada `taslak: true` kalmış.
- **"... adresi bir bölüm ya da ders sayfasıyla çakışıyor" hatası:** bir MDX dosyasının adı aynı klasördeki bir ders klasörüyle aynı. Dosyanın adını değiştir.
- **GitHub Pages'te stil yok, sayfa bozuk:** Settings → Pages → Source kısmı "GitHub Actions" olmalı ("Deploy from a branch" değil).
- **Denklem düz yazı gibi çıkıyor:** `$` işaretleri eksik ya da `$$` satırları kendi başına bir satırda değil.
- **Yazı tipi:** başlıklarda Space Grotesk, metinde Inter, HUD yazılarında JetBrains Mono var. Orbitron'da ğ, ş, ı, İ harfleri olmadığı için kullanılmadı. Değiştirmek için `src/styles/global.css` dosyasının başındaki `--yazi-...` değişkenlerine bak.
