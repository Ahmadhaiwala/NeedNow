import CategorySection from "@/components/CategorySection";
import { Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  product_count: number;
  parent: string | null;
}

export default async function Home() {
  let categories: Category[] = [];

  try {
    const res = await fetch("http://localhost:8000/api/catalog/categories/", {
      cache: "no-store",
    });
    if (res.ok) {
      categories = await res.json();
    }
  } catch {
    // Backend might not be running
  }

  const totalProducts = categories.reduce(
    (sum, c) => sum + c.product_count,
    0
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <main
        className="max-w-7xl mx-auto"
        style={{ padding: "24px", paddingTop: "32px" }}
      >
        {/* ── Hero Bento Grid ── */}
        <div
          className="grid gap-4 mb-8"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto auto",
          }}
        >
          {/* Large hero card — spans full width */}
          <div
            className="relative overflow-hidden col-span-2"
            style={{
              background: "var(--color-core)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
              padding: "40px",
              minHeight: "280px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            {/* Decorative circles — Juice and Jade visible against Core */}
            <div
              className="absolute -top-16 -right-16"
              style={{
                width: "280px",
                height: "280px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-juice)",
                opacity: 0.12,
              }}
            />
            <div
              className="absolute bottom-0 right-20"
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-jade)",
                opacity: 0.25,
              }}
            />
            <div
              className="absolute top-8 right-40"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-pink)",
                opacity: 0.15,
              }}
            />

            <p
              className="font-semibold mb-2 relative z-10 uppercase tracking-widest"
              style={{
                fontSize: "12px",
                color: "var(--color-juice)",
              }}
            >
              Welcome to NeedNow
            </p>
            <h1
              className="font-bold relative z-10"
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                lineHeight: 1.1,
                color: "var(--color-cloud)",
                maxWidth: "550px",
              }}
            >
              Everything you need,
              <br />
              delivered now.
            </h1>
            <p
              className="mt-3 relative z-10"
              style={{
                fontSize: "16px",
                lineHeight: 1.5,
                color: "var(--color-cloud)",
                opacity: 0.6,
                maxWidth: "460px",
              }}
            >
              Browse {categories.length} categories and {totalProducts}+
              products. Scroll down to explore.
            </p>

            {/* Pill search bar — translucent on dark surface */}
            <div
              className="mt-6 relative z-10"
              style={{ maxWidth: "400px" }}
            >
              <div
                className="flex items-center gap-3"
                style={{
                  background: "rgba(252, 251, 244, 0.1)",
                  borderRadius: "var(--radius-full)",
                  padding: "12px 20px",
                  border: "1px solid rgba(252, 251, 244, 0.15)",
                }}
              >
                <Search
                  size={18}
                  style={{ color: "var(--color-juice)" }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--color-cloud)",
                    opacity: 0.45,
                  }}
                >
                  Search for products...
                </span>
              </div>
            </div>
          </div>

          {/* Stats row — 4 distinct cards with different colors */}
          {[
            {
              label: "Categories",
              value: categories.length.toString(),
              bg: "var(--bg-surface)",
              textColor: "var(--text-primary)",
              subColor: "var(--text-secondary)",
            },
            {
              label: "Products",
              value: `${totalProducts}+`,
              bg: "var(--color-jade)",
              textColor: "var(--color-cloud)",
              subColor: "rgba(252,251,244,0.7)",
            },
            {
              label: "Delivery",
              value: "30 min",
              bg: "var(--color-core)",
              textColor: "var(--color-juice)",
              subColor: "rgba(252,251,244,0.6)",
            },
            {
              label: "Brands",
              value: "50+",
              bg: "var(--color-sky)",
              textColor: "var(--color-core)",
              subColor: "rgba(31,54,53,0.6)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="col-span-2 sm:col-span-1"
              style={{
                background: stat.bg,
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-card)",
                padding: "20px 24px",
              }}
            >
              <p
                className="font-bold"
                style={{
                  fontSize: "28px",
                  color: stat.textColor,
                  lineHeight: 1.2,
                }}
              >
                {stat.value}
              </p>
              <p
                className="mt-1 font-medium"
                style={{
                  fontSize: "13px",
                  color: stat.subColor,
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Category Sections ── */}
        {categories.length === 0 && (
          <div
            className="text-center"
            style={{
              padding: "80px 24px",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <p
              className="font-semibold"
              style={{ fontSize: "18px", color: "var(--text-primary)" }}
            >
              Could not load categories
            </p>
            <p
              className="mt-2"
              style={{ fontSize: "14px", color: "var(--text-secondary)" }}
            >
              Make sure the backend is running at localhost:8000
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {categories.map((category, i) => (
            <CategorySection
              key={category.id}
              category={category}
              variant={i % 2 === 0 ? "jade" : "core"}
            />
          ))}
        </div>
      </main>
    </div>
  );
}