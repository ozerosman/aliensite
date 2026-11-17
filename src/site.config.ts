// ============================================================================
//  SİTENİN TEK YAPILANDIRMA DOSYASI
//  Bölüm, ders, seviye eklemek / silmek / sırasını ya da adını değiştirmek için
//  SADECE bu dosyayı düzenlemen yeter. Menü, ana sayfa ve liste sayfaları
//  buradan ve MDX dosyalarının başındaki bilgilerden kendiliğinden oluşur.
// ============================================================================

export interface DersAyar {
  /** Klasör adı ve adres parçası. Küçük harf, Türkçe karakter yok, boşluk yerine tire. */
  id: string;
  /** Sitede görünen ad. İstediğin zaman değiştirebilirsin. */
  baslik: string;
  aciklama?: string;
}

export interface BolumAyar {
  id: string;
  baslik: string;
  aciklama?: string;
  /** true ise ana sayfada kara deliğin yörüngesinde dönen "istasyon" olarak görünür. */
  kapi?: boolean;
  /** Menüde gizlemek istersen false yap. */
  menude?: boolean;
  /** Dersler bu sırayla listelenir. Boş bırakılabilir. */
  dersler?: DersAyar[];
}

export const site = {
  ad: 'Uzaylı',
  baslik: 'Uzaylı · Fizik ve Elektronik',
  aciklama: 'Fizik ve elektronik üzerine notlar, simülasyonlar ve projeler.',
  yazar: 'Osman Özer',
  /** Ana sayfadaki tanıtım yazısı. */
  tanitim:
    'Ben Osman, namıdiğer Uzaylı. ODTÜ Fizik öğrencisiyim; roket takımında aviyonik yapıyorum. Burası fizikle mühendisliği aynı potada erittiğim yer: öğrendiklerimi yazıyorum, simülasyonunu kuruyorum, devresini basıyorum.',
  /** HUD köşesindeki koordinat yazısı (Sagittarius A*'ın gökyüzü koordinatları). */
  koordinat: 'RA 17h45m40s · DEC −29°00′28″',
};

/**
 * Seviyeler. Tamamen isteğe bağlı: bir sayfanın başına `seviye: giris` yazarsan rozet ve filtre çıkar,
 * yazmazsan hiçbir şey çıkmaz. Yeni seviye eklemek için bu listeye bir satır eklemen yeterli.
 */
export const seviyeler = [
  { id: 'giris', baslik: 'Giriş' },
  { id: 'ileri', baslik: 'İleri' },
];

/**
 * Bölümler ve dersler. Sıra = sitedeki sıra.
 * Burada tanımlı olmayan bir bölüm ya da ders klasörü açarsan o da otomatik görünür
 * (adı klasör adından üretilir); düzgün bir ad vermek için buraya eklersin.
 */
export const bolumler: BolumAyar[] = [
  {
    id: 'fizik',
    baslik: 'Fizik',
    aciklama: 'Ders notları, sezgi, matematik ve simülasyonlar.',
    kapi: true,
    dersler: [
      { id: 'klasik-mekanik', baslik: 'Klasik Mekanik' },
      { id: 'elektromanyetik-teori', baslik: 'Elektromanyetik Teori' },
      { id: 'ozel-gorelilik', baslik: 'Özel Görelilik' },
      { id: 'lazer-ve-optik', baslik: 'Lazer ve Optik' },
      // İleride açılacaklar. Açmak için baştaki // işaretlerini silmen yeterli:
      // { id: 'genel-gorelilik', baslik: 'Genel Görelilik' },
      // { id: 'kuantum-mekanigi', baslik: 'Kuantum Mekaniği' },
      // { id: 'genel-fizik', baslik: 'Genel Fizik (PHYS101–102)' },
    ],
  },
  {
    id: 'elektronik',
    baslik: 'Elektronik',
    aciklama: 'Komponentlerden PCB’ye: ne işe yarar, nasıl bağlanır.',
    kapi: true,
    dersler: [
      { id: 'temel-komponentler', baslik: 'Temel Komponentler', aciklama: 'Direnç, kondansatör, bobin, diyot, LED, buzzer' },
      { id: 'aktif-komponentler', baslik: 'Aktif Komponentler', aciklama: 'Transistör, op-amp, regülatör' },
      { id: 'entegreler', baslik: 'Entegreler' },
      { id: 'sensorler', baslik: 'Sensörler' },
      { id: 'datasheet-okuma', baslik: 'Datasheet Okuma' },
      { id: 'pinler-ve-paketler', baslik: 'Pinler ve Paketler' },
      { id: 'pcb', baslik: 'PCB' },
    ],
  },
  {
    id: 'sorular',
    baslik: 'Sorular ve Paradokslar',
    aciklama: 'Soru, ipucu, çözüm ve varsa simülasyon.',
  },
  {
    id: 'okumalar',
    baslik: 'Okumalar',
    aciklama: 'Kitap özetleri ve okuma notları.',
    dersler: [{ id: 'schutz', baslik: 'Schutz · A First Course in General Relativity' }],
  },
  {
    id: 'projeler',
    baslik: 'Projeler',
    aciklama: 'Yaptıklarım: amaç, malzeme, adımlar, sonuç.',
  },
];

/** Bölüm olmayan tekil sayfalar (src/pages altındaki dosyalar). Menünün sonuna eklenir. */
export const ekSayfalar = [{ baslik: 'Hakkımda', yol: 'hakkimda', aciklama: 'Ben kimim, bu site ne.' }];
