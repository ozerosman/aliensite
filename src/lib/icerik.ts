// İçerik yardımcıları: bölüm → ders → konu ağacını site.config.ts ile MDX dosyalarından kurar.
// Sayfalar ve menü hep bu dosyadaki fonksiyonları kullanır; hiçbir yerde ders adı elle yazılmaz.
import { getCollection, type CollectionEntry } from 'astro:content';
import { bolumler, seviyeler, type BolumAyar, type DersAyar } from '../site.config';

export interface Konu {
  /** Dosya yolu = adres. Ör: fizik/klasik-mekanik/basit-sarkac */
  id: string;
  url: string;
  baslik: string;
  ozet?: string;
  bolum: string;
  ders?: string;
  seviye?: string;
  sira: number;
  etiketler: string[];
  onceki: string[];
  ileri: string[];
  taslak: boolean;
  entry: CollectionEntry<'icerik'>;
}

export interface Ders extends DersAyar {
  url: string;
  sektor: number;
  konular: Konu[];
}

export interface Bolum extends BolumAyar {
  url: string;
  sektor: number;
  dersler: Ders[];
  /** Bir derse bağlı olmayan sayfalar (ör. projeler/utuyle-pcb). */
  serbest: Konu[];
  toplam: number;
}

/** Site içi adres üretir. GitHub Pages'teki "/depo-adi" ön ekini (base) otomatik ekler. */
export function yol(p = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const temiz = p.replace(/^\/+|\/+$/g, '');
  return temiz ? `${base}/${temiz}/` : `${base}/`;
}

/** public klasöründeki bir dosyanın adresi (ör. görseller). */
export function dosya(p: string): string {
  if (/^https?:\/\//.test(p)) return p;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${p.replace(/^\/+/, '')}`;
}

/** "klasik-mekanik" → "Klasik Mekanik". Yapılandırmada adı olmayan klasörler için. */
export function baslikYap(id: string): string {
  return id
    .split('-')
    .map((k) => k.charAt(0).toLocaleUpperCase('tr') + k.slice(1))
    .join(' ');
}

export function seviyeAdi(id?: string): string | undefined {
  if (!id) return undefined;
  return seviyeler.find((s) => s.id === id)?.baslik ?? baslikYap(id);
}

const dizi = (v?: string | string[]) => (v ? (Array.isArray(v) ? v : [v]) : []).map((s) => s.replace(/^\/+|\/+$/g, ''));

const sirala = (liste: Konu[]) =>
  [...liste].sort((a, b) => a.sira - b.sira || a.baslik.localeCompare(b.baslik, 'tr'));

let onbellek: Promise<Konu[]> | undefined;

/** Bütün içerik sayfaları. Taslaklar yayında gizlenir, geliştirme modunda görünür. */
export function tumKonular(): Promise<Konu[]> {
  onbellek ??= getCollection('icerik').then((girdiler) =>
    girdiler
      .filter((e) => import.meta.env.DEV || !e.data.taslak)
      .map((entry) => {
        const parcalar = entry.id.split('/');
        const d = entry.data;
        return {
          id: entry.id,
          url: yol(entry.id),
          baslik: d.baslik,
          ozet: d.ozet,
          // Frontmatter'da yazıyorsa o geçerli; yazmıyorsa klasör yapısından çıkarılır.
          bolum: d.bolum ?? parcalar[0],
          ders: d.ders ?? (parcalar.length > 2 ? parcalar[1] : undefined),
          seviye: d.seviye,
          sira: d.sira,
          etiketler: d.etiketler,
          onceki: dizi(d.onceki),
          ileri: dizi(d.ileri),
          taslak: d.taslak,
          entry,
        } satisfies Konu;
      }),
  );
  return onbellek;
}

/** Bölüm → ders → konu ağacı. */
export async function agac(): Promise<Bolum[]> {
  const konular = await tumKonular();

  // Önce yapılandırmadaki sıra, sonra içerikte olup yapılandırmada olmayan bölümler.
  const bolumIdleri = bolumler.map((b) => b.id);
  for (const k of konular) if (!bolumIdleri.includes(k.bolum)) bolumIdleri.push(k.bolum);

  return bolumIdleri.map((id, i) => {
    const ayar: BolumAyar = bolumler.find((b) => b.id === id) ?? { id, baslik: baslikYap(id) };
    const benim = konular.filter((k) => k.bolum === id);

    const dersIdleri = (ayar.dersler ?? []).map((d) => d.id);
    for (const k of benim) if (k.ders && !dersIdleri.includes(k.ders)) dersIdleri.push(k.ders);

    const dersler: Ders[] = dersIdleri.map((did, j) => {
      const da: DersAyar = ayar.dersler?.find((d) => d.id === did) ?? { id: did, baslik: baslikYap(did) };
      return { ...da, sektor: j + 1, url: yol(`${id}/${did}`), konular: sirala(benim.filter((k) => k.ders === did)) };
    });

    return {
      ...ayar,
      sektor: i + 1,
      url: yol(id),
      dersler,
      serbest: sirala(benim.filter((k) => !k.ders)),
      toplam: benim.length,
    };
  });
}

/** İki haneli sektör numarası: 3 → "03" */
export const sektorNo = (n: number) => String(n).padStart(2, '0');
