"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import {
  Home,
  MessageCircle,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  Menu,
  X,
  LogIn,
  UserPlus,
} from "lucide-react";

const navItems = [
  {
    name: "Home",
    icon: Home,
    href: "/",
  },
  {
    name: "Chat",
    icon: MessageCircle,
    href: "/chat",
  },
  {
    name: "Products",
    icon: ShoppingCart,
    href: "/products",
  },
  {
    name: "Pantry",
    icon: UtensilsCrossed,
    href: "/pantry",
  },
  {
    name: "Groups",
    icon: Users,
    href: "/groups",
  },
];

// Your custom color palette
const colors = {
  navy: "#2F4156",
  teal: "#567C8D", 
  skyBlue: "#C8D9E6",
  beige: "#F5EFEB",
  white: "#FFFFFF"
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <>
      {/* Desktop Navbar */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-sm"
        style={{ 
          backgroundColor: `${colors.white}E6`,
          borderBottomColor: colors.skyBlue 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.teal}, ${colors.navy})` 
                }}
              >
                <span className="font-bold text-lg" style={{ color: colors.white }}>N</span>
              </div>
              <span 
                className="text-xl font-bold hidden sm:inline group-hover:opacity-80 transition-opacity"
                style={{ color: colors.navy }}
              >
                NeedNow
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group"
                      style={{ color: colors.navy }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                        e.currentTarget.style.color = colors.teal;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = colors.navy;
                      }}
                    >
                      <Icon size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Cart with badge */}
              <Link href="/cart">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 rounded-lg transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ShoppingCart size={20} style={{ color: colors.navy }} />
                  <span 
                    className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ 
                      backgroundColor: colors.teal,
                      color: colors.white 
                    }}
                  >
                    3
                  </span>
                </motion.div>
              </Link>

              {/* Auth Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                {!isSignedIn ? (
                  <>
                    <SignInButton mode="modal">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-3 py-2 font-medium transition-colors"
                        style={{ color: colors.navy }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = colors.teal;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = colors.navy;
                        }}
                      >
                        <LogIn size={16} />
                        <span className="hidden md:inline">Sign In</span>
                      </motion.button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                        style={{ 
                          backgroundColor: colors.teal,
                          color: colors.white 
                        }}
                      >
                        <UserPlus size={16} />
                        <span className="hidden md:inline">Sign Up</span>
                      </motion.button>
                    </SignUpButton>
                  </>
                ) : (
                  <div 
                    className="p-1 rounded-lg transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                          userButtonPopoverCard: "bg-white border border-gray-200 shadow-lg",
                          userButtonPopoverActions: "space-y-1",
                          userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-50",
                          userButtonPopoverFooter: "border-t border-gray-200",
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {isMobileMenuOpen ? (
                  <X size={24} style={{ color: colors.navy }} />
                ) : (
                  <Menu size={24} style={{ color: colors.navy }} />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
              style={{ backgroundColor: colors.navy + '33' }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[80vw] shadow-xl z-50 lg:hidden"
              style={{ backgroundColor: colors.white }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div 
                  className="flex items-center justify-between p-4 border-b"
                  style={{ borderBottomColor: colors.skyBlue }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.teal}, ${colors.navy})` 
                      }}
                    >
                      <span className="font-bold text-lg" style={{ color: colors.white }}>N</span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: colors.navy }}>NeedNow</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <X size={20} style={{ color: colors.navy }} />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-4">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link href={item.href}>
                          <div
                            className="flex items-center gap-3 px-6 py-3 transition-all duration-200"
                            style={{ color: colors.navy }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                              e.currentTarget.style.color = colors.teal;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = colors.navy;
                            }}
                          >
                            <Icon size={20} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile Auth Section */}
                <div 
                  className="p-4 border-t space-y-3"
                  style={{ borderTopColor: colors.skyBlue }}
                >
                  {!isSignedIn ? (
                    <>
                      <SignInButton mode="modal">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 font-medium border rounded-lg transition-all"
                          style={{ 
                            color: colors.navy,
                            borderColor: colors.skyBlue
                          }}
                          onClick={() => setIsMobileMenuOpen(false)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.teal;
                            e.currentTarget.style.color = colors.teal;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.skyBlue;
                            e.currentTarget.style.color = colors.navy;
                          }}
                        >
                          <LogIn size={18} />
                          Sign In
                        </motion.button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                          style={{ 
                            backgroundColor: colors.teal,
                            color: colors.white 
                          }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <UserPlus size={18} />
                          Sign Up
                        </motion.button>
                      </SignUpButton>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-2">
                      <UserButton 
                        appearance={{
                          elements: {
                            avatarBox: "w-10 h-10",
                            userButtonPopoverCard: "bg-white border border-gray-200 shadow-lg",
                            userButtonPopoverActions: "space-y-1",
                            userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-50",
                            userButtonPopoverFooter: "border-t border-gray-200",
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}