import * as THREE from "three";

/** Sayfadaki Archivo yazı tipi (next/font) — plaka baskıları sitedeki başlıklarla aynı ailede olsun. */
function displayFamily() {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim();
  return family || "Arial Narrow, sans-serif";
}

export type PlateInk = { text: string; accent: string; fine: string };

/**
 * Tuvale çizilen baskı dokusu. Yazı tipi henüz yüklenmediyse yüklenince yeniden çizilir.
 * draw her seferinde temiz, orijini sol üstte bir bağlamla çağrılır.
 */
function printTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, family: string) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const paint = () => {
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    draw(ctx, displayFamily());
    texture.needsUpdate = true;
  };

  paint();
  document.fonts?.ready.then(paint);
  return texture;
}

/**
 * Plaka yüzü baskısı: dış çemberde marka yazısı, üstte büyük kilo, altta "KG".
 * Şeffaf zeminli; RingGeometry'nin düzlemsel UV'si kareye birebir oturur.
 */
export function plateFaceTexture(kg: number, ink: PlateInk) {
  const size = 1024;
  const mid = size / 2;
  return printTexture(size, size, (ctx, family) => {
    ctx.translate(mid, mid);

    // Çerçeve çizgileri
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, mid * 0.97, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = ink.fine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, mid * 0.74, 0, Math.PI * 2);
    ctx.stroke();

    // Dış çemberde dönen marka yazısı
    const ring = "AS FITNESS · YILDIRIM / BURSA · OLYMPIC · ";
    const chars = [...ring.repeat(2)];
    ctx.font = `600 40px ${family}`;
    ctx.fillStyle = ink.fine;
    chars.forEach((char, i) => {
      ctx.save();
      ctx.rotate((i / chars.length) * Math.PI * 2);
      ctx.fillText(char, 0, -mid * 0.855);
      ctx.restore();
    });

    // Büyük kilo (üst) ve KG (alt, ters)
    ctx.fillStyle = ink.text;
    ctx.font = `800 210px ${family}`;
    ctx.fillText(String(kg), 0, -mid * 0.5);
    ctx.save();
    ctx.rotate(Math.PI);
    ctx.font = `700 120px ${family}`;
    ctx.fillText("KG", 0, -mid * 0.5);
    ctx.restore();

    // Yanlarda küçük marka işareti
    ctx.font = `800 64px ${family}`;
    ctx.fillStyle = ink.accent;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate((side * Math.PI) / 2);
      ctx.fillText("AS", 0, -mid * 0.52);
      ctx.restore();
    }
  });
}

/** Dambıl başının dış yüzü: çift çember, üstte "AS", ortada kilo, altta "KG". Şeffaf zeminli. */
export function badgeTexture(kg: number, ink: PlateInk) {
  const size = 512;
  const mid = size / 2;
  return printTexture(size, size, (ctx, family) => {
    ctx.translate(mid, mid);
    ctx.strokeStyle = ink.accent;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, mid * 0.94, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = ink.fine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, mid * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = ink.accent;
    ctx.font = `800 58px ${family}`;
    ctx.fillText("AS", 0, -mid * 0.52);
    ctx.fillStyle = ink.text;
    ctx.font = `800 190px ${family}`;
    ctx.fillText(String(kg), 0, mid * 0.02);
    ctx.fillStyle = ink.fine;
    ctx.font = `700 54px ${family}`;
    ctx.fillText("KG", 0, mid * 0.55);
  });
}

/**
 * Kettlebell'in ön yüzüne kavisli oturan baskı (SphereGeometry yaması; UV'si yamaya göre 0–1).
 * Yarışma kettlebell'i gibi: büyük kilo, altında KG, üstte marka.
 */
export function kettlebellTexture(kg: number, ink: PlateInk) {
  const w = 512;
  const h = 384;
  return printTexture(w, h, (ctx, family) => {
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = ink.accent;
    ctx.font = `800 44px ${family}`;
    ctx.fillText("AS FITNESS", 0, -h * 0.36);
    ctx.fillRect(-90, -h * 0.27, 180, 4);
    ctx.fillStyle = ink.text;
    ctx.font = `800 230px ${family}`;
    ctx.fillText(String(kg), 0, h * 0.04);
    ctx.fillStyle = ink.fine;
    ctx.font = `700 56px ${family}`;
    ctx.fillText("KG", 0, h * 0.4);
  });
}

/**
 * Traktör lastiğinin yanak baskısı (LatheGeometry UV'si: u çevre, v kesit boyunca).
 * Kesit iç kenardan başlar: v = 0.25 arka yanak, 0.5 sırt, 0.75 kameraya bakan yanak.
 * around / across: u ve v yönlerinin dünya birimindeki uzunluğu — yazı lastikte basık görünmesin diye.
 */
export function tireTexture(around: number, across: number) {
  const w = 2048;
  const h = 512;
  const stretch = h / across / (w / around);
  return printTexture(w, h, (ctx, family) => {
    ctx.fillStyle = "#101010";
    ctx.fillRect(0, 0, w, h);

    // Yanaklardaki ince halka çizgileri
    ctx.fillStyle = "#1c1c1c";
    for (const center of [0.25, 0.75]) {
      for (const offset of [-0.085, 0.085]) ctx.fillRect(0, (center + offset) * h, w, 3);
    }

    // Kameraya bakan yanak (v = 0.75 → tuvalde üst çeyrek) ve arka yanak; marka ve alt yazı sırayla.
    for (const center of [0.25, 0.75]) {
      for (let i = 0; i < 4; i++) {
        const brand = i % 2 === 0;
        ctx.save();
        ctx.translate(((i + 0.5) / 4) * w, center * h);
        ctx.scale(1, stretch);
        ctx.fillStyle = brand ? "#c40000" : "#707070";
        ctx.font = brand ? `800 72px ${family}` : `600 34px ${family}`;
        ctx.fillText(brand ? "AS FITNESS" : "HEAVY DUTY · YILDIRIM", 0, 0);
        ctx.restore();
      }
    }
  });
}

/** Bar tutuş bölgesi için elmas desenli tırtıl (knurling) — bump haritası olarak tekrar eder. */
export function knurlTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#202020";
  ctx.lineWidth = 6;
  for (const dir of [1, -1]) {
    for (let i = -size; i <= size * 2; i += size / 2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + dir * size, size);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 26);
  return texture;
}
