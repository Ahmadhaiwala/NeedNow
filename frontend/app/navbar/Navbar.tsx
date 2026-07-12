"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/context/WishlistContext";
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
  Users,
  Clock,
  BrainCircuit,
  Settings,
  Sun,
  Moon,
  Search,
} from "lucide-react";

const navItems = [
  { name: "Discover", icon: Compass, href: "/" },
  { name: "Assets", icon: Package, href: "/assets" },
  { name: "Orders", icon: ShoppingCart, href: "/orders" },
  { name: "Shared Orders", icon: Users, href: "/groups" },
  { name: "History", icon: Clock, href: "/history" },
  { name: "AI Memory", icon: BrainCircuit, href: "/memory" },
];

const placeholders = [
  "I need groceries for 5 days...",
  "Build me a coding PC under ₹80,000...",
  "I'm hosting 10 guests tonight...",
  "I have ₹500 for groceries this week...",
  "I'm preparing for semester exams...",
];

// Minimal product shape returned by the search endpoint
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
  const [isDark, setIsDark] = useState(false);

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

  // ── Dark mode ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("neednow-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("neednow-theme", next ? "dark" : "light");
  };

  // ── Rotating placeholder ───────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ── Click-outside to close search dropdown ─────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Debounced search ──────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    try {
      // Grab JWT if available (server records the interaction for auth'd users)
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

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  // ── Shared style helpers ───────────────────────────────────────────────────
  const iconBtnStyle = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "transparent",
    color: isDark ? "#FCFBF4" : "#1F3635",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s, color 0.2s",
  } as const;

  const iconBtnHoverEnter = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.background = isDark
      ? "rgba(252, 251, 244, 0.1)"
      : "rgba(123, 163, 206, 0.15)";
  };
  const iconBtnHoverLeave = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.background = "transparent";
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex justify-center"
        style={{ padding: "16px", paddingTop: "20px", paddingBottom: "20px" }}
      >
        <div
          className="w-full flex items-center justify-between gap-3"
          style={{
            maxWidth: "1400px",
            background: isDark
              ? "rgba(61, 106, 104, 0.92)"
              : "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: "var(--radius-lg)",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)"
              : "var(--shadow-card)",
            padding: "8px 12px 8px 16px",
            border: isDark
              ? "1px solid rgba(252, 251, 244, 0.08)"
              : "1px solid rgba(255, 255, 255, 0.5)",
            minHeight: "60px",
            transition: "background 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          {/* ── Left: Logo ── */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "var(--radius-sm)",
                    background: "#1F3635",
                  }}
                >
                  <span className="font-bold" style={{ fontSize: "14px", color: "#CACE00" }}>
                    N
                  </span>
                </div>
                <span
                  className="text-xl font-bold tracking-tight"
                  style={{ color: isDark ? "#FCFBF4" : "#1F3635", transition: "color 0.3s" }}
                >
                  NeedNow
                </span>
              </div>
              <span
                className="hidden lg:block mt-0.5 font-medium tracking-wide"
                style={{ fontSize: "10px", color: "#7BA3CE" }}
              >
                Need it? Just say it.
              </span>
            </div>
          </Link>

          {/* ── Center: Search Bar ── */}
          <div
            ref={searchRef}
            className="hidden sm:flex flex-1 max-w-[480px] shrink-0 mx-2 lg:mx-4 relative"
          >
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div
                className="relative flex items-center w-full group overflow-hidden"
                style={{
                  background: isDark ? "#487D7B" : "#FCFBF4",
                  borderRadius: "var(--radius-full)",
                  height: "44px",
                  padding: "0 6px 0 16px",
                  boxShadow: isDark
                    ? "inset 0 2px 6px rgba(0,0,0,0.15)"
                    : "inset 0 2px 6px rgba(31, 54, 53, 0.03)",
                  border: isDark
                    ? "1px solid rgba(252,251,244,0.12)"
                    : "1px solid rgba(123, 163, 206, 0.2)",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.borderColor = "#CACE00";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(202, 206, 0, 0.15), inset 0 2px 6px rgba(31, 54, 53, 0.03)";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = isDark
                    ? "rgba(252,251,244,0.12)"
                    : "rgba(123, 163, 206, 0.2)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "inset 0 2px 6px rgba(0,0,0,0.15)"
                    : "inset 0 2px 6px rgba(31, 54, 53, 0.03)";
                }}
              >
                <Search
                  size={15}
                  style={{
                    color: isDark ? "rgba(252,251,244,0.4)" : "rgba(31,54,53,0.35)",
                    marginRight: "8px",
                    flexShrink: 0,
                  }}
                />

                <div className="flex-1 relative h-full flex items-center overflow-hidden">
                  {/* Animated placeholder (only shown when input is empty) */}
                  {!searchQuery && (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={placeholderIndex}
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -14, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "circOut" }}
                        className="absolute pointer-events-none truncate font-medium"
                        style={{
                          color: isDark ? "#FCFBF4" : "#1F3635",
                          opacity: 0.38,
                          fontSize: "14px",
                        }}
                      >
                        {placeholders[placeholderIndex]}
                      </motion.span>
                    </AnimatePresence>
                  )}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-full bg-transparent outline-none font-medium relative z-10"
                    style={{ color: isDark ? "#FCFBF4" : "#1F3635", fontSize: "14px" }}
                    aria-label="Search products"
                    autoComplete="off"
                  />
                </div>

                {/* Right buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {searchLoading && (
                    <div
                      className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{
                        borderColor: "rgba(202,206,0,0.3)",
                        borderTopColor: "#CACE00",
                      }}
                    />
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(123, 163, 206, 0.12)",
                      color: "#025A5C",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Mic size={14} />
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#1F3635",
                      color: "#CACE00",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(31, 54, 53, 0.18)",
                    }}
                  >
                    <Sparkles size={13} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>
            </form>

            {/* ── Search Dropdown ── */}
            <AnimatePresence>
              {searchOpen && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 top-[52px] overflow-hidden"
                  style={{
                    background: isDark
                      ? "rgba(72, 125, 123, 0.97)"
                      : "rgba(255, 255, 255, 0.97)",
                    backdropFilter: "blur(14px)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: isDark
                      ? "0 12px 32px rgba(0,0,0,0.3)"
                      : "var(--shadow-hover)",
                    border: isDark
                      ? "1px solid rgba(252,251,244,0.1)"
                      : "1px solid rgba(123,163,206,0.15)",
                    zIndex: 60,
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-4 pt-3 pb-2"
                    style={{ borderBottom: "var(--divider-row)" }}
                  >
                    <span
                      className="font-semibold uppercase tracking-widest"
                      style={{ fontSize: "10px", color: "#CACE00" }}
                    >
                      Results for &ldquo;{searchQuery}&rdquo;
                    </span>
                    <span
                      className="font-medium"
                      style={{ fontSize: "11px", color: isDark ? "rgba(252,251,244,0.5)" : "rgba(31,54,53,0.45)" }}
                    >
                      {searchResults.length} found
                    </span>
                  </div>

                  {/* Result rows */}
                  {searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={`/product/${result.id}`}
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3 transition-colors"
                        style={{ borderBottom: "var(--divider-row)", cursor: "pointer" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark
                            ? "rgba(252,251,244,0.06)"
                            : "rgba(123,163,206,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          className="flex-shrink-0 flex items-center justify-center"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(233,186,195,0.3)",
                            overflow: "hidden",
                          }}
                        >
                          {result.image_url ? (
                            <img
                              src={result.image_url}
                              alt={result.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package size={18} style={{ color: "#025A5C", opacity: 0.4 }} />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold truncate"
                            style={{ fontSize: "13px", color: isDark ? "#FCFBF4" : "#1F3635" }}
                          >
                            {result.name}
                          </p>
                          <p
                            className="truncate"
                            style={{ fontSize: "11px", color: "#7BA3CE", marginTop: "1px" }}
                          >
                            {result.brand}
                          </p>
                        </div>
                        {/* Price */}
                        {result.price && (
                          <span
                            className="font-bold shrink-0"
                            style={{ fontSize: "14px", color: "#025A5C" }}
                          >
                            ₹{parseFloat(result.price).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}

                  {/* Footer CTA */}
                  <button
                    onClick={handleSearchSubmit as unknown as React.MouseEventHandler}
                    className="w-full flex items-center justify-center gap-2 font-semibold py-3"
                    style={{
                      background: "transparent",
                      color: "#CACE00",
                      border: "none",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <Search size={13} />
                    View all results for &ldquo;{searchQuery}&rdquo;
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 xl:gap-2"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--radius-full)",
                      color: isActive ? "#1F3635" : (isDark ? "#FCFBF4" : "#1F3635"),
                      background: isActive ? "#CACE00" : "transparent",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 500,
                      opacity: isActive ? 1 : 0.75,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      if (!isActive) {
                        e.currentTarget.style.background = isDark
                          ? "rgba(252, 251, 244, 0.08)"
                          : "rgba(123, 163, 206, 0.1)";
                        e.currentTarget.style.opacity = "1";
                      }
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.opacity = "0.75";
                      }
                    }}
                  >
                    <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="hidden xl:inline">{item.name}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* ── Right: Icon Buttons ── */}
          <div className="flex items-center gap-1 lg:gap-2 shrink-0">

            {/* Desktop utility controls */}
            <div
              className="hidden md:flex items-center gap-1 mr-1 lg:mr-2 pr-2 lg:pr-3"
              style={{
                borderRight: `1px solid ${
                  isDark ? "rgba(252,251,244,0.1)" : "rgba(200,200,200,0.5)"
                }`,
              }}
            >
              {/* Dark mode toggle */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={toggleDark}
                title={isDark ? "Light mode" : "Dark mode"}
                style={{
                  ...iconBtnStyle,
                  background: isDark ? "rgba(202, 206, 0, 0.15)" : "transparent",
                  color: isDark ? "#CACE00" : "#1F3635",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(202, 206, 0, 0.25)"
                    : "rgba(123, 163, 206, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(202, 206, 0, 0.15)"
                    : "transparent";
                }}
              >
                {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
              </motion.button>

              {/* Settings */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="hidden lg:flex"
                style={iconBtnStyle}
                onMouseEnter={iconBtnHoverEnter}
                onMouseLeave={iconBtnHoverLeave}
              >
                <Settings size={17} strokeWidth={2} />
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative"
                style={iconBtnStyle}
                onMouseEnter={iconBtnHoverEnter}
                onMouseLeave={iconBtnHoverLeave}
              >
                <Bell size={17} strokeWidth={2} />
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#CACE00" }}
                />
              </motion.button>
            </div>

            {/* Wishlist heart — with live badge */}
            <Link href="/wishlist" aria-label="Wishlist">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(233, 186, 195, 0.18)",
                  color: isDark ? "#CE9AA5" : "#025A5C",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "rgba(233,186,195,0.35)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "rgba(233, 186, 195, 0.18)";
                }}
              >
                <Heart
                  size={17}
                  strokeWidth={2}
                  style={{
                    fill: wishlistCount > 0 ? "currentColor" : "none",
                    transition: "fill 0.2s",
                  }}
                />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 font-bold flex items-center justify-center"
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "#E9BAC3",
                      color: "#1F3635",
                      fontSize: "9px",
                    }}
                  >
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </motion.div>
            </Link>

            {/* Cart */}
            <Link href="/cart" aria-label="Cart">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(123, 163, 206, 0.15)",
                  color: isDark ? "#FCFBF4" : "#1F3635",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "#1F3635";
                  e.currentTarget.style.color = "#FCFBF4";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.15)";
                  e.currentTarget.style.color = isDark ? "#FCFBF4" : "#1F3635";
                }}
              >
                <ShoppingCart size={17} strokeWidth={2} />
                <span
                  className="absolute -top-0.5 -right-0.5 font-bold flex items-center justify-center"
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#CACE00",
                    color: "#1F3635",
                    fontSize: "9px",
                    boxShadow: "var(--shadow-button)",
                  }}
                >
                  3
                </span>
              </motion.div>
            </Link>

            {/* User auth */}
            <div className="flex items-center ml-1">
              {!user && !isLoading ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignIn}
                  className="hidden sm:flex items-center gap-2 font-bold cursor-pointer"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-full)",
                    background: "#1F3635",
                    color: "#CACE00",
                    fontSize: "13px",
                    border: "none",
                    boxShadow: "var(--shadow-button)",
                  }}
                >
                  <LogIn size={14} />
                  <span className="hidden lg:inline">Sign In</span>
                </motion.button>
              ) : user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center justify-center cursor-pointer"
                    style={{ borderRadius: "50%", background: "transparent", border: "none" }}
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="object-cover"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          border: "2px solid #CACE00",
                        }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "#1F3635",
                          border: "2px solid #CACE00",
                        }}
                      >
                        <User size={16} color="#FCFBF4" />
                      </div>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[46px]"
                        style={{
                          width: "220px",
                          background: isDark
                            ? "rgba(72, 125, 123, 0.97)"
                            : "rgba(255, 255, 255, 0.97)",
                          backdropFilter: "blur(14px)",
                          borderRadius: "var(--radius-md)",
                          boxShadow: isDark
                            ? "0 12px 32px rgba(0,0,0,0.3)"
                            : "var(--shadow-hover)",
                          padding: "8px",
                          border: isDark
                            ? "1px solid rgba(252,251,244,0.1)"
                            : "1px solid rgba(123,163,206,0.2)",
                          zIndex: 70,
                        }}
                      >
                        <div
                          style={{
                            padding: "12px",
                            borderRadius: "var(--radius-sm)",
                            background: isDark ? "rgba(252,251,244,0.05)" : "#FCFBF4",
                            marginBottom: "6px",
                            border: isDark
                              ? "1px solid rgba(252,251,244,0.1)"
                              : "1px solid rgba(123,163,206,0.1)",
                          }}
                        >
                          <p
                            className="font-bold truncate"
                            style={{ fontSize: "14px", color: isDark ? "#FCFBF4" : "#1F3635" }}
                          >
                            {user.name || user.email}
                          </p>
                          <p
                            className="truncate mt-0.5"
                            style={{ fontSize: "12px", color: "#7BA3CE" }}
                          >
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center justify-center gap-2 font-semibold cursor-pointer"
                          style={{
                            padding: "10px",
                            borderRadius: "var(--radius-sm)",
                            color: isDark ? "#FCFBF4" : "#1F3635",
                            background: "transparent",
                            border: "none",
                            fontSize: "13px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark
                              ? "rgba(252,251,244,0.1)"
                              : "rgba(123,163,206,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center cursor-pointer ml-1"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(123, 163, 206, 0.15)",
                border: "none",
                color: isDark ? "#FCFBF4" : "#1F3635",
              }}
            >
              {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 lg:hidden pt-[96px] px-4 pb-6"
            style={{
              background: isDark
                ? "rgba(31, 54, 53, 0.98)"
                : "rgba(252, 251, 244, 0.98)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex flex-col h-full overflow-y-auto">

              {/* Mobile Search */}
              <div className="sm:hidden mb-6">
                <form onSubmit={handleSearchSubmit}>
                  <div
                    className="relative flex items-center w-full"
                    style={{
                      background: isDark ? "#487D7B" : "#ffffff",
                      borderRadius: "var(--radius-full)",
                      height: "48px",
                      padding: "0 6px 0 20px",
                      border: isDark
                        ? "1px solid rgba(252,251,244,0.12)"
                        : "1px solid rgba(123, 163, 206, 0.2)",
                    }}
                  >
                    <Search
                      size={15}
                      style={{
                        color: isDark ? "rgba(252,251,244,0.4)" : "rgba(31,54,53,0.35)",
                        marginRight: "10px",
                      }}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search products..."
                      className="flex-1 h-full bg-transparent outline-none font-medium"
                      style={{
                        color: isDark ? "#FCFBF4" : "#1F3635",
                        fontSize: "14px",
                      }}
                    />
                    <div
                      className="flex items-center justify-center ml-2"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#1F3635",
                        color: "#CACE00",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={15} strokeWidth={2.5} />
                    </div>
                  </div>
                </form>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col gap-2 mb-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className="flex items-center gap-4"
                        style={{
                          padding: "14px 20px",
                          borderRadius: "var(--radius-md)",
                          background: isActive
                            ? "#CACE00"
                            : isDark
                            ? "rgba(252,251,244,0.05)"
                            : "rgba(255, 255, 255, 0.5)",
                          color: isActive ? "#1F3635" : (isDark ? "#FCFBF4" : "#1F3635"),
                          fontSize: "16px",
                          fontWeight: isActive ? 700 : 600,
                          boxShadow: isActive ? "0 4px 12px rgba(202, 206, 0, 0.2)" : "none",
                        }}
                      >
                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}

                {/* Wishlist mobile link */}
                <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
                  <div
                    className="flex items-center gap-4"
                    style={{
                      padding: "14px 20px",
                      borderRadius: "var(--radius-md)",
                      background: isDark ? "rgba(252,251,244,0.05)" : "rgba(255,255,255,0.5)",
                      color: isDark ? "#FCFBF4" : "#1F3635",
                      fontSize: "16px",
                      fontWeight: 600,
                    }}
                  >
                    <Heart size={22} strokeWidth={2} />
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span
                        className="ml-auto font-bold"
                        style={{
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                          background: "#E9BAC3",
                          color: "#1F3635",
                          fontSize: "12px",
                        }}
                      >
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                </Link>
              </nav>

              {/* Auth bottom */}
              <div className="mt-auto pt-6">
                {!user && !isLoading ? (
                  <button
                    onClick={() => { handleSignIn(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-3 font-bold"
                    style={{
                      padding: "16px 24px",
                      borderRadius: "var(--radius-md)",
                      background: "#1F3635",
                      color: "#CACE00",
                      fontSize: "16px",
                      border: "none",
                      boxShadow: "var(--shadow-hover)",
                    }}
                  >
                    <LogIn size={20} />
                    Sign In with Google
                  </button>
                ) : user ? (
                  <div className="flex flex-col gap-3">
                    <div
                      className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{
                        background: isDark
                          ? "rgba(252,251,244,0.05)"
                          : "rgba(255,255,255,0.7)",
                        border: isDark
                          ? "1px solid rgba(252,251,244,0.1)"
                          : "1px solid rgba(123,163,206,0.2)",
                      }}
                    >
                      {user.image && (
                        <Image
                          src={user.image}
                          alt="Profile"
                          width={44}
                          height={44}
                          className="rounded-full border-2"
                          style={{ borderColor: "#CACE00" }}
                        />
                      )}
                      <div>
                        <p
                          className="font-bold text-lg"
                          style={{ color: isDark ? "#FCFBF4" : "#1F3635" }}
                        >
                          {user.name}
                        </p>
                        <p
                          className="font-medium"
                          style={{ color: "#7BA3CE", fontSize: "14px" }}
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl"
                      style={{
                        background: isDark
                          ? "rgba(252,251,244,0.1)"
                          : "rgba(123,163,206,0.15)",
                        color: isDark ? "#FCFBF4" : "#1F3635",
                        border: "none",
                      }}
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}