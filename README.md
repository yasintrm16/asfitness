# As fitness — web deneyimi

Yıldırım / Bursa'daki As fitness için "yerçekimsiz" temalı, tek sayfalık interaktif site.

**Teknoloji:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · GSAP 3 (ScrollTrigger, SplitText) · Three.js / React Three Fiber / drei · Lenis

## Çalıştırma

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # üretim derlemesi
```

## Yapı

```
src/
├─ app/
│  ├─ layout.tsx        Fontlar (Archivo + JetBrains Mono), metadata
│  ├─ page.tsx          Bölümlerin dizilişi + schema.org verisi
│  └─ globals.css       Tasarım token'ları (renkler, tipografi yardımcıları)
├─ components/
│  ├─ Header.tsx        Logo giriş animasyonu (merkezden köşeye) + menü
│  ├─ Hero.tsx          Tam ekran giriş, SplitText başlık, manyetik "Bize Katıl"
│  ├─ InfoSection.tsx   Adres, telefon, puan, çalışma saatleri, canlı durum
│  ├─ Gallery.tsx       Asimetrik scroll galerisi + imleci takip eden halka
│  ├─ Footer.tsx        Yol tarifi + kapanış
│  ├─ Logo.tsx          ← LOGO BURAYA
│  └─ three/
│     ├─ SceneCanvas.tsx  3D katmanı yalnızca tarayıcıda, ayrı paket olarak yükler
│     ├─ GymScene3D.tsx   Canvas, ışık, bloom + ScrollTrigger → 3D bağlantısı
│     └─ Dumbbell.tsx     Prosedürel dambıl; plakaların ayrılıp birleşmesi
└─ lib/
   ├─ site.ts           İşletme bilgileri, saatler, galeri listesi (tüm içerik)
   ├─ sceneRig.ts       GSAP ↔ Three.js köprüsü
   ├─ gsap.ts           Plugin kaydı, intro zamanlaması
   └─ schedule.ts       Salonun yerel saatine göre "bugün" ve açık/kapalı
```

## 3D ve scroll nasıl bağlı?

`lib/sceneRig.ts` içindeki `rig` nesnesinin her alanını tek bir ScrollTrigger yazar
(`GymScene3D.tsx → useScrollRig`), `Dumbbell.tsx` her karede `useFrame` ile okur:

| Bölüm  | Kanal     | Ne olur                                          |
| ------ | --------- | ------------------------------------------------ |
| Hero   | `lift`    | Dambıl, biri kaldırıyormuş gibi yükselir         |
| Bilgi  | `explode` | Plakalar ayrılır, süzülür, yeniden kilitlenir    |
| Galeri | `drift`   | Obje kenara ve derine çekilir                    |
| Footer | `settle`  | Merkeze inip yerine oturur                       |

## Logo, fotoğraflar, renk

- **Logo:** `src/components/Logo.tsx` → "LOGO BURAYA" notundaki adımlar. Favicon: `src/app/icon.svg`.
- **Galeri:** fotoğrafları `public/gallery/` içine koy, `src/lib/site.ts` → `gallery` dizisinde
  ilgili satırın `src` alanını doldur (`// GALERİ FOTOSU 1 BURAYA` …).
- **Vurgu rengi:** `src/app/globals.css` → `--color-neon`. 3D sahne de rengi buradan okur.

## Erişilebilirlik

`prefers-reduced-motion` açık olan ziyaretçilerde yumuşak scroll, giriş animasyonu ve
süzülme kapanır; içerik doğrudan görünür.
