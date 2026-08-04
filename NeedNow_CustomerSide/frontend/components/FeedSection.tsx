"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth";
import { Product, ProductCard } from "@/components/CategorySection";

const API_BASE = "http://localhost:8000";

function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 min-w-[200px] max-w-[230px] p-4 flex flex-col gap-3"
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="h-36 rounded-lg animate-pulse"
        style={{ background: "rgba(240, 232, 216, 0.5)" }}
      />
      <div
        className="animate-pulse rounded h-3 w-1/2"
        style={{ background: "rgba(154, 101, 60, 0.2)" }}
      />
      <div
        className="animate-pulse rounded h-4 w-4/5"
        style={{ background: "rgba(116, 103, 93, 0.2)" }}
      />
      <div
        className="animate-pulse rounded h-8 w-full mt-2"
        style={{ background: "rgba(154, 101, 60, 0.2)" }}
      />
    </div>
  );
}

export interface FeedSectionProps {
  id: string;
  type: "recommendation" | "category";
  title: string;
  endpoint: string;
  requires_auth: boolean;
}

export default function FeedSection({
  type,
  title,
  endpoint,
  requires_auth,
}: FeedSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionData, isPending } = (authClient as any).useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token: string | null = (sessionData as any)?.session?.token ?? null;
  const lastFetchedTokenRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (requires_auth && isPending) return;
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
              items = Array.isArray(data) ? data : (data.results ?? []);
            }
            setProducts(items);
            setLoaded(true);
            setLoading(false);
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Failed to load");
            fetchedRef.current = false;
            setLoading(false);
          });
      },
      { rootMargin: "200px", threshold: 0 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [endpoint, loaded, requires_auth, type, token, isPending]);

  return (
    <section
      ref={sectionRef}
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border-subtle)",
        padding: "24px",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="font-serif font-bold text-xl sm:text-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          <p
            className="mt-0.5 text-xs font-medium"
            style={{ color: "var(--text-secondary)", minHeight: "16px" }}
          >
            {loaded
              ? `${products.length} product${products.length !== 1 ? "s" : ""}`
              : ""}
          </p>
        </div>

        <button
          className="hidden sm:flex items-center gap-1.5 font-bold text-xs cursor-pointer px-4 py-2 rounded-full transition-all"
          style={{
            background: "rgba(154, 101, 60, 0.12)",
            color: "var(--accent-primary)",
            border: "none",
          }}
        >
          View All
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="relative">
        {error && (
          <div className="py-10 text-center text-xs font-medium" style={{ color: "var(--color-heat)" }}>
            Could not load products.
          </div>
        )}

        {loaded && products.length === 0 && !error && (
          <div className="py-10 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
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
