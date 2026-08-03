import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import AddToCartButtons from "./AddToCartButtons";
import ProductInteractionTracker from "./ProductInteractionTracker";
import WishlistButton from "./WishlistButton";
import RecommendedProducts from "./RecommendedProducts";
import ProductReviews from "./ProductReviews";
import Navbar from "../../navbar/Navbar";
import TrustFooter from "@/components/TrustFooter";

function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatPrice(price: number | string | null | undefined): string {
  const num = parseFloat(String(price ?? ''));
  if (isNaN(num)) return 'N/A';
  return num.toFixed(0);
}

async function getProduct(id: string) {
  const response = await fetch(
    `http://localhost:8000/api/catalog/product/${id}/`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }

  return response.json();
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg-page)" }}>
      <Navbar />
      <ProductInteractionTracker productId={product.id} productName={product.name} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* IMAGE */}
          <div className="lg:col-span-5">
            <div
              className="p-8 sticky top-24 rounded-3xl shadow-card flex items-center justify-center"
              style={{
                background: "rgba(240, 232, 216, 0.4)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {isValidUrl(product.image_url) ? (
                <Image
                  src={product.image_url}
                  alt={product.name || "Product Image"}
                  width={500}
                  height={500}
                  className="w-full h-[400px] object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-[400px] flex items-center justify-center rounded-xl" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>No Image Available</span>
                </div>
              )}
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex gap-2 flex-wrap">
              <span
                className="px-3 py-1 text-xs font-bold uppercase rounded-full"
                style={{
                  background: "rgba(154, 101, 60, 0.12)",
                  color: "var(--accent-primary)",
                }}
              >
                {product.brand || "Brand"}
              </span>

              <span
                className="px-3 py-1 text-xs font-bold uppercase rounded-full"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {product.category?.name || "Category"}
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl font-serif font-bold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {product.name}
            </h1>

            <div
              className="p-6 rounded-2xl border shadow-sm"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <h2
                className="mb-2 font-serif font-bold text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                Description
              </h2>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {product.description || "No description available for this product."}
              </p>
            </div>

            <div>
              <h2
                className="mb-4 font-serif font-bold text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                Product Details
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Unit", product.unit],
                  ["Size", product.unit_size],
                  ["Barcode", product.barcode || "N/A"],
                  ["Slug", product.slug],
                ].map(([title, value]) => (
                  <div
                    key={title}
                    className="p-3.5 rounded-xl border"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {title}
                    </p>
                    <p
                      className="mt-1 font-semibold text-xs truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BUY BOX */}
          <div className="lg:col-span-3">
            <div
              className="sticky top-24 p-6 rounded-3xl shadow-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Price
              </p>

              <h2
                className="font-bold mt-1 text-3xl sm:text-4xl"
                style={{ color: "var(--text-primary)" }}
              >
                {product.price != null ? `₹${formatPrice(product.price)}` : 'N/A'}
              </h2>

              <div
                className="mt-3 px-3 py-1.5 rounded-full text-xs font-bold inline-block"
                style={{
                  background: "rgba(78, 112, 85, 0.12)",
                  color: "var(--color-jade)",
                }}
              >
                In Stock & Ready for Delivery
              </div>

              <div className="mt-6 space-y-3">
                <AddToCartButtons productId={product.id} price={product.price} />
                <WishlistButton product={product} />
              </div>

              <div className="mt-6 space-y-3 pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex gap-2.5 items-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  <Truck size={16} style={{ color: "var(--accent-primary)" }} />
                  <span>30-min express delivery</span>
                </div>
                <div className="flex gap-2.5 items-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  <RotateCcw size={16} style={{ color: "var(--accent-primary)" }} />
                  <span>7-day easy returns</span>
                </div>
                <div className="flex gap-2.5 items-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  <ShieldCheck size={16} style={{ color: "var(--accent-primary)" }} />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RecommendedProducts productId={product.id} categoryId={product.category?.id} />
        <ProductReviews productName={product.name} />
      </main>

      <TrustFooter />
    </div>
  );
}