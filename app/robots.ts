import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/utils/url";

const BASE_URL = getAppBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/app/", "/admin/"] },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
