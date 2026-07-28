"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ArrowRight, Loader2, ShoppingCart, Heart, ArrowLeftRight } from "lucide-react";

import { useWishlist } from "@/context/WishlistContext";
import { useInteractionTracker } from "@/hooks/useInteractionTracker";
import { useCart } from "@/context/CartContext";
import { useFlyToCart } from "@/context/FlyToCartContext";

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

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const price = parseFloat(product.price);
  const discount = parseFloat(product.discount_percentage);
  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;

  const { isWishlisted, toggle } = useWishlist();
  const { track } = useInteractionTracker();
  const { addItem } = useCart();
  const { triggerFlyAnimation } = useFlyToCart();

  const wishlisted = isWishlisted(product.id);

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
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

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerFlyAnimation(e, product.image_url);
      addItem(product.id, 1).catch(console.error);
    },
    [addItem, triggerFlyAnimation, product]
  );

  const handleCardClick = useCallback(() => {
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
        className="group relative flex flex-col min-w-[200px] max-w-[230px] snap-start cursor-pointer transition-all duration-300"
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border-subtle)",
          overflow: "hidden",
        }}
        whileHover={{
          y: -4,
          boxShadow: "var(--shadow-hover)",
        }}
      >
        {/* Discount badge */}
        {discount > 0 && (
          <div
            className="absolute top-3 left-3 z-10 font-bold px-2.5 py-0.5 text-[10px] rounded-full uppercase tracking-wider shadow-sm"
            style={{
              background: "var(--color-heat)",
              color: "#FFFDF8",
            }}
          >
            {discount}% OFF
          </div>
        )}

        {/* Wishlist heart button with scale 1 -> 1.25 -> 1 animation */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          animate={{ scale: wishlisted ? [1, 1.25, 1] : 1 }}
          transition={{ duration: 0.25 }}
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 flex items-center justify-center transition-colors"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: wishlisted
              ? "rgba(185, 74, 62, 0.15)"
              : "var(--surface-3)",
            backdropFilter: "blur(6px)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: wishlisted ? "var(--color-heat)" : "var(--text-secondary)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={14}
            style={{
              fill: wishlisted ? "currentColor" : "none",
              transition: "fill 0.2s",
            }}
          />
        </motion.button>

        {/* Product image area with subtle hover scale (1 -> 1.03) */}
        <div
          className="h-40 flex items-center justify-center p-4 overflow-hidden relative"
          style={{ background: "var(--surface-1)" }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <Package
              className="w-10 h-10 transition-transform duration-300 ease-out group-hover:scale-105"
              style={{ color: "var(--text-secondary)", opacity: 0.3 }}
            />
          )}
        </div>

        {/* Product info */}
        <div className="p-4 flex flex-col flex-1">
          <span
            className="uppercase tracking-wider font-bold text-[10px]"
            style={{ color: "var(--accent-primary)" }}
          >
            {product.brand}
          </span>
          <h4
            className="mt-1 font-semibold leading-tight line-clamp-2"
            style={{ fontSize: "13px", color: "var(--text-primary)", minHeight: "36px" }}
          >
            {product.name}
          </h4>
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {product.unit_size} {product.unit}
          </p>

          {/* Price */}
          <div className="mt-auto pt-3 flex items-baseline gap-2">
            <span
              className="font-bold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              ₹{discountedPrice.toFixed(0)}
            </span>
            {discount > 0 && (
              <span
                className="line-through text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                ₹{price.toFixed(0)}
              </span>
            )}
          </div>

          {/* Action Row: Add to Cart button */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm"
              style={{
                fontSize: "12px",
                padding: "8px 12px",
                background: "var(--accent-primary)",
                color: "#FFFDF8",
                borderRadius: "var(--radius-full)",
                border: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              <ShoppingCart size={13} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CategorySection({
  category,
}: {
  category: Category;
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
      {/* Category header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="font-serif font-bold text-xl sm:text-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            {category.name}
          </h2>
          <p
            className="mt-0.5 text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {category.product_count} product
            {category.product_count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* View All pill */}
        <Link href={`/products?category=${category.slug || category.id}`}>
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
        </Link>
      </div>

      {/* Products scroll row */}
      <div className="relative">
        {loading && !loaded && (
          <div className="flex items-center gap-3 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Loading products...
            </span>
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-xs font-medium" style={{ color: "var(--color-heat)" }}>
            Could not load products.
          </div>
        )}

        {loaded && products.length === 0 && (
          <div className="py-10 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
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
