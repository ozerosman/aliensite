// Astro ana yapılandırma dosyası.
// SITE_URL ve BASE_PATH ortam değişkenleri yayın sırasında (GitHub Actions) otomatik verilir.
// Bilgisayarında çalışırken ikisi de boş kalır; site http://localhost:4321/ adresinde açılır.
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  // Kendi domain'ini bağlayınca burayı 'https://alanadin.com' yapabilirsin (zorunlu değil).
  site: process.env.SITE_URL || 'http://localhost:4321',
  // GitHub Pages'te site "kullanici.github.io/depo-adi/" altında yayınlanır; base o "/depo-adi" kısmıdır.
  // Vercel'de ve kendi domain'inde base "/" olur.
  base: process.env.BASE_PATH || '/',
  integrations: [mdx()],
  markdown: {
    // $...$ ve $$...$$ içindeki LaTeX'i KaTeX ile çizer.
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
});
