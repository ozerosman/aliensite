// ============================================================================
//  KARA DELİK MOTORU (WebGL, gerçek zamanlı ışın izleme)
//
//  Ne yapıyor?
//  Ekrandaki her piksel için kameradan geriye doğru bir ışık ışını gönderilir ve ışının
//  Schwarzschild (dönmeyen) kara deliğin çevresindeki yolu adım adım hesaplanır.
//   - Işın olay ufkuna düşerse piksel siyah kalır (gölge).
//   - Disk düzlemini keserse diskin o noktadaki rengi eklenir. Işın büküldüğü için diskin
//     arkada kalan kısmı da deliğin üstünde ve altında görünür.
//   - Kaçarsa, vardığı yöndeki gökyüzü (yıldızlar) çizilir: kütleçekimsel merceklenme.
//
//  Birimler: uzunluklar Schwarzschild yarıçapı r_s cinsindendir (r_s = 2GM/c² = 1).
//  Olay ufku r = 1, foton küresi r = 1.5, en içteki kararlı yörünge (ISCO) r = 3.
//
//  Bu dosya sayfadan bağımsızdır: karaDelikOlustur(canvas, parametreler) çağırırsın,
//  dönen nesnenin ayarla({...}) fonksiyonuyla parametreleri canlı değiştirirsin.
//  İleride Genel Görelilik sayfasındaki kaydırıcılar doğrudan ayarla() çağıracak.
// ============================================================================

/** Varsayılan parametreler. Hepsi dışarıdan verilebilir. */
export const VARSAYILAN = {
  kutle: 1, // Kütle (bağıl). r_s kütleyle orantılı olduğu için kütleyi 2 katına çıkarmak her şeyi 2 kat büyütür.
  donme: 0, // Kerr dönme parametresi a (0–0.998). Şimdilik sadece diskin iç kenarını (ISCO) değiştirir; aşağıdaki nota bak.
  uzaklik: 17, // Gözlemcinin uzaklığı (r_s cinsinden, kutle = 1 için)
  egim: 80, // Bakış açısı: 0° = diske tam tepeden, 90° = tam kenardan
  yatis: 7, // Kameranın kendi ekseninde yatması (derece); görüntüyü hafif eğik gösterir
  azimut: 0, // Kameranın disk çevresindeki açısı (derece)
  diskIc: null, // Diskin iç yarıçapı. null ise ISCO'dan otomatik hesaplanır.
  diskDis: 10.5, // Diskin dış yarıçapı
  diskHiz: 1, // Diskin dönme hızı çarpanı (görsel). 0 = durur.
  pozlama: 1.15, // Parlaklık
  gorusAcisi: 0.8, // tan(görüş açısının yarısı): büyüdükçe kara delik küçülür
  salinim: 1, // Kameranın kendiliğinden hafif salınımı (0 = kapalı)
  etkilesim: true, // Fare/dokunma ile gökyüzü ve kamera kaysın mı?
  kalite: 'oto', // 'oto' | 'dusuk' | 'yuksek'
};

// NOT (Kerr): Dönen kara delikte ışık yolları da değişir (çerçeve sürüklenmesi, gölgenin
// yassılaşması). Bunun için aşağıdaki "ivme" satırının Kerr geodezikleriyle değiştirilmesi
// gerekir. Şu an `donme` sadece ISCO'yu, yani diskin iç kenarını ve iç bölgenin hızını etkiler.

/** Kerr kara deliğinde aynı yönde dönen disk için ISCO yarıçapı (r_s cinsinden). a = 0 → 3. */
export function iscoYaricapi(a) {
  a = Math.min(Math.max(a, 0), 0.998);
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const rM = 3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2)); // GM/c² cinsinden
  return rM / 2; // r_s = 2GM/c²
}

const KOSE_SHADER = `
attribute vec2 aKonum;
void main() { gl_Position = vec4(aKonum, 0.0, 1.0); }
`;

const PIKSEL_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;       // tuvalin piksel boyutu
uniform float uZaman;
uniform vec3  uKam;       // kamera konumu
uniform mat3  uKamR;      // kamera eksenleri: sağ, yukarı, ileri
uniform float uTan;       // görüş açısı
uniform float uDiskIc;
uniform float uDiskDis;
uniform float uDiskHiz;
uniform float uPoz;
uniform mat3  uGok;       // gökyüzünü döndüren matris (fare ile kayar)
uniform float uAdimK;     // adım uzunluğu katsayısı

