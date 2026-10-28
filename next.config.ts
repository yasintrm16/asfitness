import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Üst dizinde (~/) başka bir package-lock.json var; Turbopack kökü yanlış
    // tahmin edip tüm ev dizinini izlemesin diye kökü bu projeye sabitliyoruz.
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
