"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth";
import { Product, ProductCard } from "@/components/CategorySection";

const API_BASE = "http://localhost:8000";

const VARIANTS = {
  surface: {
    bg: "var(--bg-surface)",
    heading: "var(--color-core)",
    sub: "var(--text-secondary)",
    btnBg: "var(--accent-primary)",
    btnText: "var(--color-core)",
    arrowBg: "rgba(31,54,53,0.12)",
  },
  jade: {
    bg: "var(--color-jade)",
    heading: "var(--color-cloud)",
    sub: "rgba(252,251,244,0.6)",
    btnBg: "var(--accent-primary)",
    btnText: "var(--color-core)",
    arrowBg: "rgba(252,251,244,0.2)",
  },
  core: {
    bg: "var(--color-core)",
    heading: "var(--color-cloud)",
    sub: "rgba(252,251,244,0.5)",
    btnBg: "var(--accent-primary)",
    btnText: "var(--color-core)",
    arrowBg: "rgba(252,251,244,0.15)",
  },
} as const;

function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 min-w-[190px] max-w-[220px]"
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-surface)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        opacity: 0.5,
      }}
    >
      <div
        className="h-32 animate-pulse"
        style={{ background: "var(--color-pink)", opacity: 0.4 }}
      />
      <div className="p-4 flex flex-col gap-2">
        <div
          className="animate-pulse rounded"
          style={{
            height: "10px",
            width: "50%",
            background: "var(--color-jade)",
            opacity: 0.3,
          }}
        />
        <div
          className="animate-pulse rounded"
          style={{
            height: "14px",
            width: "80%",
            background: "var(--text-secondary)",
            opacity: 0.2,
          }}
        />
        <div
          className="animate-pulse rounded"
          style={{
            height: "10px",
            width: "35%",
            background: "var(--text-secondary)",
            opacity: 0.15,
          }}
        />
        <div
          className="animate-pulse rounded mt-3"
          style={{
            height: "36px",
            width: "100%",
            background: "var(--accent-primary)",
            opacity: 0.2,
          }}
        />
      </div>
    </div>
  );
}

export interface FeedSectionProps {
  id: string;
  type: "recommendation" | "category";
  title: string;
  endpoint: string;
  requires_auth: boolean;
  variant?: "surface" | "jade" | "core";
}

export default function FeedSection({
  type,
  title,
  endpoint,
  requires_auth,
  variant = "surface",
}: FeedSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Prevents double-fetch inside the IntersectionObserver callback.
  // A ref is used so it never triggers re-renders.
  const fetchedRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionData, isPending } = (authClient as any).useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token: string | null = (sessionData as any)?.session?.token ?? null;
  const lastFetchedTokenRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // If section requires auth or session is still resolving, wait for session check
    if (requires_auth && isPending) return;

    // Don't refetch if already loaded for the current token state
    if (loaded && lastFetchedTokenRef.current === token) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (fetchedRef.current && lastFetchedTokenRef.current === token) return;

        fetchedRef.current = true;
        lastFetchedTokenRef.current = token;
        setLoading(true);

        let url = `${API_BASE}${endpoint}`;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          url += (url.includes("?") ? "&" : "?") + "personal=true";
        }

        // Plain .then/.catch -- no async/await so the callback never hangs.
        fetch(url, { headers })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then((data) => {
            let items: Product[];
            if (type === "recommendation") {
              items = (data.recommendations ?? []).map(
                (r: { product: Product }) => r.product
              );
            } else {
              // Paginated DRF: { count, results: [...] } or plain array
              items = Array.isArray(data) ? data : (data.results ?? []);
            }
            setProducts(items);
            setLoaded(true);
            setLoading(false);
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Failed to load");
            fetchedRef.current = false; // allow retry on next intersection
            setLoading(false);
          });
      },
      { rootMargin: "200px", threshold: 0 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [endpoint, loaded, requires_auth, type, token, isPending]);

  const v = VARIANTS[variant];

  return (
    <section
      ref={sectionRef}
      style={{
        background: v.bg,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "24px",
        transition: "box-shadow 0.3s ease-out",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="font-bold"
            style={{ fontSize: "22px", lineHeight: 1.3, color: v.heading }}
          >
            {title}
          </h2>
          <p
            className="mt-1 font-medium"
            style={{ fontSize: "13px", color: v.sub, minHeight: "18px" }}
          >
            {loaded
              ? `${products.length} product${products.length !== 1 ? "s" : ""}`
              : ""}
          </p>
        </div>

        <button
          className="hidden sm:flex items-center gap-2 font-semibold cursor-pointer"
          style={{
            fontSize: "13px",
            padding: "10px 20px",
            background: v.btnBg,
            color: v.btnText,
            borderRadius: "var(--radius-full)",
            boxShadow: "var(--shadow-button)",
            border: "none",
            transition: "opacity 0.2s ease-out",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
        >
          View All
          <span
            className="flex items-center justify-center"
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "var(--radius-full)",
              background: v.arrowBg,
            }}
          >
            <ArrowRight size={12} />
          </span>
        </button>

        <ArrowRight size={20} className="sm:hidden" style={{ color: v.sub }} />
      </div>

      <div className="relative">
        {error && (
          <div
            className="py-10 text-center font-medium"
            style={{ fontSize: "14px", color: "var(--color-heat)" }}
          >
            Could not load products.
          </div>
        )}

        {loaded && products.length === 0 && !error && (
          <div
            className="py-10 text-center font-medium"
            style={{ fontSize: "14px", color: v.sub }}
          >
            No products available.
          </div>
        )}

        {loaded && products.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
            <AnimatePresence>
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loaded && !error && (
          <div className="flex gap-4 overflow-x-hidden pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
