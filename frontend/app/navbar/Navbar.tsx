"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Mic,
  Sparkles,
  Bell,
  ShoppingCart,
  Menu,
  X,
  LogIn,
  User,
  LogOut,
  Compass,
  UtensilsCrossed,
  Users,
  Clock,
  BrainCircuit,
  Settings,
  Sun,
  Moon,
  Package,
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

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const { user, isLoading, signOut, signInWithGoogle } = useAuth();

  // Initialise dark mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('neednow-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('neednow-theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex justify-center"
        style={{ padding: "16px 16px", paddingTop: "20px", paddingBottom: "20px" }}
      >
        <div
          className="w-full flex items-center justify-between"
          style={{
            maxWidth: "1400px",
            background: isDark
              ? "rgba(61, 106, 104, 0.92)"   /* surface-1 #3D6A68 @ 92% */
              : "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "20px",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)"
              : "0 8px 32px rgba(31, 54, 53, 0.04), 0 2px 8px rgba(31, 54, 53, 0.02)",
            padding: "8px 12px 8px 16px",
            border: isDark
              ? "1px solid rgba(252, 251, 244, 0.08)"
              : "1px solid rgba(255, 255, 255, 0.4)",
            minHeight: "60px",
            transition: "background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
          }}
        >
          {/* ── Left: Logo & Tagline ── */}
          <Link href="/" className="flex items-center gap-2 lg:gap-4 group shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#1F3635", // Core
                  }}
                >
                  <span
                    className="font-bold"
                    style={{ fontSize: "14px", color: "#CACE00" }} // Juice
                  >
                    N
                  </span>
                </div>
                <span
                   className="text-lg lg:text-xl font-bold tracking-tight"
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

          {/* ── Center: Conversational Input ── */}
          <div className="hidden sm:flex flex-1 max-w-[400px] lg:max-w-[500px] shrink-0 mx-2 lg:mx-4">
            <div
              className="relative flex items-center w-full group overflow-hidden"
              style={{
                background: isDark ? "#487D7B" : "#FCFBF4",
                borderRadius: "9999px",
                height: "44px",
                padding: "0 6px 0 16px",
                boxShadow: isDark
                  ? "inset 0 2px 6px rgba(0,0,0,0.15)"
                  : "inset 0 2px 6px rgba(31, 54, 53, 0.03)",
                border: isDark
                  ? "1px solid rgba(252,251,244,0.12)"
                  : "1px solid rgba(123, 163, 206, 0.2)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#CACE00";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(202, 206, 0, 0.15), inset 0 2px 6px rgba(31, 54, 53, 0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? "rgba(252,251,244,0.12)" : "rgba(123, 163, 206, 0.2)";
                e.currentTarget.style.boxShadow = isDark
                  ? "inset 0 2px 6px rgba(0,0,0,0.15)"
                  : "inset 0 2px 6px rgba(31, 54, 53, 0.03)";
              }}
            >
              <div className="flex-1 relative h-full flex items-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={placeholderIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                    className="absolute inset-0 flex items-center pointer-events-none"
                  >
                    <span
                      className="truncate font-medium"
                      style={{ color: isDark ? "#FCFBF4" : "#1F3635", opacity: 0.4, fontSize: "14px" }}
                    >
                      {placeholders[placeholderIndex]}
                    </span>
                  </motion.div>
                </AnimatePresence>
                <input
                  type="text"
                  className="w-full h-full bg-transparent outline-none font-medium"
                  style={{ color: isDark ? "#FCFBF4" : "#1F3635", fontSize: "14px" }}
                />
              </div>

              <div className="flex items-center gap-1 lg:gap-2 shrink-0 ml-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center relative overflow-hidden"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(123, 163, 206, 0.1)", // Sky tinted
                    color: "#025A5C", // Jade
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Mic size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center relative overflow-hidden"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#1F3635", // Core
                    color: "#CACE00", // Juice
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(31, 54, 53, 0.15)",
                  }}
                >
                  <Sparkles size={14} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* ── Navigation Links (Desktop) ── */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 xl:gap-2 transition-all duration-200"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "9999px",
                      color: isActive ? "#1F3635" : (isDark ? "#FCFBF4" : "#1F3635"),
                      background: isActive ? "#CACE00" : "transparent",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 500,
                      opacity: isActive ? 1 : 0.75,
                      transition: "color 0.3s",
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
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2 mr-1 lg:mr-2 pr-2 lg:pr-4" style={{ borderRight: `1px solid ${isDark ? 'rgba(252,251,244,0.1)' : 'rgba(200,200,200,0.5)'}` }}>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={toggleDark}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: isDark ? "rgba(202, 206, 0, 0.15)" : "transparent",
                  color: isDark ? "#CACE00" : "#1F3635",
                  border: "none",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(202, 206, 0, 0.25)"
                    : "rgba(123, 163, 206, 0.15)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(202, 206, 0, 0.15)"
                    : "transparent";
                }}
              >
                {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="hidden lg:flex items-center justify-center cursor-pointer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "transparent",
                  color: "#1F3635",
                  border: "none",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.15)";
                  e.currentTarget.style.color = "#025A5C";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1F3635";
                }}
              >
                <Settings size={18} strokeWidth={2} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "transparent",
                  color: "#1F3635",
                  border: "none",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.15)";
                  e.currentTarget.style.color = "#025A5C";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1F3635";
                }}
              >
                <Bell size={18} strokeWidth={2} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "#CACE00" }} />
              </motion.button>
            </div>

            {/* Cart Button */}
            <Link href="/cart">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(123, 163, 206, 0.15)",
                  color: "#1F3635",
                  border: "none",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "#1F3635";
                  e.currentTarget.style.color = "#FCFBF4";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.15)";
                  e.currentTarget.style.color = "#1F3635";
                }}
              >
                <ShoppingCart size={18} strokeWidth={2} />
                <span
                  className="absolute -top-0.5 -right-0.5 font-bold flex items-center justify-center"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#CACE00",
                    color: "#1F3635",
                    fontSize: "10px",
                    boxShadow: "0 2px 4px rgba(31, 54, 53, 0.1)",
                  }}
                >
                  3
                </span>
              </motion.div>
            </Link>

            {/* User Authentication */}
            <div className="flex items-center ml-1 lg:ml-2">
              {!user && !isLoading ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignIn}
                  className="hidden sm:flex items-center gap-2 font-bold cursor-pointer"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    background: "#1F3635",
                    color: "#CACE00",
                    fontSize: "13px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(31, 54, 53, 0.15)",
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
                    className="flex items-center justify-center cursor-pointer p-0.5"
                    style={{
                      borderRadius: "50%",
                      background: "transparent",
                      border: "none",
                    }}
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
                          padding: "1px",
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
                          padding: "1px",
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
                        className="absolute right-0 top-[50px]"
                        style={{
                          width: "220px",
                          background: isDark 
                            ? "rgba(72, 125, 123, 0.95)"
                            : "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(12px)",
                          borderRadius: "16px",
                          boxShadow: isDark
                            ? "0 12px 32px rgba(0,0,0,0.3)"
                            : "0 12px 32px rgba(31, 54, 53, 0.1)",
                          padding: "8px",
                          border: isDark
                            ? "1px solid rgba(252,251,244,0.1)"
                            : "1px solid rgba(123, 163, 206, 0.2)",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px",
                            borderRadius: "12px",
                            background: isDark ? "rgba(252,251,244,0.05)" : "#FCFBF4",
                            marginBottom: "6px",
                            border: isDark 
                              ? "1px solid rgba(252,251,244,0.1)"
                              : "1px solid rgba(123, 163, 206, 0.1)",
                          }}
                        >
                          <p
                            className="font-bold truncate"
                            style={{ fontSize: "14px", color: isDark ? "#FCFBF4" : "#1F3635" }}
                          >
                            {user.name || user.email}
                          </p>
                          <p
                            className="truncate"
                            style={{ fontSize: "12px", color: "#7BA3CE", marginTop: "2px" }}
                          >
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center justify-center gap-2 font-semibold cursor-pointer"
                          style={{
                            padding: "10px",
                            borderRadius: "12px",
                            color: isDark ? "#FCFBF4" : "#1F3635",
                            background: "transparent",
                            border: "none",
                            fontSize: "13px",
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = isDark
                              ? "rgba(252,251,244,0.1)"
                              : "rgba(123, 163, 206, 0.1)";
                          }}
                          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
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
                color: "#1F3635",
              }}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 lg:hidden pt-[90px] px-4 pb-6"
            style={{
              background: isDark 
                ? "rgba(31, 54, 53, 0.98)" 
                : "rgba(252, 251, 244, 0.98)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Mobile Search - Similar to desktop pill */}
              <div className="sm:hidden mb-6">
                <div
                  className="relative flex items-center w-full group overflow-hidden"
                  style={{
                    background: isDark ? "#487D7B" : "#ffffff",
                    borderRadius: "9999px",
                    height: "48px",
                    padding: "0 6px 0 20px",
                    boxShadow: isDark
                      ? "0 4px 12px rgba(0,0,0,0.15)"
                      : "0 4px 12px rgba(31, 54, 53, 0.05), inset 0 2px 6px rgba(31, 54, 53, 0.02)",
                    border: isDark
                      ? "1px solid rgba(252,251,244,0.12)"
                      : "1px solid rgba(123, 163, 206, 0.2)",
                  }}
                >
                  <div className="flex-1 relative h-full flex items-center overflow-hidden">
                    <span className="font-medium truncate" style={{ color: isDark ? "rgba(252,251,244,0.4)" : "rgba(31,54,53,0.4)", fontSize: "14px" }}>
                      {placeholders[0]}
                    </span>
                    <input type="text" className="absolute inset-0 w-full h-full bg-transparent outline-none font-medium text-transparent" />
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <div
                      className="flex items-center justify-center"
                      style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1F3635", color: "#CACE00" }}
                    >
                      <Sparkles size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex flex-col gap-2 mb-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div
                        className="flex items-center gap-4"
                        style={{
                          padding: "14px 20px",
                          borderRadius: "16px",
                          background: isActive 
                            ? "#CACE00" 
                            : isDark ? "rgba(252,251,244,0.05)" : "rgba(255, 255, 255, 0.5)",
                          color: isActive ? "#1F3635" : (isDark ? "#FCFBF4" : "#1F3635"),
                          fontSize: "16px",
                          fontWeight: isActive ? 700 : 600,
                          boxShadow: isActive ? "0 4px 12px rgba(202, 206, 0, 0.2)" : "none",
                          border: isDark && !isActive 
                            ? "1px solid rgba(252,251,244,0.1)" 
                            : "1px solid transparent",
                        }}
                      >
                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-6">
                {!user && !isLoading ? (
                  <button
                    onClick={() => {
                      handleSignIn();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 font-bold"
                    style={{
                      padding: "16px 24px",
                      borderRadius: "20px",
                      background: "#1F3635",
                      color: "#CACE00",
                      fontSize: "16px",
                      border: "none",
                      boxShadow: "0 8px 24px rgba(31, 54, 53, 0.2)",
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
                          : "1px solid rgba(123, 163, 206, 0.2)" 
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
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl"
                      style={{ 
                        background: isDark 
                          ? "rgba(252,251,244,0.1)" 
                          : "rgba(123, 163, 206, 0.15)", 
                        color: isDark ? "#FCFBF4" : "#1F3635", 
                        border: "none" 
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