import { requireAdmin, unauthorized } from "../../../../lib/auth.js";
import { getSupabase, json, options } from "../../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

function stars(n) {
  const r = Math.max(1, Math.min(5, Number(n) || 5));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function mapReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title || "",
    name: row.name,
    city: row.city || "",
    rating: Number(row.rating || 5),
    stars: stars(row.rating),
    comment: row.comment,
    created_at: row.created_at
  };
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("product_reviews").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    const reviews = (data || []).map(mapReview);
    const count = reviews.length;
    const avg = count ? reviews.reduce((n, r) => n + r.rating, 0) / count : 0;
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length
    }));
    const byProduct = {};
    reviews.forEach((r) => {
      const key = r.productId || "unknown";
      if (!byProduct[key]) byProduct[key] = { productId: key, title: r.productTitle || key, count: 0, sum: 0 };
      byProduct[key].count += 1;
      byProduct[key].sum += r.rating;
    });
    const products = Object.values(byProduct)
      .map((p) => ({ ...p, average: Math.round((p.sum / p.count) * 10) / 10 }))
      .sort((a, b) => b.count - a.count);
    return json({
      reviews,
      stats: {
        count,
        average: Math.round(avg * 10) / 10,
        fiveStar: reviews.filter((r) => r.rating === 5).length,
        products: products.length
      },
      dist,
      products
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
