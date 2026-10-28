# As Fitness — web deneyimi

Yıldırım / Bursa'daki As Fitness için zifiri siyah, antrasit ve kan kırmızısı; sinematik, çok sayfalı site.

**Teknoloji:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · GSAP 3 (ScrollTrigger, SplitText) · Three.js / React Three Fiber · Lenis

## Çalıştırma

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # üretim derlemesi
```

## Vercel'e yayınlama

1. [vercel.com/new](https://vercel.com/new) → GitHub'dan `yasintrm16/asfitness` deposunu **Import** et.
   Framework otomatik **Next.js** seçilir; build / output ayarlarına dokunma.
2. Ortam değişkeni gerekmez. Sitenin adresi (paylaşım kartı, `sitemap.xml`, `robots.txt`) Vercel'in
   `VERCEL_PROJECT_PRODUCTION_URL` değişkeninden kendiliğinden gelir: kendi alan adını bağlarsan o, yoksa
   `proje.vercel.app`. Farklı bir adres gerekirse `NEXT_PUBLIC_SITE_URL` tanımla (`src/lib/siteUrl.ts`).
3. Kendi alan adı: Vercel → proje → **Settings → Domains**.
4. Sonrasında `main` dalına her `git push` otomatik yayına çıkar; diğer dallar önizleme adresi alır.

Link WhatsApp / Instagram'da paylaşılınca görünen kart `src/app/opengraph-image.tsx`'te çizilir
(sitenin fontlarıyla, `src/app/_og/` — Türkçe harfler için statik TTF kesimleri).

## Sayfalar

Yönlendirme Next.js'in dosya tabanlı router'ı ile yapılır (`App.jsx` + react-router-dom yerine):
her klasördeki `page.tsx` bir sayfadır, header/footer `src/app/layout.tsx` içinde tüm sayfalarda ortak.

| Adres         | Dosya                         | İçerik                                                                 |
| ------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `/`           | `src/app/page.tsx`            | 3D sahne: hero, "Barı yükle" (20→160 kg), Ekipman, Nabız, yorumlar, galeri önizlemesi |
| `/hakkimizda` | `src/app/hakkimizda/page.tsx` | Kurucu fotoğrafı sinematik arka plan, vizyon ve kurucu mesajı          |
| `/galeri`     | `src/app/galeri/page.tsx`     | Asimetrik parallax galeri, hover'da zoom + kırmızı ton                 |
| `/iletisim`   | `src/app/iletisim/page.tsx`   | Ara / WhatsApp'ta fiyat sor / Instagram, harita, saatler, form         |

## Yapı

```
src/
├─ app/                    layout, sayfalar, globals.css (renk/tipografi token'ları),
│                          opengraph-image.tsx (paylaşım kartı), robots.ts, sitemap.ts
├─ components/
│  ├─ Curtain.tsx          İlk girişte kırmızı çizgiden ikiye açılan perde
│  ├─ Header.tsx           Cam efektli sabit menü, neon alt çizgi, mobil menü
│  ├─ Footer.tsx           Antrenman bantları, davet, plaka rozeti, menü, saatler, halter ayraç, dev yazı
│  ├─ Hero.tsx             Ana sayfa girişi
│  ├─ LoadTheBar.tsx       Sabitlenen bölüm: scroll'la plakalar takılır, sayaç, bar kaldırılır
│  ├─ Equipment.tsx        Sabitlenen bölüm: kettlebell, dambıl, lastik sırayla sahneye gelir
│  ├─ Pulse.tsx            Sabitlenen bölüm: kalp atışı (72→172 BPM), EKG ve sis nabzı, kısa bilgiler
│  ├─ GalleryTeaser.tsx    Ana sayfa sonu: galeriden dört kare
│  ├─ three/
│  │  ├─ SceneCanvas.tsx   Sabit 3D katman (yalnızca tarayıcıda yüklenir, ekran dışında durur)
│  │  ├─ GymScene.tsx      Kamera, ışıklar, prosedürel stüdyo ortamı
│  │  ├─ Barbell.tsx       Bar + "AS FITNESS" plakaları: süzülme, takılma, esneme, hover/tık
│  │  ├─ Gear.tsx          Kettlebell, altıgen dambıl, traktör lastiği: süzülme, sahneye gelme, hover/tık
│  │  ├─ Heartbeat.tsx     Nabız bölümündeki EKG çizgisi (shader)
│  │  ├─ Atmosphere.tsx    Kızıl sis ve partiküller (shader'lar)
│  │  └─ textures.ts       Plaka, dambıl, kettlebell ve lastik baskıları, tırtıl deseni (canvas dokuları)
│  ├─ Testimonials.tsx     "Üyelerimiz Ne Diyor?" sporcu kartları, kinetik yazı, plaka rozeti
│  ├─ FounderBackdrop.tsx  kurucu.jpg → CSS ile kırmızı-siyah afiş
│  ├─ About.tsx            Vizyon (satır satır) + kurucu mesajı (kelime kelime)
│  ├─ Gallery.tsx          Parallax galeri
│  ├─ Contact.tsx          İletişim sayfası · ContactForm.tsx form · Icon.tsx ikonlar
│  └─ LiveStatus.tsx       "Canlı: Çok yoğun değil" rozeti
└─ lib/
   ├─ site.ts              TÜM İÇERİK: işletme bilgileri, WhatsApp mesajı, Instagram, saatler, yorumlar, galeri
   ├─ siteUrl.ts           Canlı adres (Vercel'den otomatik)
   ├─ sceneRig.ts          GSAP ↔ Three.js köprüsü, imleç
   ├─ gsap.ts              Plugin kaydı, giriş zamanlaması
   └─ schedule.ts          Salonun yerel saatine göre "bugün" ve açık/kapalı
```

## İçerik notları

- **Yorumlar** (`src/lib/site.ts` → `testimonials`) boş: ana sayfada kartlar yerine Google yorumlarına giden
  bir davet görünür. Gerçek yorumları (yazanın izniyle, isim baş harfle) eklediğin an kartlar geri gelir.
- **Hakkımızda metni** (`about`) taslaktır; kurucunun onayı ya da kendi cümleleri en doğrusu. `founder.name` doldurulursa imzada görünür.
- **WhatsApp** butonları "Merhaba, fiyat bilgisi almak istiyorum." mesajıyla açılır (`site.whatsapp`).
- **"Canlı: Çok yoğun değil"** rozeti (`site.liveStatus`) sabit bir metindir; gerçek yoğunluğu göstermez.
- **Ekipman** bölümündeki metinler (`src/components/Equipment.tsx`) salonda olan aletlere göre düzenlenebilir.

## Görseller — `public/images/`

| Dosya              | Nerede                                                               |
| ------------------ | -------------------------------------------------------------------- |
| `logo.png`         | Header, footer (favicon: `src/app/icon.png`)                         |
| `kurucu.jpg`       | Hakkımızda arka planı (yoksa `ig-squat.jpg` görünür)                 |
| `galeri-N.jpg`     | Galeri büyük kareleri — `site.ts` → `gallery` dizisine satır ekle    |
| `ig-*.jpg`         | Instagram gönderilerinden kırpılan kareler (galeri, hakkımızda)      |
| `unnamed (N).jpg`  | Galeri küçük kareleri (`galleryDetails`) — 141 px, küçük kullanılır  |

Aynı adla daha yüksek çözünürlüklü dosya koymak yeterli; kod değişmez.

## Renk

`src/app/globals.css` → `--color-accent: #cc0000`. 3D sahne de rengi buradan okur. Mavi hiçbir yerde
kullanılmaz; tarayıcının otomatik doldurma ve dokunma vurgusu mavileri de bastırılmıştır.

## Erişilebilirlik ve performans

- `prefers-reduced-motion` açıkken yumuşak scroll, giriş perdesi ve kayan animasyonlar kapanır; içerik doğrudan görünür.
- 3D sahne ayrı pakette, yalnızca tarayıcıda yüklenir; 3D'li bölümler ekrandan çıkınca çizim durur, WebGL çökerse sayfa ayakta kalır.
