import FeedSection, { FeedSectionProps } from "@/components/FeedSection";
import { Search } from "lucide-react";

interface FeedSection extends FeedSectionProps {}

interface HomeFeedResponse {
  sections: FeedSection[];
  meta: {
    total_categories: number;
    total_products: number;
  };
}

export default async function Home() {
  let sections: FeedSection[] = [];
  let totalCategories = 0;
  let totalProducts = 0;

  try {
    const res = await fetch("http://localhost:8000/api/catalog/home/", {
      cache: "no-store",
    });
    if (res.ok) {
      const data: HomeFeedResponse = await res.json();
      sections = data.sections ?? [];
      totalCategories = data.meta?.total_categories ?? 0;
      totalProducts = data.meta?.total_products ?? 0;
    }
  } catch {
    // Backend might not be running
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <main
        className="max-w-7xl mx-auto"
        style={{ padding: "24px", paddingTop: "32px" }}
      >
        {/* ── Hero Banner ── */}
        <div className="mb-8">
          {/* Large hero card */}
          <div
            className="relative overflow-hidden"
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
            {/* Decorative circles */}
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
              style={{ fontSize: "12px", color: "var(--color-juice)" }}
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
              Browse {totalCategories} categories and {totalProducts}+ products.
              Scroll down to explore.
            </p>

            {/* Pill search bar */}
            <div className="mt-6 relative z-10" style={{ maxWidth: "400px" }}>
              <div
                className="flex items-center gap-3"
                style={{
                  background: "rgba(252, 251, 244, 0.1)",
                  borderRadius: "var(--radius-full)",
                  padding: "12px 20px",
                  border: "1px solid rgba(252, 251, 244, 0.15)",
                }}
              >
                <Search size={18} style={{ color: "var(--color-juice)" }} />
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
        </div>

        {/* ── Feed Sections ── */}
        {sections.length === 0 && (
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
              Could not load feed
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
          {sections.map((section, i) => (
            <FeedSection
              key={section.id}
              id={section.id}
              type={section.type}
              title={section.title}
              endpoint={section.endpoint}
              requires_auth={section.requires_auth}
              variant={i % 2 === 0 ? "jade" : "core"}
            />
          ))}
        </div>
      </main>
    </div>
  );
}