import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: "https://www.resumeroast.in",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://www.resumeroast.in/skillprint",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
