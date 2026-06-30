"use client";
import clsx from "clsx"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuth, SignInButton, SignOutButton } from "@/lib/auth";
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
  User,
  LogOut,
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  
  const { user, isLoading, signOut, signInWithGoogle } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setShowUserDropdown(false);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <header 
        className={clsx('fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'backdrop-blur-md', 'border-b', 'shadow-sm')}
        style={{ 
          backgroundColor: `${colors.white}E6`,
          borderBottomColor: colors.skyBlue 
        }}
      >
        <div className={clsx('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8')}>
          <div className={clsx('flex', 'justify-between', 'items-center', 'h-16')}>
            {/* Logo */}
            <Link href="/" className={clsx('flex', 'items-center', 'gap-3', 'group')}>
              <div 
                className={clsx('w-8', 'h-8', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'group-hover:scale-110', 'transition-transform')}
                style={{ 
                  background: `linear-gradient(135deg, ${colors.teal}, ${colors.navy})` 
                }}
              >
                <span className={clsx('font-bold', 'text-lg')} style={{ color: colors.white }}>N</span>
              </div>
              <span 
                className={clsx('text-xl', 'font-bold', 'hidden', 'sm:inline', 'group-hover:opacity-80', 'transition-opacity')}
                style={{ color: colors.navy }}
              >
                NeedNow
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className={clsx('hidden', 'lg:flex', 'items-center', 'gap-1')}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={clsx('flex', 'items-center', 'gap-2', 'px-4', 'py-2', 'rounded-lg', 'transition-all', 'duration-200', 'group')}
                      style={{ color: colors.navy }}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                        e.currentTarget.style.color = colors.teal;
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = colors.navy;
                      }}
                    >
                      <Icon size={18} className={clsx('group-hover:scale-110', 'transition-transform')} />
                      <span className={clsx('font-medium', 'text-sm')}>{item.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className={clsx('flex', 'items-center', 'gap-3')}>
              {/* Cart with badge */}
              <Link href="/cart">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={clsx('relative', 'p-2', 'rounded-lg', 'transition-colors')}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ShoppingCart size={20} style={{ color: colors.navy }} />
                  <span 
                    className={clsx('absolute', '-top-1', '-right-1', 'text-xs', 'font-bold', 'rounded-full', 'w-5', 'h-5', 'flex', 'items-center', 'justify-center')}
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
              <div className={clsx('hidden', 'sm:flex', 'items-center', 'gap-2')}>
                {!user && !isLoading ? (
                  <button
                    onClick={handleSignIn}
                    className={clsx('flex', 'items-center', 'gap-2', 'px-4', 'py-2', 'rounded-lg', 'font-medium', 'transition-opacity', 'hover:opacity-90')}
                    style={{ 
                      backgroundColor: colors.teal,
                      color: colors.white 
                    }}
                  >
                    <LogIn size={16} />
                    <span className={clsx('hidden', 'md:inline')}>Sign In</span>
                  </button>
                ) : user ? (
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className={clsx('flex', 'items-center', 'gap-2', 'p-2', 'rounded-lg', 'transition-colors')}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt="Profile"
                          width={32}
                          height={32}
                          className={clsx('w-8', 'h-8', 'rounded-full', 'object-cover')}
                        />
                      ) : (
                        <div 
                          className={clsx('w-8', 'h-8', 'rounded-full', 'flex', 'items-center', 'justify-center')}
                          style={{ backgroundColor: colors.teal }}
                        >
                          <User size={16} style={{ color: colors.white }} />
                        </div>
                      )}
                    </motion.button>

                    {/* User Dropdown */}
                    <AnimatePresence>
                      {showUserDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={clsx('absolute', 'right-0', 'top-12', 'w-48', 'py-2', 'rounded-lg', 'shadow-lg', 'border')}
                          style={{ 
                            backgroundColor: colors.white,
                            borderColor: colors.skyBlue 
                          }}
                        >
                          <div className={clsx('px-4', 'py-2', 'border-b')} style={{ borderBottomColor: colors.skyBlue }}>
                            <p className="font-medium" style={{ color: colors.navy }}>
                              {user.name || user.email}
                            </p>
                            <p className={clsx('text-sm', 'opacity-60')}>{user.email}</p>
                          </div>
                          <button 
                            onClick={handleSignOut}
                            className={clsx('w-full', 'flex', 'items-center', 'gap-2', 'px-4', 'py-2', 'text-left', 'transition-colors')}
                            style={{ color: colors.navy }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
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

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={clsx('lg:hidden', 'p-2', 'rounded-lg', 'transition-colors')}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
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
              className={clsx('fixed', 'inset-0', 'backdrop-blur-sm', 'z-40', 'lg:hidden')}
              style={{ backgroundColor: colors.navy + '33' }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={clsx('fixed', 'top-0', 'right-0', 'h-full', 'w-80', 'max-w-[80vw]', 'shadow-xl', 'z-50', 'lg:hidden')}
              style={{ backgroundColor: colors.white }}
            >
              <div className={clsx('flex', 'flex-col', 'h-full')}>
                {/* Header */}
                <div 
                  className={clsx('flex', 'items-center', 'justify-between', 'p-4', 'border-b')}
                  style={{ borderBottomColor: colors.skyBlue }}
                >
                  <div className={clsx('flex', 'items-center', 'gap-3')}>
                    <div 
                      className={clsx('w-8', 'h-8', 'rounded-lg', 'flex', 'items-center', 'justify-center')}
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.teal}, ${colors.navy})` 
                      }}
                    >
                      <span className={clsx('font-bold', 'text-lg')} style={{ color: colors.white }}>N</span>
                    </div>
                    <span className={clsx('text-xl', 'font-bold')} style={{ color: colors.navy }}>NeedNow</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx('p-2', 'rounded-lg', 'transition-colors')}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <X size={20} style={{ color: colors.navy }} />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className={clsx('flex-1', 'py-4')}>
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
                            className={clsx('flex', 'items-center', 'gap-3', 'px-6', 'py-3', 'transition-all', 'duration-200')}
                            style={{ color: colors.navy }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                              e.currentTarget.style.color = colors.teal;
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
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
                  className={clsx('p-4', 'border-t', 'space-y-3')}
                  style={{ borderTopColor: colors.skyBlue }}
                >
                  {!user && !isLoading ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleSignIn();
                        setIsMobileMenuOpen(false);
                      }}
                      className={clsx('w-full', 'flex', 'items-center', 'justify-center', 'gap-2', 'px-4', 'py-3', 'rounded-lg', 'font-medium', 'transition-opacity', 'hover:opacity-90')}
                      style={{ 
                        backgroundColor: colors.teal,
                        color: colors.white 
                      }}
                    >
                      <LogIn size={18} />
                      Sign In with Google
                    </motion.button>
                  ) : user ? (
                    <div className={clsx('text-center', 'space-y-2')}>
                      <div className={clsx('flex', 'items-center', 'justify-center', 'mb-2')}>
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt="Profile"
                            width={48}
                            height={48}
                            className={clsx('w-12', 'h-12', 'rounded-full', 'object-cover')}
                          />
                        ) : (
                          <div 
                            className={clsx('w-12', 'h-12', 'rounded-full', 'flex', 'items-center', 'justify-center')}
                            style={{ backgroundColor: colors.teal }}
                          >
                            <User size={20} style={{ color: colors.white }} />
                          </div>
                        )}
                      </div>
                      <p className="font-medium" style={{ color: colors.navy }}>
                        {user.name || user.email}
                      </p>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className={clsx('w-full', 'flex', 'items-center', 'justify-center', 'gap-2', 'px-4', 'py-2', 'rounded-lg', 'transition-colors')}
                        style={{ color: colors.navy }}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.backgroundColor = colors.skyBlue + '40';
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <LogOut size={16} />
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