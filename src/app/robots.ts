import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/parent",
        "/parent/",
        "/superadmin",
        "/superadmin/",
        "/guard",
        "/guard/",
        "/api/",
        "/login",
        "/offline",
      ],
    },
    sitemap: "https://verifygate.app/sitemap.xml",
  };
}