const float PI = 3.14159265;

// ---------- Rastgelelik ve gürültü ----------
float h13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float h12(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float gurultu3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// Açı yönünde kendini tekrar eden (dikişsiz) gürültü: disk dokusu için.
float gurultuHalka(vec2 p, float periyot) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, periyot); float x1 = mod(i.x + 1.0, periyot);
  return mix(mix(h12(vec2(x0, i.y)), h12(vec2(x1, i.y)), f.x),
             mix(h12(vec2(x0, i.y + 1.0)), h12(vec2(x1, i.y + 1.0)), f.x), f.y);
}

// ---------- Gökyüzü ----------
// Yön vektörünü hücrelere böler; bazı hücrelere birer yıldız koyar.
vec3 yildizKatmani(vec3 d, float olcek, float esik, float sigma) {
  vec3 p = d * olcek;
  vec3 id = floor(p);
  float h = h13(id);
  if (h < esik) return vec3(0.0);
  vec3 konum = vec3(h13(id + 1.7), h13(id + 5.3), h13(id + 9.1)) * 0.6 + 0.2;
  float uz = length(fract(p) - konum);
  float parlak = (h - esik) / (1.0 - esik);
  float isik = exp(-uz * uz / (2.0 * sigma * sigma)) * (0.25 + 1.6 * parlak * parlak);
  vec3 renk = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.88, 0.72), h13(id + 3.1));
  return renk * isik;
}
// Parlak, yaygın bir kaynak (uzak gökada gibi). Tam arkaya denk gelince Einstein halkası olur.
vec3 kaynak(vec3 d, vec3 yon, float boy, vec3 renk) {
  float c = clamp(dot(d, normalize(yon)), -1.0, 1.0);
  float a2 = 2.0 * (1.0 - c); // küçük açılar için açı²
  return renk * (1.1 * exp(-a2 / (boy * boy)) + 0.02 * exp(-a2 / (boy * boy * 12.0)));
}
vec3 gokyuzu(vec3 d) {
  d = uGok * normalize(d);
  vec3 c = vec3(0.0);
  c += yildizKatmani(d, 46.0, 0.72, 0.045);
  c += yildizKatmani(d, 95.0, 0.80, 0.06) * 0.6;
  // Bulutsu: mor – lacivert – camgöbeği
  float n = gurultu3(d * 2.1 + 4.0) * 0.6 + gurultu3(d * 4.7) * 0.4;
  float m = gurultu3(d * 1.3 - 2.0);
  c += mix(vec3(0.16, 0.06, 0.34), vec3(0.03, 0.2, 0.3), m) * pow(n, 3.0) * 0.32;
  // Merceklenmeyi belirginleştiren birkaç parlak kaynak
  c += kaynak(d, vec3(-0.975, -0.19, 0.11), 0.03, vec3(0.75, 0.88, 1.0));
  c += kaynak(d, vec3(-0.6, 0.25, -0.76), 0.03, vec3(1.0, 0.8, 0.65));
  c += kaynak(d, vec3(0.3, -0.4, 0.87), 0.028, vec3(0.8, 0.7, 1.0));
  c += kaynak(d, vec3(-0.7, -0.1, 0.7), 0.022, vec3(0.6, 1.0, 0.95));
  return c;
}

