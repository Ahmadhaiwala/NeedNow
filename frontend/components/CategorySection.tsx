"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ArrowRight, Loader2, ShoppingCart, Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useInteractionTracker } from "@/hooks/useInteractionTracker";

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  discount_percentage: string;
  unit: string;
  unit_size: string;
  image_url: string;
  description: string;
  category_name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  product_count: number;
  parent: string | null;
}

const API_BASE = "http://localhost:8000/api/catalog";

/* ── Variant config ── */
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

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const price = parseFloat(product.price);
  const discount = parseFloat(product.discount_percentage);
  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;

  const { isWishlisted, toggle } = useWishlist();
  const { track } = useInteractionTracker();
  const wishlisted = isWishlisted(product.id);

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Don't navigate to product page
      e.stopPropagation();
      toggle({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        brand: product.brand,
      });
    },
    [toggle, product]
  );

  const handleCardClick = useCallback(() => {
    // Track click interaction — will be batched in next 30s flush
    track({
      interaction_type: "click",
      product_id: product.id,
      value: 2.0,
      metadata: { source: "category_section", product_name: product.name },
    });
  }, [track, product]);

  return (
    <Link href={`/product/${product.id}`} onClick={handleCardClick}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
        className="group relative flex flex-col min-w-[190px] max-w-[220px] snap-start"
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
          transition: "box-shadow 0.3s ease-out, transform 0.3s ease-out",
        }}
        whileHover={{
          boxShadow: "0 8px 24px rgba(31, 54, 53, 0.14)",
          y: -2,
        }}
      >
        {/* Discount badge */}
        {discount > 0 && (
          <div
            className="absolute top-3 left-3 z-10 font-semibold px-3 py-1"
            style={{
              fontSize: "11px",
              background: "var(--color-heat)",
              color: "var(--color-cloud)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {discount}% OFF
          </div>
        )}

        {/* Wishlist heart button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 flex items-center justify-center"
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: wishlisted
              ? "rgba(233,186,195,0.9)"
              : "rgba(255,255,255,0.75)",
            backdropFilter: "blur(6px)",
            border: "none",
            cursor: "pointer",
            color: wishlisted ? "#1F3635" : "#025A5C",
            transition: "background 0.2s, color 0.2s",
            boxShadow: "0 2px 8px rgba(31,54,53,0.1)",
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={13}
            style={{
              fill: wishlisted ? "currentColor" : "none",
              transition: "fill 0.2s",
            }}
          />
        </motion.button>

        {/* Product image area */}
        <div
          className="h-32 flex items-center justify-center p-5"
          style={{ background: "var(--color-pink)" }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <Package
              className="w-10 h-10"
              style={{ color: "var(--color-core)", opacity: 0.3 }}
            />
          )}
        </div>

        {/* Product info */}
        <div className="p-4 flex flex-col flex-1">
          <span
            className="uppercase tracking-wider font-semibold"
            style={{ fontSize: "11px", color: "var(--color-jade)" }}
          >
            {product.brand}
          </span>
          <h4
            className="mt-1 font-semibold leading-tight line-clamp-2"
            style={{ fontSize: "14px", color: "var(--text-primary)" }}
          >
            {product.name}
          </h4>
          <p
            className="mt-1"
            style={{ fontSize: "12px", color: "var(--text-secondary)" }}
          >
            {product.unit_size} {product.unit}
          </p>

          {/* Price */}
          <div className="mt-auto pt-3 flex items-baseline gap-2">
            <span
              className="font-bold"
              style={{ fontSize: "18px", color: "var(--text-primary)" }}
            >
              ₹{discountedPrice.toFixed(0)}
            </span>
            {discount > 0 && (
              <span
                className="line-through"
                style={{ fontSize: "13px", color: "var(--color-heat)" }}
              >
                ₹{price.toFixed(0)}
              </span>
            )}
          </div>

          {/* Add button */}
          <button
            className="mt-3 w-full flex items-center justify-center gap-2 font-semibold cursor-pointer"
            style={{
              fontSize: "13px",
              padding: "10px 16px",
              background: "var(--accent-primary)",
              color: "var(--color-core)",
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
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CategorySection({
  category,
  variant = "surface",
}: {
  category: Category;
  variant?: "surface" | "jade" | "core";
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const loadingRef = useRef(false);

  useEffect(() => {
    if (loaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loaded && !loadingRef.current) {
          loadingRef.current = true;
          setLoading(true);
          fetch(`${API_BASE}/products/${category.id}/`)
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then((data) => {
              // Paginated DRF response: { count, results: [...] } or plain array
              const items = Array.isArray(data) ? data : (data.results ?? []);
              setProducts(items);
              setLoaded(true);
              setLoading(false);
            })
            .catch((err) => {
              setError(err.message);
              setLoading(false);
            });
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [category.id, loaded]);

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
      {/* Category header */}
      <div className="flex items-center justify-between mb-5 cursor-pointer">
        <div>
          <h2
            className="font-bold"
            style={{ fontSize: "22px", lineHeight: 1.3, color: v.heading }}
          >
            {category.name}
          </h2>
          <p
            className="mt-1 font-medium"
            style={{ fontSize: "13px", color: v.sub }}
          >
            {category.product_count} product
            {category.product_count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* View All pill */}
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

      {/* Products scroll row */}
      <div className="relative">
        {loading && !loaded && (
          <div className="flex items-center gap-3 py-12 justify-center">
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: v.heading }}
            />
            <span
              className="font-medium"
              style={{ fontSize: "14px", color: v.sub }}
            >
              Loading products...
            </span>
          </div>
        )}

        {error && (
          <div
            className="py-10 text-center font-medium"
            style={{ fontSize: "14px", color: "var(--color-heat)" }}
          >
            Could not load products.
          </div>
        )}

        {loaded && products.length === 0 && (
          <div
            className="py-10 text-center font-medium"
            style={{ fontSize: "14px", color: v.sub }}
          >
            No products in this category yet.
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
      </div>
    </section>
  );
}
