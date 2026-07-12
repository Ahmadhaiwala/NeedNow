import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import AddToCartButtons from "./AddToCartButtons";
import ProductInteractionTracker from "./ProductInteractionTracker";
import WishlistButton from "./WishlistButton";

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
  return num.toFixed(2);
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
    <div
  className="min-h-screen px-6 py-10"
  style={{ background: "var(--bg-page)" }}
>
      {/* Invisible client component — tracks view/click events */}
      <ProductInteractionTracker productId={product.id} productName={product.name} />

      <div className="max-w-7xl mx-auto">

        <div className="grid lg:grid-cols-12 gap-8">

          {/* ================= IMAGE ================= */}
          <div className="lg:col-span-4">

            <div
              className="p-8 sticky top-24"
              style={{
                borderRadius: "var(--radius-lg)",
                background:
                  "linear-gradient(135deg, rgba(123,163,206,0.15), rgba(233,186,195,0.18))",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {isValidUrl(product.image_url) ? (
                <Image
                  src={product.image_url}
                  alt={product.name || "Product Image"}
                  width={600}
                  height={600}
                  className="w-full h-[450px] object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-[450px] flex items-center justify-center rounded-xl" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>No Image</span>
                </div>
              )}
            </div>

          </div>

          {/* ================= PRODUCT INFO ================= */}
          <div className="lg:col-span-5 space-y-6">

            {/* Brand */}
            <div className="flex gap-3 flex-wrap">
              <span
                className="px-4 py-2"
                style={{
                  background: "rgba(2,90,92,0.12)",
                  color: "var(--color-jade)",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                {product.brand || "Generic"}
              </span>

              <span
                className="px-4 py-2"
                style={{
                  background: "rgba(123,163,206,0.12)",
                  color: "var(--color-sky)",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                {product.category?.name || "Category"}
              </span>
            </div>

            {/* Product Name */}
            <h1
              className="text-5xl font-bold leading-tight"
              style={{
                color: "var(--text-primary)",
              }}
            >
              {product.name}
            </h1>

            {/* Description */}
            <div
              className="p-6"
              style={{
                borderRadius: "var(--radius-lg)",
                background: "rgba(233,186,195,0.14)",
              }}
            >
              <h2
                className="mb-4 font-bold"
                style={{
                  color: "var(--color-jade)",
                  fontSize: "22px",
                }}
              >
                Description
              </h2>

              <p
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: "1.9",
                  fontSize: "16px",
                }}
              >
                {product.description ||
                  "No description available for this product."}
              </p>
            </div>

            {/* Attributes */}
            <div>
              <h2
                className="mb-5 font-bold text-2xl"
                style={{
                  color: "var(--text-primary)",
                }}
              >
                Product Details
              </h2>

              <div className="grid grid-cols-2 gap-4">

                {[
                  ["Unit", product.unit],
                  ["Size", product.unit_size],
                  ["Barcode", product.barcode || "N/A"],
                  ["Slug", product.slug],
                ].map(([title, value]) => (
                  <div
                    key={title}
                    className="p-5"
                    style={{
                      borderRadius: "var(--radius-md)",
                      background: "rgba(123,163,206,0.08)",
                    }}
                  >
                    <p
                      style={{
                        color: "var(--color-jade)",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        fontWeight: 700,
                      }}
                    >
                      {title}
                    </p>

                    <p
                      className="mt-2 font-medium"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "16px",
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= BUY BOX ================= */}
          <div className="lg:col-span-3">

            <div
              className="sticky top-24 p-6"
              style={{
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-surface)",
                boxShadow: "var(--shadow-card)",
              }}
            >

              <p
                style={{
                  color: "var(--color-jade)",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                PRICE
              </p>

              <h2
                className="font-bold mt-2"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "46px",
                }}
              >
                {product.price != null ? `₹${formatPrice(product.price)}` : 'Price N/A'}
              </h2>

              <div
                className="mt-4 px-4 py-3"
                style={{
                  borderRadius: "var(--radius-md)",
                  background: "rgba(2,90,92,0.1)",
                  color: "var(--color-jade)",
                  fontWeight: 600,
                }}
              >
                In Stock
              </div>

              <div className="mt-6 space-y-3">
                <AddToCartButtons productId={product.id} price={product.price} />
                <WishlistButton product={product} />
              </div>

              <div className="mt-8 space-y-4">

                <div className="flex gap-3 items-center">
                  <Truck
                    size={18}
                    color="var(--color-sky)"
                  />
                  <span style={{ color: "var(--text-secondary)" }}>
                    Fast Delivery
                  </span>
                </div>

                <div className="flex gap-3 items-center">
                  <RotateCcw
                    size={18}
                    color="var(--color-sky)"
                  />
                  <span style={{ color: "var(--text-secondary)" }}>
                    Easy Returns
                  </span>
                </div>

                <div className="flex gap-3 items-center">
                  <ShieldCheck
                    size={18}
                    color="var(--color-sky)"
                  />
                  <span style={{ color: "var(--text-secondary)" }}>
                    Secure Payments
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================= FUTURE RECOMMENDATIONS ================= */}

        <div className="mt-24">
          <h2
            className="text-3xl font-bold mb-6"
            style={{
              color: "var(--text-primary)",
            }}
          >
            Recommended Products
          </h2>

          <div
            className="h-60 flex items-center justify-center"
            style={{
              borderRadius: "var(--radius-lg)",
              background: "rgba(123,163,206,0.08)",
            }}
          >
            Coming Soon
          </div>
        </div>

        {/* ================= FUTURE REVIEWS ================= */}

        <div className="mt-20">
          <h2
            className="text-3xl font-bold mb-6"
            style={{
              color: "var(--text-primary)",
            }}
          >
            Customer Reviews
          </h2>

          <div
            className="h-60 flex items-center justify-center"
            style={{
              borderRadius: "var(--radius-lg)",
              background: "rgba(233,186,195,0.1)",
            }}
          >
            Reviews Coming Soon
          </div>
        </div>

      </div>
    </div>
  );
}