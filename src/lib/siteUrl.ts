/**
 * Sitenin canlı adresi — paylaşım kartı, sitemap ve robots tam URL ister. Yalnızca sunucuda kullanılır.
 * Vercel'de kendiliğinden gelir (VERCEL_PROJECT_PRODUCTION_URL: bağlı alan adın, yoksa proje.vercel.app).
 * Başka bir adres gerekirse Vercel → Settings → Environment Variables'a NEXT_PUBLIC_SITE_URL ekle.
 */
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(
  /\/$/,
  "",
);
