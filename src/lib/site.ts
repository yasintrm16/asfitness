/**
 * İşletme bilgileri — sitenin tek içerik kaynağı.
 * Metni burada değiştir; tüm bölümler buradan okur.
 */
export const site = {
  name: "As fitness",
  rating: { score: "4.9", reviews: 38 },
  address: {
    street: "Yavuz Selim, 3. Alpay Sk. No:52",
    city: "16290 Yıldırım/Bursa",
    full: "Yavuz Selim, 3. Alpay Sk. No:52, 16290 Yıldırım/Bursa",
  },
  phone: { display: "0538 616 60 99", href: "tel:+905386166099" },
  // Statik metin: gerçek zamanlı bir kaynağa (ör. Google "popüler saatler") bağlanana kadar.
  liveStatus: "Çok yoğun değil",
} as const;

export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.address.full)}`;

export type OpeningHours = {
  label: string;
  /** 0 = Pazar … 6 = Cumartesi (Date#getDay ile aynı) */
  days: readonly number[];
  open: string;
  /** "00:00" gece yarısı kapanış demektir */
  close: string;
  note?: string;
};

export const hours: readonly OpeningHours[] = [
  {
    label: "Pazartesi – Cuma",
    days: [1, 2, 3, 4, 5],
    open: "09:00",
    close: "00:00",
    note: "Perşembe günleri resmi tatillerde saatler değişebilir",
  },
  { label: "Cumartesi", days: [6], open: "12:00", close: "22:00" },
  { label: "Pazar", days: [0], open: "12:00", close: "18:00" },
];

export type GalleryItem = {
  /** null iken şık bir yer tutucu gösterilir */
  src: string | null;
  alt: string;
  /** CSS aspect-ratio — asimetrik ızgarayı bu oranlar oluşturur */
  aspect: string;
};

/*
 * GALERİ — fotoğrafları public/gallery/ klasörüne koy, ilgili satırda src'yi doldur.
 * alt metnini fotoğrafta gerçekte ne olduğuna göre güncelle (erişilebilirlik + SEO).
 */
export const gallery: GalleryItem[] = [
  // GALERİ FOTOSU 1 BURAYA → src: "/gallery/01.jpg"
  { src: null, alt: "Salon fotoğrafı 1", aspect: "4 / 5" },
  // GALERİ FOTOSU 2 BURAYA → src: "/gallery/02.jpg"
  { src: null, alt: "Salon fotoğrafı 2", aspect: "3 / 4" },
  // GALERİ FOTOSU 3 BURAYA → src: "/gallery/03.jpg"
  { src: null, alt: "Salon fotoğrafı 3", aspect: "1 / 1" },
  // GALERİ FOTOSU 4 BURAYA → src: "/gallery/04.jpg"
  { src: null, alt: "Salon fotoğrafı 4", aspect: "1 / 1" },
  // GALERİ FOTOSU 5 BURAYA → src: "/gallery/05.jpg"
  { src: null, alt: "Salon fotoğrafı 5", aspect: "4 / 5" },
  // GALERİ FOTOSU 6 BURAYA → src: "/gallery/06.jpg"
  { src: null, alt: "Salon fotoğrafı 6", aspect: "3 / 4" },
  // GALERİ FOTOSU 7 BURAYA → src: "/gallery/07.jpg"
  { src: null, alt: "Salon fotoğrafı 7", aspect: "3 / 4" },
  // GALERİ FOTOSU 8 BURAYA → src: "/gallery/08.jpg"
  { src: null, alt: "Salon fotoğrafı 8", aspect: "1 / 1" },
  // GALERİ FOTOSU 9 BURAYA → src: "/gallery/09.jpg"
  { src: null, alt: "Salon fotoğrafı 9", aspect: "4 / 5" },
];
