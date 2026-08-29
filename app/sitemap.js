const SITE = "https://www.bhrtraders.com";

export default function sitemap() {
  return [
    {
      url: SITE + "/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      images: [
        SITE + "/images/shop-exterior.jpg",
        SITE + "/images/shop-storefront.jpg",
        SITE + "/images/shop-interior.jpg"
      ]
    }
  ];
}
