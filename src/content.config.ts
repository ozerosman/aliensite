// İçerik koleksiyonu: src/content altındaki bütün .md / .mdx dosyaları tek koleksiyonda toplanır.
// Aşağıdaki şema, dosyaların başındaki bilgilerin (frontmatter) hangi alanları taşıyabileceğini söyler.
// "optional" olanları yazmak zorunda değilsin.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const birYaDaCok = z.union([z.string(), z.array(z.string())]).optional();

const icerik = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content' }),
  schema: z.object({
    /** Sayfa başlığı (zorunlu olan tek alan). */
    baslik: z.string(),
    /** Liste sayfalarında görünen bir cümlelik özet. */
    ozet: z.string().optional(),
    /** Bölüm. Yazmazsan dosyanın bulunduğu ilk klasörden alınır (ör. fizik). */
    bolum: z.string().optional(),
    /** Ders. Yazmazsan ikinci klasörden alınır (ör. klasik-mekanik). */
    ders: z.string().optional(),
    /** Seviye (ör. giris, ileri). İsteğe bağlı. */
    seviye: z.string().optional(),
    /** Ders içindeki sıra. Küçük olan önce gelir. */
    sira: z.number().default(999),
    etiketler: z.array(z.string()).default([]),
    /** "Bundan önce şunu oku" bağlantıları. Değer: sayfanın adresi, ör. fizik/klasik-mekanik/basit-sarkac */
    onceki: birYaDaCok,
    /** "Daha ileri konu" bağlantıları. */
    ileri: birYaDaCok,
    /** true ise sayfa sadece bilgisayarında (npm run dev) görünür, yayına çıkmaz. */
    taslak: z.boolean().default(false),
    tarih: z.coerce.date().optional(),
  }),
});

export const collections = { icerik };
