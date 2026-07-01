"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import {
  Home,
  MessageCircle,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  Menu,
  X,
  LogIn,
  Search,
  User,
  LogOut,
} from "lucide-react";

const navItems = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Chat", icon: MessageCircle, href: "/chat" },
  { name: "Products", icon: ShoppingCart, href: "/products" },
  { name: "Pantry", icon: UtensilsCrossed, href: "/pantry" },
  { name: "Groups", icon: Users, href: "/groups" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const { user, isLoading, signOut, signInWithGoogle } = useAuth();

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
      {/* ── Desktop Navbar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{ padding: "12px 24px" }}
      >
        {/* Floating rounded container — §9: bg-surface, radius-lg */}
        <div
          className="max-w-7xl mx-auto flex items-center justify-between"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-card)",
            padding: "10px 12px 10px 20px",
            height: "56px",
          }}
        >
          {/* ── Left: Logo ── */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-core)",
              }}
            >
              <span
                className="font-bold"
                style={{ fontSize: "18px", color: "var(--color-juice)" }}
              >
                N
              </span>
            </div>
            <span
              className="text-lg font-bold hidden sm:inline"
              style={{ color: "var(--text-primary)" }}
            >
              NeedNow
            </span>
          </Link>

          {/* ── Center: Pill search bar (desktop) — §8 ── */}
          <div
            className="hidden md:flex items-center gap-2 flex-1 mx-8"
            style={{ maxWidth: "400px" }}
          >
            <div
              className="flex items-center gap-2 w-full"
              style={{
                background: "var(--color-sky)",
                opacity: 0.35,
                borderRadius: "var(--radius-full)",
                padding: "8px 16px",
                height: "40px",
                transition: "opacity 0.2s ease-out",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.opacity = "0.5";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.opacity = "0.35";
              }}
            >
              <Search size={16} style={{ color: "var(--color-core)" }} />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-core)",
                  opacity: 0.7,
                }}
              >
                Search products...
              </span>
            </div>
          </div>

          {/* ── Desktop nav links ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 transition-all duration-200"
                    style={{
                      padding: "8px 14px",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.background = "var(--color-sky)";
                      e.currentTarget.style.opacity = "0.3";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* ── Right: Icon buttons + auth ── */}
          <div className="flex items-center gap-2">
            {/* Cart — §6 circular icon button: sky fill on light surfaces */}
            <Link href="/cart">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(123, 163, 206, 0.2)",
                  transition: "background 0.2s ease-out",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "var(--color-jade)";
                  const icon = e.currentTarget.querySelector("svg");
                  if (icon)
                    (icon as SVGElement).style.color = "var(--color-cloud)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.background = "rgba(123, 163, 206, 0.2)";
                  const icon = e.currentTarget.querySelector("svg");
                  if (icon)
                    (icon as SVGElement).style.color = "var(--text-primary)";
                }}
              >
                <ShoppingCart
                  size={18}
                  style={{
                    color: "var(--text-primary)",
                    transition: "color 0.2s ease-out",
                  }}
                />
                <span
                  className="absolute -top-1 -right-1 font-bold flex items-center justify-center"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--accent-primary)",
                    color: "var(--color-core)",
                    fontSize: "10px",
                  }}
                >
                  3
                </span>
              </motion.div>
            </Link>

            {/* Auth */}
            <div className="hidden sm:flex items-center gap-2">
              {!user && !isLoading ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignIn}
                  className="flex items-center gap-2 font-semibold cursor-pointer"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--accent-primary)",
                    color: "var(--color-core)",
                    fontSize: "13px",
                    border: "none",
                    boxShadow: "var(--shadow-button)",
                    transition: "opacity 0.2s ease-out",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.opacity = "0.85";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <LogIn size={14} />
                  <span className="hidden md:inline">Sign In</span>
                </motion.button>
              ) : user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 cursor-pointer"
                    style={{
                      padding: "4px 12px 4px 4px",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(123, 163, 206, 0.2)",
                      border: "none",
                      transition: "background 0.2s ease-out",
                    }}
                    onMouseEnter={(
                      e: React.MouseEvent<HTMLButtonElement>
                    ) => {
                      e.currentTarget.style.background =
                        "rgba(123, 163, 206, 0.35)";
                    }}
                    onMouseLeave={(
                      e: React.MouseEvent<HTMLButtonElement>
                    ) => {
                      e.currentTarget.style.background =
                        "rgba(123, 163, 206, 0.2)";
                    }}
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="object-cover"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "var(--radius-full)",
                          border: "2px solid var(--bg-surface)",
                        }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "var(--radius-full)",
                          background: "var(--color-core)",
                          border: "2px solid var(--bg-surface)",
                        }}
                      >
                        <User
                          size={14}
                          style={{ color: "var(--color-cloud)" }}
                        />
                      </div>
                    )}
                    <span
                      data-name
                      className="hidden md:inline font-medium"
                      style={{
                        fontSize: "13px",
                        color: "var(--text-primary)",
                        transition: "color 0.2s ease-out",
                      }}
                    >
                      {user.name?.split(" ")[0] || "Account"}
                    </span>
                  </motion.button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12"
                        style={{
                          width: "220px",
                          background: "var(--bg-surface)",
                          borderRadius: "var(--radius-md)",
                          boxShadow: "var(--shadow-hover)",
                          padding: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(123, 163, 206, 0.15)",
                            marginBottom: "4px",
                          }}
                        >
                          <p
                            className="font-semibold"
                            style={{
                              fontSize: "14px",
                              color: "var(--text-primary)",
                            }}
                          >
                            {user.name || user.email}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                              marginTop: "2px",
                            }}
                          >
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 cursor-pointer"
                          style={{
                            padding: "10px 12px",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text-primary)",
                            fontSize: "13px",
                            fontWeight: 500,
                            background: "transparent",
                            border: "none",
                            transition: "background 0.2s ease-out",
                          }}
                          onMouseEnter={(
                            e: React.MouseEvent<HTMLButtonElement>
                          ) => {
                            e.currentTarget.style.background =
                              "var(--bg-page)";
                          }}
                          onMouseLeave={(
                            e: React.MouseEvent<HTMLButtonElement>
                          ) => {
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

            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center cursor-pointer"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-full)",
                background: "rgba(123, 163, 206, 0.2)",
                border: "none",
                transition: "background 0.2s ease-out",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = "var(--color-jade)";
                const icon = e.currentTarget.querySelector("svg");
                if (icon)
                  (icon as SVGElement).style.color = "var(--color-cloud)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = "rgba(123, 163, 206, 0.2)";
                const icon = e.currentTarget.querySelector("svg");
                if (icon)
                  (icon as SVGElement).style.color = "var(--text-primary)";
              }}
            >
              {isMobileMenuOpen ? (
                <X
                  size={18}
                  style={{
                    color: "var(--text-primary)",
                    transition: "color 0.2s ease-out",
                  }}
                />
              ) : (
                <Menu
                  size={18}
                  style={{
                    color: "var(--text-primary)",
                    transition: "color 0.2s ease-out",
                  }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{
                background: "rgba(31, 54, 53, 0.3)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full z-50 lg:hidden"
              style={{
                width: "320px",
                maxWidth: "85vw",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
                boxShadow: "var(--shadow-hover)",
              }}
            >
              <div className="flex flex-col h-full">
                {/* Panel header */}
                <div
                  className="flex items-center justify-between"
                  style={{ padding: "20px 20px 16px" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-core)",
                      }}
                    >
                      <span
                        className="font-bold"
                        style={{
                          fontSize: "18px",
                          color: "var(--color-juice)",
                        }}
                      >
                        N
                      </span>
                    </div>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: "18px",
                        color: "var(--text-primary)",
                      }}
                    >
                      NeedNow
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(123, 163, 206, 0.2)",
                      border: "none",
                    }}
                  >
                    <X
                      size={16}
                      style={{ color: "var(--text-primary)" }}
                    />
                  </button>
                </div>

                {/* Mobile search */}
                <div style={{ padding: "0 20px 16px" }}>
                  <div
                    className="flex items-center gap-2"
                    style={{
                      background: "rgba(123, 163, 206, 0.2)",
                      borderRadius: "var(--radius-full)",
                      padding: "10px 16px",
                      height: "44px",
                    }}
                  >
                    <Search
                      size={16}
                      style={{ color: "var(--text-primary)", opacity: 0.5 }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        opacity: 0.4,
                      }}
                    >
                      Search products...
                    </span>
                  </div>
                </div>

                {/* Nav links */}
                <nav className="flex-1" style={{ padding: "0 12px" }}>
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.06 }}
                      >
                        <Link href={item.href}>
                          <div
                            className="flex items-center gap-3"
                            style={{
                              padding: "12px 16px",
                              borderRadius: "var(--radius-md)",
                              color: "var(--text-primary)",
                              fontSize: "15px",
                              fontWeight: 500,
                              transition: "background 0.2s ease-out",
                            }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            onMouseEnter={(
                              e: React.MouseEvent<HTMLDivElement>
                            ) => {
                              e.currentTarget.style.background =
                                "rgba(123, 163, 206, 0.15)";
                            }}
                            onMouseLeave={(
                              e: React.MouseEvent<HTMLDivElement>
                            ) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <Icon size={18} />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile auth footer */}
                <div style={{ padding: "16px 20px" }}>
                  {!user && !isLoading ? (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleSignIn();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 font-semibold cursor-pointer"
                      style={{
                        padding: "14px 20px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--accent-primary)",
                        color: "var(--color-core)",
                        fontSize: "14px",
                        border: "none",
                        boxShadow: "var(--shadow-button)",
                      }}
                    >
                      <LogIn size={16} />
                      Sign In with Google
                    </motion.button>
                  ) : user ? (
                    <div>
                      <div
                        className="flex items-center gap-3"
                        style={{
                          padding: "12px 16px",
                          borderRadius: "var(--radius-md)",
                          background: "rgba(123, 163, 206, 0.15)",
                          marginBottom: "8px",
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
                              width: "40px",
                              height: "40px",
                              borderRadius: "var(--radius-full)",
                              border: "2px solid var(--bg-surface)",
                            }}
                          />
                        ) : (
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "var(--radius-full)",
                              background: "var(--color-core)",
                              border: "2px solid var(--bg-surface)",
                            }}
                          >
                            <User
                              size={16}
                              style={{ color: "var(--color-cloud)" }}
                            />
                          </div>
                        )}
                        <div>
                          <p
                            className="font-semibold"
                            style={{
                              fontSize: "14px",
                              color: "var(--text-primary)",
                            }}
                          >
                            {user.name || "Account"}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                            }}
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
                        className="w-full flex items-center justify-center gap-2 cursor-pointer"
                        style={{
                          padding: "10px 16px",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          fontWeight: 500,
                          background: "transparent",
                          border: "none",
                          transition: "background 0.2s ease-out",
                        }}
                        onMouseEnter={(
                          e: React.MouseEvent<HTMLButtonElement>
                        ) => {
                          e.currentTarget.style.background = "var(--bg-page)";
                        }}
                        onMouseLeave={(
                          e: React.MouseEvent<HTMLButtonElement>
                        ) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}