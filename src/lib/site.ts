/**
 * İşletme bilgileri — sitenin tek içerik kaynağı.
 * Metni burada değiştir; tüm sayfalar buradan okur.
 */
const WHATSAPP_NUMBER = "905386166099";

/** WhatsApp sohbetini, mesaj kutusunda hazır yazılmış bir metinle açar. */
export const whatsappLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const site = {
  name: "As Fitness",
  rating: { score: "4.9", reviews: 38 },
  address: {
    street: "Yavuz Selim, 3. Alpay Sk. No:52",
    city: "16290 Yıldırım/Bursa",
    full: "Yavuz Selim, 3. Alpay Sk. No:52, 16290 Yıldırım/Bursa",
  },
  phone: { display: "0538 616 60 99", href: "tel:+905386166099" },
  // Sitedeki her WhatsApp butonu bu mesajla açılır.
  whatsapp: whatsappLink("Merhaba, fiyat bilgisi almak istiyorum."),
  instagram: { handle: "@as_fitnessofficial1", href: "https://www.instagram.com/as_fitnessofficial1/" },
  // Statik metin: gerçek zamanlı bir kaynağa (ör. Google "popüler saatler") bağlanana kadar.
  liveStatus: "Çok yoğun değil",
} as const;

export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.address.full)}`;

/** Salonun Google Haritalar kaydı: puan ve yorumlar burada. */
export const reviewsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.name}, ${site.address.full}`)}`;

/** Gri tonlu, anahtarsız Google Haritalar gömmesi (İletişim sayfası). */
export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(site.address.full)}&z=16&output=embed`;

export const nav = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/galeri", label: "Galeri" },
  { href: "/iletisim", label: "İletişim" },
] as const;

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

export type Testimonial = { quote: string; name: string; since: string };

/*
 * ÜYE YORUMLARI — boş kaldıkça ana sayfada kartlar yerine Google yorumlarına giden bir davet görünür.
 * Google Haritalar'daki gerçek yorumları (yazanın izniyle, isim baş harfle) şu biçimde ekle; kartlar kendiliğinden gelir:
 *   { quote: "Yorumun metni…", name: "Emre K.", since: "Üye · 2 yıl" },
 * Uydurma yorum yayınlamak hem yanıltıcı hem de tüketici mevzuatına aykırı.
 */
export const testimonials: Testimonial[] = [];

/*
 * HAKKIMIZDA METNİ — taslak. Kurucunun kendi cümleleriyle güncellemesi en doğrusu.
 * founder.name boş kaldıkça imzada yalnızca unvan görünür.
 */
export const about = {
  vision:
    "Yıldırım'ın kalbinde, siyahın ve kırmızının arasında bir sığınak kurduk. Burada kimse seni başkasıyla kıyaslamaz; tek rakibin dünkü hâlin.",
  values: [
    { title: "Disiplin", text: "Motivasyon gelir ve gider. Biz her gün aynı kararlılıkla açılan bir kapı olmayı seçtik." },
    { title: "Saygı", text: "İlk gününde de, yüzüncü gününde de aynı özeni görürsün. Herkesin yolu kendine." },
    { title: "Süreklilik", text: "Gece yarısına kadar açığız; çünkü gelişim, takvime değil sana uyar." },
  ],
  founderMessage:
    "Bu salonu, kendi antrenmanlarımda hep aradığım yeri yaratmak için açtım: gösterişten uzak, ciddiyeti olan, insana iyi gelen bir yer. Buraya her adım atan kişinin bir hikâyesi var ve ben o hikâyenin bir parçası olmaktan gurur duyuyorum. Sınırlarını burada keşfedeceksin; onları aşmaya karar vermek ise yalnızca sana kalmış.",
  founder: { name: null as string | null, title: "Kurucu" },
};

export type GalleryItem = {
  src: string;
  alt: string;
  /** Görselin gerçek en/boy oranı — sayfa yüklenirken yer tutar, kayma olmaz */
  width: number;
  height: number;
};

/*
 * GALERİ — büyük kareler. Yeni fotoğrafı public/images/ klasörüne koyup buraya bir satır eklemen
 * yeterli; asimetrik dizilim kendini tekrarlayarak uzar. Sıra: yatay, dikey, dikey, yatay, …
 * (dar kutular dikey fotoğraflara göre). ig-*.jpg: Instagram gönderilerinden kırpıldı.
 */
export const gallery: GalleryItem[] = [
  { src: "/images/galeri-1.jpg", alt: "Dambıl rafının başında antrenman", width: 403, height: 347 },
  { src: "/images/ig-dambil-rafi.jpg", alt: "Kırmızı ışık altında dambıl rafı", width: 280, height: 325 },
  { src: "/images/ig-lastik.jpg", alt: "Lastik çevirme", width: 246, height: 287 },
  { src: "/images/galeri-2.jpg", alt: "Kablo istasyonunun önünde", width: 430, height: 356 },
];

/*
 * Salondan küçük kareler (Google Haritalar'dan alınan 141 px'lik görseller). Küçük boyutta,
 * "kontakt baskı" gibi kullanılır. Aynı dosyaların büyük hâli gelirse gallery dizisine taşı.
 */
export const galleryDetails: GalleryItem[] = [
  { src: "/images/unnamed (17).jpg", alt: "Salona uzanan kırmızı koridor", width: 141, height: 235 },
  { src: "/images/unnamed (5).jpg", alt: "As Fitness tabelası, gece", width: 141, height: 176 },
  { src: "/images/unnamed (12).jpg", alt: "Logolu duvar ve dambıl rafı", width: 141, height: 235 },
  { src: "/images/unnamed (4).jpg", alt: "Dambıl rafı", width: 141, height: 235 },
  { src: "/images/unnamed (18).jpg", alt: "Kırmızı kirişli ağırlık alanı", width: 141, height: 176 },
  { src: "/images/unnamed (13).jpg", alt: "Kablo istasyonu", width: 141, height: 235 },
];
