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
  SunMoon,
} from "lucide-react";

const navItems = [
  { name: "Discover", icon: Compass, href: "/" },
  { name: "Pantry", icon: UtensilsCrossed, href: "/pantry" },
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
  const pathname = usePathname();
  const { user, isLoading, signOut, signInWithGoogle } = useAuth();

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
        style={{ padding: "24px 32px" }}
      >
        <div
          className="w-full flex items-center justify-between"
          style={{
            maxWidth: "1400px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "28px",
            boxShadow: "0 8px 32px rgba(31, 54, 53, 0.04), 0 2px 8px rgba(31, 54, 53, 0.02)",
            padding: "12px 16px 12px 24px",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            height: "76px",
          }}
        >
          {/* ── Left: Logo & Tagline ── */}
          <Link href="/" className="flex items-center gap-4 group mr-6 shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "#1F3635", // Core
                  }}
                >
                  <span
                    className="font-bold"
                    style={{ fontSize: "16px", color: "#CACE00" }} // Juice
                  >
                    N
                  </span>
                </div>
                <span
                  className="text-xl font-bold tracking-tight hidden lg:inline"
                  style={{ color: "#1F3635" }} // Core
                >
                  NeedNow
                </span>
              </div>
              <span
                className="hidden lg:block mt-0.5 font-medium tracking-wide"
                style={{ fontSize: "11px", color: "#7BA3CE" }} // Sky
              >
                Need it? Just say it.
              </span>
            </div>
          </Link>

          {/* ── Center: Conversational Input ── */}
          <div className="hidden md:flex flex-1 max-w-[500px] shrink-0 mx-4">
            <div
              className="relative flex items-center w-full group overflow-hidden"
              style={{
                background: "#FCFBF4", // Cloud
                borderRadius: "9999px",
                height: "52px",
                padding: "0 8px 0 24px",
                boxShadow: "inset 0 2px 6px rgba(31, 54, 53, 0.03)",
                border: "1px solid rgba(123, 163, 206, 0.2)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#CACE00";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(202, 206, 0, 0.15), inset 0 2px 6px rgba(31, 54, 53, 0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(123, 163, 206, 0.2)";
                e.currentTarget.style.boxShadow = "inset 0 2px 6px rgba(31, 54, 53, 0.03)";
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
                      style={{ color: "#1F3635", opacity: 0.4, fontSize: "15px" }}
                    >
                      {placeholders[placeholderIndex]}
                    </span>
                  </motion.div>
                </AnimatePresence>
                <input
                  type="text"
                  className="w-full h-full bg-transparent outline-none font-medium"
                  style={{ color: "#1F3635", fontSize: "15px" }}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center relative overflow-hidden"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(123, 163, 206, 0.1)", // Sky tinted
                    color: "#025A5C", // Jade
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Mic size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center relative overflow-hidden"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#1F3635", // Core
                    color: "#CACE00", // Juice
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(31, 54, 53, 0.15)",
                  }}
                >
                  <Sparkles size={16} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* ── Navigation Links (Desktop) ── */}
          <nav className="hidden xl:flex items-center gap-1 mx-6 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 transition-all duration-200"
                    style={{
                      padding: "10px 16px",
                      borderRadius: "9999px",
                      color: isActive ? "#1F3635" : "#1F3635",
                      background: isActive ? "#CACE00" : "transparent",
                      fontSize: "14px",
                      fontWeight: isActive ? 600 : 500,
                      opacity: isActive ? 1 : 0.7,
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(123, 163, 206, 0.1)"; // Sky 10%
                        e.currentTarget.style.opacity = "1";
                      }
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.opacity = "0.7";
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

          {/* ── Right: Icon Buttons ── */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2 mr-2 pr-4 border-r border-gray-200/50">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "transparent",
                  color: "#1F3635", // Core
                  border: "none",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.15)"; // Sky tint
                  e.currentTarget.style.color = "#025A5C"; // Jade
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1F3635"; // Core
                }}
              >
                <SunMoon size={20} strokeWidth={2} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "transparent",
                  color: "#1F3635", // Core
                  border: "none",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.15)";
                  e.currentTarget.style.color = "#025A5C"; // Jade
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1F3635"; // Core
                }}
              >
                <Settings size={20} strokeWidth={2} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "transparent",
                  color: "#1F3635", // Core
                  border: "none",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.15)";
                  e.currentTarget.style.color = "#025A5C"; // Jade
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1F3635"; // Core
                }}
              >
                <Bell size={20} strokeWidth={2} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#CACE00" }} />
              </motion.button>
            </div>

            <Link href="/cart">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(123, 163, 206, 0.15)", // Sky tint
                  color: "#1F3635",
                  border: "none",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "#1F3635"; // Core
                  e.currentTarget.style.color = "#FCFBF4"; // Cloud
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.15)";
                  e.currentTarget.style.color = "#1F3635";
                }}
              >
                <ShoppingCart size={20} strokeWidth={2} />
                <span
                  className="absolute -top-1 -right-1 font-bold flex items-center justify-center"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#CACE00", // Juice
                    color: "#1F3635", // Core
                    fontSize: "11px",
                    boxShadow: "0 2px 4px rgba(31, 54, 53, 0.1)",
                  }}
                >
                  3
                </span>
              </motion.div>
            </Link>

            <div className="hidden sm:flex items-center ml-2">
              {!user && !isLoading ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignIn}
                  className="flex items-center gap-2 font-bold cursor-pointer"
                  style={{
                    padding: "10px 24px",
                    borderRadius: "9999px",
                    background: "#1F3635", // Core
                    color: "#CACE00", // Juice
                    fontSize: "14px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(31, 54, 53, 0.15)",
                  }}
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </motion.button>
              ) : user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center justify-center cursor-pointer p-1"
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
                        width={40}
                        height={40}
                        className="object-cover"
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          border: "2px solid #CACE00", // Juice
                          padding: "2px",
                        }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: "#1F3635", // Core
                          border: "2px solid #CACE00", // Juice
                          padding: "2px",
                        }}
                      >
                        <User size={18} color="#FCFBF4" />
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
                        className="absolute right-0 top-[60px]"
                        style={{
                          width: "240px",
                          background: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(12px)",
                          borderRadius: "20px",
                          boxShadow: "0 12px 32px rgba(31, 54, 53, 0.1)",
                          padding: "12px",
                          border: "1px solid rgba(123, 163, 206, 0.2)",
                        }}
                      >
                        <div
                          style={{
                            padding: "16px",
                            borderRadius: "14px",
                            background: "#FCFBF4", // Cloud
                            marginBottom: "8px",
                            border: "1px solid rgba(123, 163, 206, 0.1)",
                          }}
                        >
                          <p
                            className="font-bold truncate"
                            style={{ fontSize: "15px", color: "#1F3635" }}
                          >
                            {user.name || user.email}
                          </p>
                          <p
                            className="truncate"
                            style={{ fontSize: "13px", color: "#7BA3CE", marginTop: "2px" }}
                          >
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center justify-center gap-2 font-semibold cursor-pointer"
                          style={{
                            padding: "12px",
                            borderRadius: "14px",
                            color: "#1F3635",
                            background: "transparent",
                            border: "none",
                            fontSize: "14px",
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = "rgba(123, 163, 206, 0.1)";
                          }}
                          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden flex items-center justify-center cursor-pointer ml-2"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(123, 163, 206, 0.15)",
                border: "none",
                color: "#1F3635",
              }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
            className="fixed inset-0 z-40 xl:hidden pt-[110px] px-6 pb-6"
            style={{
              background: "rgba(252, 251, 244, 0.98)", // Cloud highly opaque
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Mobile Search - Similar to desktop pill */}
              <div
                className="relative flex items-center w-full group overflow-hidden mb-8 shrink-0"
                style={{
                  background: "#ffffff",
                  borderRadius: "9999px",
                  height: "56px",
                  padding: "0 8px 0 24px",
                  boxShadow: "0 4px 12px rgba(31, 54, 53, 0.05), inset 0 2px 6px rgba(31, 54, 53, 0.02)",
                  border: "1px solid rgba(123, 163, 206, 0.2)",
                }}
              >
                <div className="flex-1 relative h-full flex items-center overflow-hidden">
                  <span className="font-medium truncate" style={{ color: "#1F3635", opacity: 0.4, fontSize: "15px" }}>
                    {placeholders[0]}
                  </span>
                  <input type="text" className="absolute inset-0 w-full h-full bg-transparent outline-none font-medium text-transparent" />
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div
                    className="flex items-center justify-center"
                    style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1F3635", color: "#CACE00" }}
                  >
                    <Sparkles size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              <nav className="flex flex-col gap-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div
                        className="flex items-center gap-4"
                        style={{
                          padding: "16px 24px",
                          borderRadius: "20px",
                          background: isActive ? "#CACE00" : "rgba(255, 255, 255, 0.5)",
                          color: "#1F3635",
                          fontSize: "17px",
                          fontWeight: isActive ? 700 : 600,
                          boxShadow: isActive ? "0 4px 12px rgba(202, 206, 0, 0.2)" : "none",
                        }}
                      >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-8">
                {!user && !isLoading ? (
                  <button
                    onClick={() => {
                      handleSignIn();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 font-bold"
                    style={{
                      padding: "18px 24px",
                      borderRadius: "24px",
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
                    <div className="flex items-center gap-4 p-4 rounded-3xl" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(123, 163, 206, 0.2)" }}>
                      {user.image && (
                        <Image src={user.image} alt="Profile" width={48} height={48} className="rounded-full border-2" style={{ borderColor: "#CACE00" }} />
                      )}
                      <div>
                        <p className="font-bold text-lg" style={{ color: "#1F3635" }}>{user.name}</p>
                        <p className="font-medium" style={{ color: "#7BA3CE", fontSize: "14px" }}>{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl"
                      style={{ background: "rgba(123, 163, 206, 0.15)", color: "#1F3635", border: "none" }}
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