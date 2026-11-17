// Canlı yıldız alanı (Canvas 2D).
// Üç katman: uzak (sönük, yavaş), orta, yakın (parlak, hızlı). Fare ve sayfa kaydırma
// katmanları farklı miktarda kaydırır (paralaks); bu da derinlik hissini verir.
import { animAcik, ayarDegisince } from './ayarlar.js';

// Katman ayarları. yogunluk: 100.000 piksel kare başına yıldız sayısı.
const KATMANLAR = [
  { yogunluk: 9, boyut: [0.4, 0.9], parlaklik: [0.25, 0.55], derinlik: 0.15 },
  { yogunluk: 4, boyut: [0.7, 1.3], parlaklik: [0.45, 0.8], derinlik: 0.4 },
  { yogunluk: 1.3, boyut: [1.1, 1.9], parlaklik: [0.75, 1.0], derinlik: 1.0 },
];
const RENKLER = ['#ffffff', '#cfe3ff', '#bfd4ff', '#ffe9c9', '#d9c9ff'];

// Tohumlu rastgele sayı üreteci: her sayfada aynı gökyüzü çıksın diye (geçişte yıldızlar zıplamaz).
function rastgeleUret(tohum) {
  let a = tohum;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function yildizAlaniKur(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const telefon = matchMedia('(max-width: 720px)').matches;
  let gen = 0;
  let yuk = 0;
  let dpr = 1;
  let yildizlar = [];
  let fareX = 0;
  let fareY = 0; // hedef (−1..1)
  let fx = 0;
  let fy = 0; // yumuşatılmış
  let kayma = window.scrollY;
  let warp = 1; // sayfa açılışında 1'den 0'a söner: yıldızlar kısa bir an çizgi olur
  const acilis = performance.now();
  let kayan = null; // kayan yıldız
  let sonrakiKayan = performance.now() + 15000 + Math.random() * 25000;
  let kareId = 0;
  let onceki = performance.now();

  function boyutla() {
    dpr = Math.min(window.devicePixelRatio || 1, telefon ? 1.5 : 2);
    gen = window.innerWidth;
    yuk = window.innerHeight;
    canvas.width = Math.round(gen * dpr);
    canvas.height = Math.round(yuk * dpr);
    const r = rastgeleUret(1905);
    const alan = (gen * yuk) / 100000;
    yildizlar = KATMANLAR.map((k) => {
      const adet = Math.round(alan * k.yogunluk * (telefon ? 0.7 : 1));
      return Array.from({ length: adet }, () => ({
        x: r(),
        y: r(),
        b: k.boyut[0] + r() * (k.boyut[1] - k.boyut[0]),
        p: k.parlaklik[0] + r() * (k.parlaklik[1] - k.parlaklik[0]),
        faz: r() * 6.28,
        hiz: 0.4 + r() * 1.2,
        renk: RENKLER[Math.floor(r() * RENKLER.length)],
      }));
    });
  }

  function ciz(simdi) {
    const dt = Math.min(0.05, (simdi - onceki) / 1000);
    onceki = simdi;
    const hareketli = animAcik();
    const t = simdi / 1000;

    fx += (fareX - fx) * 0.05;
    fy += (fareY - fy) * 0.05;
    kayma += (window.scrollY - kayma) * 0.12;
    // Gerçek saate bağlı sönme (~0.6 saniye): yavaş cihazda da uzun sürmez
    warp = hareketli ? Math.exp(-(simdi - acilis) / 140) : 0;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, gen, yuk);
    const mx = gen / 2;
    const my = yuk / 2;

    KATMANLAR.forEach((k, i) => {
      // Katman kayması: fare + sayfa kaydırma + çok yavaş kendiliğinden sürüklenme
      const ox = -fx * 26 * k.derinlik + (hareketli ? t * 1.2 * k.derinlik : 0);
      const oy = -fy * 18 * k.derinlik - kayma * 0.22 * k.derinlik;
      for (const y of yildizlar[i]) {
        let x = (((y.x * gen + ox) % gen) + gen) % gen;
        let yy = (((y.y * yuk + oy) % yuk) + yuk) % yuk;
        const pir = hareketli ? 0.82 + 0.18 * Math.sin(t * y.hiz + y.faz) : 1;
        ctx.globalAlpha = y.p * pir;
        ctx.fillStyle = y.renk;
        if (warp > 0.02) {
          // Warp: yıldızı merkezden dışarı doğru uzayan bir çizgi olarak çiz
          const dx = x - mx;
          const dy = yy - my;
          const u = warp * k.derinlik * 0.35;
          ctx.strokeStyle = y.renk;
          ctx.lineWidth = y.b;
          ctx.beginPath();
          ctx.moveTo(x, yy);
          ctx.lineTo(x + dx * u, yy + dy * u);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, yy, y.b, 0, 6.2832);
          ctx.fill();
        }
      }
    });

    // Kayan yıldız: çok nadir (yaklaşık 25–60 saniyede bir)
    if (hareketli && !kayan && simdi > sonrakiKayan) {
      const aci = Math.PI * (0.15 + Math.random() * 0.2);
      kayan = { x: Math.random() * gen * 0.8, y: Math.random() * yuk * 0.4, vx: Math.cos(aci) * 900, vy: Math.sin(aci) * 900, omur: 0 };
      sonrakiKayan = simdi + 25000 + Math.random() * 35000;
    }
    if (kayan) {
      kayan.omur += dt;
      kayan.x += kayan.vx * dt;
      kayan.y += kayan.vy * dt;
      const a = Math.max(0, 1 - kayan.omur / 0.9);
      const g = ctx.createLinearGradient(kayan.x, kayan.y, kayan.x - kayan.vx * 0.14, kayan.y - kayan.vy * 0.14);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`);
      g.addColorStop(1, 'rgba(160,210,255,0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(kayan.x, kayan.y);
      ctx.lineTo(kayan.x - kayan.vx * 0.14, kayan.y - kayan.vy * 0.14);
      ctx.stroke();
      if (a <= 0) kayan = null;
    }
    ctx.globalAlpha = 1;

    if (hareketli && !document.hidden) kareId = requestAnimationFrame(ciz);
    else kareId = 0;
  }

  const tekKare = () => {
    if (!kareId) {
      onceki = performance.now();
      kareId = requestAnimationFrame(ciz);
    }
  };

  window.addEventListener('pointermove', (e) => {
    fareX = (e.clientX / gen) * 2 - 1;
    fareY = (e.clientY / yuk) * 2 - 1;
  });
  window.addEventListener('scroll', tekKare, { passive: true });
  window.addEventListener('resize', () => {
    boyutla();
    tekKare();
  });
  document.addEventListener('visibilitychange', tekKare);
  ayarDegisince(tekKare);

  boyutla();
  tekKare();
}
