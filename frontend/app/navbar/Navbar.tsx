"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useFlyToCart } from "@/context/FlyToCartContext";
import {
  Mic,
  Sparkles,
  Bell,
  ShoppingCart,
  Heart,
  Menu,
  X,
  LogIn,
  User,
  LogOut,
  Compass,
  Package,
  Clock,
  Settings,
  Search,
  Store,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { name: "Discover", icon: Compass, href: "/" },
  { name: "Marketplace", icon: Store, href: "/marketplace" },
  { name: "AI Agent", icon: Sparkles, href: "/chat" },
  { name: "Orders", icon: ShoppingCart, href: "/orders" },
  { name: "History", icon: Clock, href: "/history" },
];

const placeholders = [
  "Search products, brands, groceries...",
  "Build me a coding PC under ₹80,000...",
  "Fresh organic fruits & vegetables...",
  "Noise cancelling wireless headphones...",
  "Living room decor & home essentials...",
];

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  price: string | null;
  image_url: string;
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut, signInWithGoogle } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { state: cartState } = useCart();
  const { cartPulse } = useFlyToCart();
  const [isDark, setIsDark] = useState(false);

useEffect(() => {
  const root = document.documentElement;

  // Set initial value
  setIsDark(root.classList.contains("dark"));

  // Watch for ThemeToggle changing <html class="dark">
  const observer = new MutationObserver(() => {
    setIsDark(root.classList.contains("dark"));
  });

  observer.observe(root, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}, []);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Rotating search placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    try {
      let authHeader = "";
      try {
        const { authClient } = await import("@/lib/auth");
        const sessionData = await authClient.getSession();
        const token = sessionData?.data?.session?.token;
        if (token) authHeader = `Bearer ${token}`;
      } catch {}

      const res = await fetch(
        `http://localhost:8000/api/catalog/search/?q=${encodeURIComponent(q)}&limit=8`,
        {
          headers: authHeader ? { Authorization: authHeader } : {},
        }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.results ?? []);
      setSearchOpen(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserDropdown(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pb-3">
      <div
        className={`w-full max-w-7xl flex items-center justify-between gap-4 px-5 py-3 transition-theme navbar-glass ${scrolled ? 'scrolled' : ''}`}
        style={{
          borderRadius: "var(--radius-lg)",
          minHeight: "66px",
        }}
      >
        {/* ── Brand Logo ── */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div
            className="flex items-center justify-center transition-transform duration-300 group-hover:scale-105 w-9 h-9 rounded-xl bg-accent text-accent-foreground font-bold text-lg shadow-button"
          >
            N
          </div>
          <div className="flex flex-col">
            <span
              className="text-xl font-serif font-bold tracking-tight leading-none text-foreground"
            >
              NeedNow
            </span>
            <span
              className="hidden lg:block text-[11px] font-medium tracking-wide mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Express Commerce & AI
            </span>
          </div>
        </Link>

        {/* ── Navigation Links (Center-Left) ── */}
        <nav className="hidden md:flex items-center gap-1.5 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs lg:text-sm font-bold transition-all"
                  style={{
                    color: isActive
                      ? (isDark ? "#FFFDF8" : "#FFFDF8")
                      : "var(--text-secondary)",
                    background: isActive
                      ? (isDark ? "#B77A48" : "#9A653C")
                      : "transparent",
                    boxShadow: isActive ? "var(--shadow-button)" : "none",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--text-primary)";
                      e.currentTarget.style.background = isDark
                        ? "rgba(217, 186, 131, 0.08)"
                        : "rgba(154, 101, 60, 0.08)";
                    }
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* ── Center: Search Input Bar ── */}
        <div
          ref={searchRef}
          className="hidden sm:flex flex-1 max-w-[460px] shrink-0 mx-2 relative"
        >
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div
              className="relative flex items-center w-full px-4"
              style={{
                background: "var(--surface-2)",
                borderRadius: "var(--radius-full)",
                height: "42px",
                border: "1px solid var(--border)",
                transition: "all 0.25s ease",
              }}
            >
              <Search
                size={16}
                style={{
                  color: "var(--text-secondary)",
                  marginRight: "10px",
                  flexShrink: 0,
                }}
              />

              <div className="flex-1 relative h-full flex items-center overflow-hidden">
                {!searchQuery && (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={placeholderIndex}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 0.6 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="absolute pointer-events-none truncate text-xs font-normal"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {placeholders[placeholderIndex]}
                    </motion.span>
                  </AnimatePresence>
                )}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full h-full bg-transparent outline-none text-xs font-medium relative z-10"
                  style={{ color: "var(--text-primary)" }}
                  aria-label="Search products"
                  autoComplete="off"
                />
              </div>

              {searchLoading && (
                <div
                  className="w-3.5 h-3.5 border-2 rounded-full animate-spin ml-1"
                  style={{
                    borderColor: "rgba(154, 101, 60, 0.3)",
                    borderTopColor: "var(--accent-primary)",
                  }}
                />
              )}
            </div>
          </form>

          {/* Search Dropdown Results */}
          <AnimatePresence>
            {searchOpen && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-[44px] overflow-hidden z-50 shadow-modal"
                style={{
                  background: "var(--surface-3)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  maxHeight: "360px",
                  overflowY: "auto",
                }}
              >
                <div
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider flex justify-between"
                  style={{
                    color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span>Results for &ldquo;{searchQuery}&rdquo;</span>
                  <span>{searchResults.length} found</span>
                </div>

                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={`/product/${result.id}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--surface-2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: "var(--surface-2)" }}
                      >
                        {result.image_url ? (
                          <img
                            src={result.image_url}
                            alt={result.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package size={16} style={{ color: "var(--text-secondary)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {result.name}
                        </p>
                        <p
                          className="text-[11px] truncate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {result.brand}
                        </p>
                      </div>
                      {result.price && (
                        <span
                          className="text-xs font-bold shrink-0"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          ₹{parseFloat(result.price).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right Actions & Utilities ── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Wishlist Icon */}
          <Link href="/wishlist" aria-label="Wishlist">
            <div
              className="relative w-9.5 h-9.5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Heart
                size={18}
                style={{
                  fill: wishlistCount > 0 ? "var(--color-heat)" : "none",
                  color: wishlistCount > 0 ? "var(--color-heat)" : "currentColor",
                }}
              />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: "var(--color-heat)",
                    color: "#FFFDF8",
                  }}
                >
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </div>
          </Link>

          {/* Shopping Cart Icon */}
          <Link href="/cart" aria-label="Shopping Cart">
            <motion.div
              animate={{ scale: cartPulse ? 1.25 : 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-9.5 h-9.5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <ShoppingCart size={18} />
              {cartState.item_count > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm"
                  style={{
                    background: "var(--accent-primary)",
                    color: "#FFFDF8",
                  }}
                >
                  {cartState.item_count > 99 ? "99+" : cartState.item_count}
                </span>
              )}
            </motion.div>
          </Link>

          {/* User Auth / Profile Dropdown */}
          <div className="relative ml-1">
            {user ? (
              <div>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 p-0.5 rounded-full border transition-all cursor-pointer"
                  style={{
                    borderColor: "var(--border)",
                  }}
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt="User Profile"
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{
                        background: "var(--accent-primary)",
                        color: "#FFFDF8",
                      }}
                    >
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[42px] w-52 py-2 rounded-2xl shadow-modal z-50"
                      style={{
                        background: "var(--surface-3)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                        <p
                          className="text-xs font-bold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {user.name}
                        </p>
                        <p
                          className="text-[11px] truncate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {user.email}
                        </p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors"
                        style={{ color: "var(--text-primary)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <User size={14} /> Profile & Settings
                      </Link>

                      <Link
                        href="/assets"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors"
                        style={{ color: "var(--text-primary)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Package size={14} /> My Assets
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 transition-colors cursor-pointer border-t mt-1"
                        style={{ borderColor: "var(--border)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm"
                style={{
                  background: "var(--accent-primary)",
                  color: "#FFFDF8",
                }}
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden ml-1 p-1.5 rounded-md text-foreground"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-4 right-4 mt-2 p-4 rounded-2xl shadow-modal z-50 overflow-hidden"
            style={{
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: isActive
                        ? "var(--accent-primary)"
                        : "transparent",
                      color: isActive ? "#FFFDF8" : "var(--text-primary)",
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}