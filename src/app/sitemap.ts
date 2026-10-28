import type { MetadataRoute } from "next";
import { nav } from "@/lib/site";
import { siteUrl } from "@/lib/siteUrl";

/** Menüdeki her sayfa (site.ts → nav); yeni sayfa menüye eklenince buraya da girer. */
export default function sitemap(): MetadataRoute.Sitemap {
  return nav.map((item) => ({
    url: item.href === "/" ? siteUrl : `${siteUrl}${item.href}`,
    changeFrequency: "monthly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