// ---------- Disk ----------
// Sıcaklığa göre renk: kırmızı → turuncu → beyaz → mavimsi
vec3 sicaklikRengi(float t) {
  vec3 c = mix(vec3(0.75, 0.08, 0.01), vec3(1.0, 0.42, 0.08), smoothstep(0.25, 0.6, t));
  c = mix(c, vec3(1.0, 0.86, 0.66), smoothstep(0.55, 1.0, t));
  c = mix(c, vec3(0.72, 0.84, 1.0), smoothstep(1.0, 1.7, t));
  return c;
}
float diskDokusu(float r, float aci, float t, float kaydir) {
  // İç halkalar daha hızlı döner (Kepler: açısal hız ∝ r^-1.5)
  float w = 0.9 * uDiskHiz * pow(r, -1.5);
  float u = fract((aci - w * t) / (2.0 * PI) + kaydir);
  float rr = r + kaydir * 7.0;
  return 0.55 * gurultuHalka(vec2(u * 14.0, rr * 2.2), 14.0)
       + 0.30 * gurultuHalka(vec2(u * 30.0, rr * 5.5), 30.0)
       + 0.15 * gurultuHalka(vec2(u * 62.0, rr * 12.0), 62.0);
}
// Işının diski kestiği noktadaki renk (rgb) ve opaklık (a).
vec4 disk(vec3 nokta, vec3 isinYonu) {
  float r = length(nokta.xz);
  if (r < uDiskIc || r > uDiskDis) return vec4(0.0);
  float aci = atan(nokta.z, nokta.x);

  // Disk maddesinin hızı (ışık hızı cinsinden), dairesel yörünge: v = sqrt( (r_s/2) / (r - r_s) )
  float v = min(sqrt(0.5 / (r - 1.0)), 0.92);
  vec3 hiz = v * vec3(-sin(aci), 0.0, cos(aci)) * sign(uDiskHiz + 0.0001);
  vec3 goze = -normalize(isinYonu); // ışığın bize doğru geldiği yön
  // Doppler çarpanı: madde bize yaklaşıyorsa > 1 (parlak, mavi), uzaklaşıyorsa < 1 (sönük, kırmızı)
  float doppler = sqrt(1.0 - v * v) / (1.0 - dot(hiz, goze));
  // Kütleçekimsel kırmızıya kayma: derinden gelen ışık enerji kaybeder
  float cekim = sqrt(1.0 - 1.0 / r);
  float g = doppler * cekim;

  // Doku: iki ayrı zaman fazı yumuşakça değiştirilir, böylece doku zamanla düğümlenmez
  const float T = 48.0;
  float f1 = mod(uZaman, T); float f2 = mod(uZaman + 0.5 * T, T);
  float a1 = 1.0 - abs(f1 / T * 2.0 - 1.0);
  float doku = diskDokusu(r, aci, f1, 0.0) * a1 + diskDokusu(r, aci, f2, 0.37) * (1.0 - a1);

  float sicaklik = pow(uDiskIc / r, 0.75);           // içeride sıcak, dışarıda soğuk
  float kenar = smoothstep(uDiskIc, uDiskIc + 0.35, r) * (1.0 - smoothstep(uDiskDis * 0.55, uDiskDis, r));
  vec3 renk = sicaklikRengi(sicaklik * g * 1.25);
  float parlaklik = pow(g, 3.0) * sicaklik * sicaklik * (0.25 + 1.5 * doku * doku) * 3.2; // g³: ışınım demetlenmesi
  float opak = clamp(kenar * (0.45 + 0.75 * doku), 0.0, 0.96);
  return vec4(renk * parlaklik, opak);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y) * 2.0;
  vec3 p = uKam;
  vec3 v = normalize(uKamR * vec3(uv * uTan, 1.0));

  // Açısal momentumun karesi. Merkezcil kuvvette korunur; bu yüzden döngü dışında bir kez hesaplanır.
  vec3 L = cross(p, v);
  float h2 = dot(L, L);
  float kacis = length(uKam) * 1.05 + 1.0;

  vec3 renk = vec3(0.0);
  float gecirgen = 1.0;   // önümüzdeki disk katmanlarından sonra kalan ışık oranı
  bool yutuldu = false;
  bool kacti = false;

  for (int i = 0; i < ADIM; i++) {
    float r2 = dot(p, p);
    float r = sqrt(r2);
    if (r < 1.0) { yutuldu = true; break; }                       // olay ufku
    if (r > kacis && dot(p, v) > 0.0) { kacti = true; break; }    // uzaklaştı
    float dt = clamp(uAdimK * r, 0.03, 2.5);                      // deliğe yakınken küçük adım

    // Schwarzschild'de ışığın yörünge denklemi u'' + u = (3/2) u²  (u = 1/r, r_s = 1).
    // Bu, aşağıdaki "ivme" ile düz uzayda hareket eden bir parçacığın yoluyla birebir aynıdır:
    vec3 ivme = -1.5 * h2 * p / (r2 * r2 * r);
    v += ivme * dt;
    vec3 yeni = p + v * dt;

    // Bu adımda disk düzlemini (y = 0) geçtik mi?
    if (p.y * yeni.y < 0.0) {
      float k = p.y / (p.y - yeni.y);
      vec4 d = disk(mix(p, yeni, k), v);
      renk += gecirgen * d.rgb * d.a;
      gecirgen *= 1.0 - d.a;
      if (gecirgen < 0.02) break;
    }
    p = yeni;
  }

  if (!yutuldu) {
    // Adım sayısı bittiyse ışın foton küresinde dolanıyordur; onu da vardığı yöne göre boyarız.
    renk += gecirgen * gokyuzu(v) * (kacti ? 1.0 : 0.5);
  }

  // Foton halkası: çarpma parametresi b = sqrt(h2), kritik değer b_c = (3√3/2) r_s ≈ 2.598.
  // Bu değere çok yakın ışınlar deliğin çevresinde defalarca dolanır; ince parlak halka oradan gelir.
  // (Halkanın kendisi yukarıdaki hesapta zaten oluşur; burada sadece hafifçe güçlendiriliyor.)
  float b = sqrt(h2);
  float halka = exp(-pow((b - 2.62) / 0.035, 2.0)) * 0.9 + exp(-max(b - 2.6, 0.0) * 2.2) * step(2.6, b) * 0.1;
  renk += gecirgen * halka * vec3(1.0, 0.82, 0.6);

  // Ton eşleme ve gama
  renk = 1.0 - exp(-renk * uPoz);
  renk = pow(renk, vec3(0.4545));

  // Tuvalin kenarlarına doğru saydamlaş: sahne, sayfanın yıldız alanına karışsın
  vec2 n = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  float a = 1.0 - smoothstep(0.72, 1.0, length(n));
  gl_FragColor = vec4(renk * a, a);
}
`;

function shaderDerle(gl, tur, kaynak) {
  const s = gl.createShader(tur);
  gl.shaderSource(s, kaynak);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[kara delik] shader derlenemedi:\n' + gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

const RAD = Math.PI / 180;
const capraz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const birim = (a) => {
  const u = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / u, a[1] / u, a[2] / u];
};

/**
 * Kara deliği verilen <canvas> üzerine kurar.
 * @returns {null | {ayarla, baslat, durdur, tekKare, yokEt, parametreler}}  WebGL yoksa null döner.
 */
export function karaDelikOlustur(canvas, parametreler = {}) {
  const P = { ...VARSAYILAN, ...parametreler };
  const gl =
    canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' }) ||
    canvas.getContext('experimental-webgl');
  if (!gl) return null;

  const telefon = matchMedia('(max-width: 720px), (pointer: coarse)').matches;
  const dusuk = P.kalite === 'dusuk' || (P.kalite === 'oto' && telefon);
  // Kalite: adım sayısı ve çözünürlük ölçeği. Telefonda ikisi de düşük tutulur.
  const ADIM = dusuk ? 90 : 150;
  const adimK = dusuk ? 0.15 : 0.1;
  let olcek = dusuk ? 0.6 : 1.0;

  const vs = shaderDerle(gl, gl.VERTEX_SHADER, KOSE_SHADER);
  const fs = shaderDerle(gl, gl.FRAGMENT_SHADER, `#define ADIM ${ADIM}\n` + PIKSEL_SHADER);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[kara delik] program bağlanamadı: ' + gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  // Ekranı kaplayan tek üçgen
  const tampon = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const konum = gl.getAttribLocation(prog, 'aKonum');
  gl.enableVertexAttribArray(konum);
  gl.vertexAttribPointer(konum, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const ad of ['uRes', 'uZaman', 'uKam', 'uKamR', 'uTan', 'uDiskIc', 'uDiskDis', 'uDiskHiz', 'uPoz', 'uGok', 'uAdimK']) {
    U[ad] = gl.getUniformLocation(prog, ad);
  }

  let calisiyor = false;
  let kareId = 0;
  let zaman = 0;
  let onceki = 0;
  let fareX = 0;
  let fareY = 0;
  let fx = 0;
  let fy = 0;
  let yavasKare = 0;
  let olcumSayisi = 0;

  function boyutla() {
    const dpr = Math.min(window.devicePixelRatio || 1, dusuk ? 1.25 : 1.5) * olcek;
    const g = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const y = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== g || canvas.height !== y) {
      canvas.width = g;
      canvas.height = y;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function ciz() {
    boyutla();
    fx += (fareX - fx) * 0.04;
    fy += (fareY - fy) * 0.04;

    // --- Kamera ---
    const s = P.salinim;
    const egim = (P.egim - fy * 5 + Math.sin(zaman * 0.13) * 1.6 * s) * RAD;
    const az = (P.azimut + fx * 14 + Math.sin(zaman * 0.09) * 5 * s) * RAD;
    const D = P.uzaklik / Math.max(P.kutle, 0.05); // kütle büyürse delik büyür = göreli olarak yaklaşırız
    const kam = [D * Math.sin(egim) * Math.cos(az), D * Math.cos(egim), D * Math.sin(egim) * Math.sin(az)];
    const ileri = birim([-kam[0], -kam[1], -kam[2]]);
    let sag = birim(capraz(ileri, [0, 1, 0]));
    let yukari = capraz(sag, ileri);
    const y = (P.yatis + Math.sin(zaman * 0.07) * 1.2 * s) * RAD;
    const c = Math.cos(y);
    const sn = Math.sin(y);
    const sag2 = [sag[0] * c + yukari[0] * sn, sag[1] * c + yukari[1] * sn, sag[2] * c + yukari[2] * sn];
    const yuk2 = [yukari[0] * c - sag[0] * sn, yukari[1] * c - sag[1] * sn, yukari[2] * c - sag[2] * sn];

    // --- Gökyüzü dönüşü: fare + çok yavaş kendiliğinden kayma ---
    const a = fx * 0.55 + zaman * 0.012;
    const b = fy * 0.3;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const cb = Math.cos(b);
    const sb = Math.sin(b);
    // R = Rx(b) · Ry(a), sütun sırasıyla
    const gok = [ca, sa * sb, -sa * cb, 0, cb, sb, sa, -ca * sb, ca * cb];

    const dikey = canvas.height > canvas.width;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uZaman, zaman);
    gl.uniform3fv(U.uKam, kam);
    gl.uniformMatrix3fv(U.uKamR, false, [...sag2, ...yuk2, ...ileri]);
    gl.uniform1f(U.uTan, P.gorusAcisi * (dikey ? 1.2 : 1));
    const ic = P.diskIc ?? iscoYaricapi(P.donme);
    gl.uniform1f(U.uDiskIc, ic);
    gl.uniform1f(U.uDiskDis, Math.max(P.diskDis, ic + 0.5));
    gl.uniform1f(U.uDiskHiz, P.diskHiz);
    gl.uniform1f(U.uPoz, P.pozlama);
    gl.uniformMatrix3fv(U.uGok, false, gok);
    gl.uniform1f(U.uAdimK, adimK);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function dongu(simdi) {
    if (!calisiyor) return;
    const dt = Math.min(0.1, (simdi - onceki) / 1000 || 0);
    onceki = simdi;
    zaman += dt;

    // Otomatik kalite: kareler sürekli yavaşsa çözünürlüğü düşür
    if (P.kalite === 'oto' && dt > 0) {
      olcumSayisi++;
      if (dt > 0.03) yavasKare++;
      if (olcumSayisi >= 45) {
        if (yavasKare > 28 && olcek > 0.34) olcek *= 0.8;
        olcumSayisi = 0;
        yavasKare = 0;
      }
    }
    ciz();
    kareId = requestAnimationFrame(dongu);
  }

  const fareDinle = (e) => {
    if (!P.etkilesim) return;
    fareX = (e.clientX / window.innerWidth) * 2 - 1;
    fareY = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', fareDinle, { passive: true });

  return {
    parametreler: P,
    /** Parametreleri canlı değiştirir: ayarla({ kutle: 2, egim: 60 }) */
    ayarla(yeni) {
      Object.assign(P, yeni);
      if (!calisiyor) ciz();
    },
    baslat() {
      if (calisiyor) return;
      calisiyor = true;
      onceki = performance.now();
      kareId = requestAnimationFrame(dongu);
    },
    durdur() {
      calisiyor = false;
      cancelAnimationFrame(kareId);
    },
    /** Tek bir durağan kare çizer (animasyonlar kapalıyken). */
    tekKare(t = 12) {
      zaman = t;
      fx = fareX;
      fy = fareY;
      ciz();
    },
    get calisiyor() {
      return calisiyor;
    },
    yokEt() {
      this.durdur();
      window.removeEventListener('pointermove', fareDinle);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
