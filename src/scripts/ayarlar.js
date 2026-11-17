// Tema ve animasyon ayarları. Tarayıcının hafızasında (localStorage) saklanır.
// Diğer bileşenler (yıldız alanı, kara delik, simülasyonlar) animasyon durumunu buradan öğrenir.

const kok = document.documentElement;

/** Animasyonlar açık mı? */
export function animAcik() {
  return kok.dataset.anim !== 'kapali';
}

/** Ayar değişince haber almak için: ayarDegisince(() => { ... }) */
export function ayarDegisince(fn) {
  window.addEventListener('uzayli:ayar', fn);
}

function kaydet(anahtar, deger) {
  try {
    localStorage.setItem(anahtar, deger);
  } catch {
    /* gizli sekmede hafıza kapalı olabilir; sorun değil */
  }
}

export function temaAyarla(tema) {
  kok.dataset.tema = tema;
  kaydet('uzayli-tema', tema);
  window.dispatchEvent(new CustomEvent('uzayli:ayar'));
}

export function animAyarla(durum) {
  kok.dataset.anim = durum;
  kaydet('uzayli-anim', durum);
  window.dispatchEvent(new CustomEvent('uzayli:ayar'));
}

/** Ayar panelindeki düğmeleri bağlar. */
export function ayarPaneliKur() {
  const guncelle = () => {
    document.querySelectorAll('[data-tema-sec]').forEach((d) => {
      d.setAttribute('aria-pressed', String(d.dataset.temaSec === (kok.dataset.tema || 'koyu')));
    });
    document.querySelectorAll('[data-anim-sec]').forEach((d) => {
      d.setAttribute('aria-pressed', String(d.dataset.animSec === (kok.dataset.anim || 'acik')));
    });
  };
  document.querySelectorAll('[data-tema-sec]').forEach((d) =>
    d.addEventListener('click', () => {
      temaAyarla(d.dataset.temaSec);
      guncelle();
    }),
  );
  document.querySelectorAll('[data-anim-sec]').forEach((d) =>
    d.addEventListener('click', () => {
      animAyarla(d.dataset.animSec);
      guncelle();
    }),
  );
  guncelle();

  // Telefon menüsü
  const ac = document.querySelector('.menu-ac');
  const menu = document.querySelector('.menu');
  ac?.addEventListener('click', () => {
    const acik = menu.classList.toggle('acik');
    ac.setAttribute('aria-expanded', String(acik));
  });
}
