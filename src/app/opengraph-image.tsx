import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { hours, site } from "@/lib/site";

export const alt = `${site.name} — Sınırlarını Sen Belirle · Yıldırım / Bursa`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RED = "#cc0000";
const MUTED = "#8c8c8c";

/**
 * Sitedeki başlık fontları (Archivo condensed, Instrument Serif italik) ve logo. next/og yalnızca TTF/OTF/WOFF
 * okur ve hazır fontunda Türkçe harfler (İ, ş, ğ, ı) yok — statik kesimler _og/ klasöründe.
 * "use cache": dosyalar derlemede bir kez okunur, kart statik üretilir.
 */
async function loadAssets() {
  "use cache";
  // Yollar sabit yazılır: derleyici yalnızca bu üç dosyayı izler (dinamik yol tüm projeyi pakete katar).
  const [display, serif, logo] = await Promise.all([
    readFile(join(process.cwd(), "src/app/_og/archivo-condensed-bold.ttf")),
    readFile(join(process.cwd(), "src/app/_og/instrument-serif-italic.ttf")),
    readFile(join(process.cwd(), "public/images/logo.png")),
  ]);
  const bytes = (file: Buffer) => file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  return { display: bytes(display), serif: bytes(serif), logo: logo.toString("base64") };
}

/**
 * Paylaşım kartı (WhatsApp, Instagram, X…): sitenin afiş dili — zifiri siyah zemin, alttan kan kırmızısı
 * ışık, sağda yarısı kadrajdan taşan bir ağırlık plakası.
 */
export default async function OpengraphImage() {
  const { display, serif, logo } = await loadAssets();
  const week = hours[0];

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#000",
          color: "#f2f2f2",
          fontFamily: "Archivo",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 82% 105%, rgba(204,0,0,0.55), rgba(0,0,0,0) 60%)",
          }}
        />

        {/* Ağırlık plakası */}
        <div
          style={{
            position: "absolute",
            right: -150,
            top: 70,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: "#111",
            border: "2px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 430,
              height: 430,
              borderRadius: 9999,
              border: `3px solid ${RED}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 86, color: RED, letterSpacing: 4 }}>AS</div>
            <div
              style={{
                width: 110,
                height: 110,
                margin: "18px 0",
                borderRadius: 9999,
                background: "#1c1c1c",
                border: "8px solid #c8c8c8",
              }}
            />
            <div style={{ fontSize: 54, color: MUTED, letterSpacing: 6 }}>KG</div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src={`data:image/png;base64,${logo}`} width={72} height={72} alt="" />
            <div style={{ fontSize: 30, letterSpacing: 8 }}>AS FITNESS</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 168, lineHeight: 0.9, letterSpacing: 3 }}>SINIRLARINI</div>
            <div style={{ display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 168, lineHeight: 1 }}>
              <span style={{ color: RED }}>Sen</span>
              <span style={{ marginLeft: 36 }}>Belirle</span>
            </div>
          </div>

          <div
            style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 26, letterSpacing: 3, color: MUTED, whiteSpace: "nowrap" }}
          >
            <span>YILDIRIM · BURSA</span>
            <span style={{ width: 28, height: 4, background: RED }} />
            <span>
              {site.rating.score} · {site.rating.reviews} YORUM
            </span>
            <span style={{ width: 28, height: 4, background: RED }} />
            <span>
              HAFTA İÇİ {week.open}–{week.close}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: display, weight: 700, style: "normal" },
        { name: "Instrument Serif", data: serif, weight: 400, style: "italic" },
      ],
    },
  );
}
