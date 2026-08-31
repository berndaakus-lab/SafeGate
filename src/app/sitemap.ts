import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://verifygate.app";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/schools`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/get-started`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
