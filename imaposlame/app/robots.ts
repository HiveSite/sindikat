import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/firma/", "/profil/", "/auth/", "/api/"]
      }
    ],
    sitemap: "https://imaposla.me/sitemap.xml"
  };
}
