import FeedSection, { FeedSectionProps } from "@/components/FeedSection";
import HeroSection from "@/components/HeroSection";
import BentoBanners from "@/components/BentoBanners";
import TrustFooter from "@/components/TrustFooter";

interface FeedSectionData extends FeedSectionProps {}

interface HomeFeedResponse {
  sections: FeedSectionData[];
  meta: {
    total_categories: number;
    total_products: number;
  };
}

export default async function Home() {
  let sections: FeedSectionData[] = [];
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
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg-page)" }}>
      <main
        className="app-container w-full"
        style={{ padding: "24px", paddingTop: "16px" }}
      >
        {/* ── Editorial Hero Section ── */}
        <HeroSection totalCategories={totalCategories} totalProducts={totalProducts} />

        {/* ── Promotional Bento Banners ── */}
        <BentoBanners />

        {/* ── Feed Sections ── */}
        {sections.length === 0 && (
          <div
            className="text-center my-8"
            style={{
              padding: "60px 24px",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p
              className="font-serif font-bold text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              Could not load feed
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Make sure the Django backend is running at http://localhost:8000
            </p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <FeedSection
              key={section.id}
              id={section.id}
              type={section.type}
              title={section.title}
              endpoint={section.endpoint}
              requires_auth={section.requires_auth}
            />
          ))}
        </div>
      </main>

      {/* ── Bottom Trust Footer ── */}
      <TrustFooter />
    </div>
  );
}