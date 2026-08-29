export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/images/"],
        disallow: ["/admin", "/admin/", "/api/"]
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/images/"
      }
    ],
    sitemap: "https://www.bhrtraders.com/sitemap.xml",
    host: "https://www.bhrtraders.com"
  };
}
