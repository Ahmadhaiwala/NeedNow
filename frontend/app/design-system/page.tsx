"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Search, 
  Bell, 
  User, 
  Package, 
  Settings,
  Check,
  X,
  Info,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState("");
  const [selectedChip, setSelectedChip] = useState("all");

  return (
    <div className="min-h-screen bg-background transition-theme">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
              NeedNow Design System
            </h1>
            <p className="text-lg text-muted">
              Comprehensive component library with warm wheat & leather theme
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Color Palette */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch 
              name="Background" 
              color="var(--background)" 
              className="bg-background border-2 border-default" 
            />
            <ColorSwatch 
              name="Surface" 
              color="var(--surface)" 
              className="bg-surface border-2 border-default" 
            />
            <ColorSwatch 
              name="Surface Elevated" 
              color="var(--surface-elevated)" 
              className="bg-surface-elevated border-2 border-default shadow-card" 
            />
            <ColorSwatch 
              name="Accent" 
              color="var(--accent)" 
              className="bg-accent text-accent-foreground" 
            />
            <ColorSwatch 
              name="Destructive" 
              color="var(--destructive)" 
              className="bg-destructive text-destructive-foreground" 
            />
            <ColorSwatch 
              name="Success" 
              color="var(--success)" 
              className="bg-success text-success-foreground" 
            />
            <ColorSwatch 
              name="Warning" 
              color="var(--warning)" 
              className="bg-warning text-warning-foreground" 
            />
            <ColorSwatch 
              name="Info" 
              color="var(--info)" 
              className="bg-info text-info-foreground" 
            />
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
                Hero Heading (48px)
              </h1>
              <p className="text-sm text-muted font-mono">font-serif, 48px, font-bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">
                H1 Heading (32px)
              </h2>
              <p className="text-sm text-muted font-mono">font-serif, 32px, font-semibold</p>
            </div>
            <div>
              <h3 className="text-xl font-serif font-medium text-foreground mb-2">
                H2 Heading (22px)
              </h3>
              <p className="text-sm text-muted font-mono">font-serif, 22px, font-medium</p>
            </div>
            <div>
              <p className="text-base text-foreground mb-2">
                Body text with regular weight and comfortable line height for readability.
              </p>
              <p className="text-sm text-muted font-mono">font-sans, 16px, font-normal</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-2">
                Caption text for supplementary information and metadata.
              </p>
              <p className="text-sm text-muted font-mono">font-sans, 13px, muted color</p>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Button Variants">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="destructive">Delete Item</Button>
            <Button variant="success">Confirm Order</Button>
            <Button variant="outline">Cancel</Button>
            <Button variant="ghost">Skip</Button>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Card Variants">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Basic Card" description="Default surface with subtle shadow">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Package size={16} />
                <span>Standard content card</span>
              </div>
            </Card>
            
            <Card 
              title="Elevated Card" 
              description="Higher elevation with stronger shadow"
              elevated
            >
              <div className="flex items-center gap-2 text-sm text-muted">
                <Star size={16} className="fill-warning text-warning" />
                <span>Featured content</span>
              </div>
            </Card>

            <Card title="Product Card" description="E-commerce product display">
              <div className="space-y-3">
                <div className="w-full h-32 bg-surface-alt rounded-lg flex items-center justify-center">
                  <Package size={32} className="text-muted" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">₹2,999</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-warning text-warning" />
                    <span className="text-sm text-muted">4.5</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Section>

        {/* Form Controls */}
        <Section title="Form Controls">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search Input
                </label>
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search products, brands..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-theme text-foreground placeholder-muted"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Dropdown
                </label>
                <select className="w-full px-4 py-3 bg-surface border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-theme text-foreground">
                  <option>Select category</option>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home & Living</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Filter Chips
              </label>
              <div className="flex flex-wrap gap-2">
                {["all", "electronics", "fashion", "home", "groceries"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setSelectedChip(chip)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-theme ${
                      selectedChip === chip
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface border border-default text-foreground hover:bg-accent-muted"
                    }`}
                  >
                    {chip.charAt(0).toUpperCase() + chip.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Navigation & UI Elements */}
        <Section title="Navigation & UI Elements">
          <div className="space-y-6">
            <div className="bg-surface p-4 rounded-lg border border-default">
              <h4 className="font-medium text-foreground mb-3">Navbar Preview</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="font-serif font-bold text-xl text-foreground">NeedNow</div>
                  <nav className="flex gap-6">
                    <a href="#" className="text-foreground hover:text-accent transition-theme">Discover</a>
                    <a href="#" className="text-foreground hover:text-accent transition-theme">Marketplace</a>
                    <a href="#" className="text-accent font-medium">AI Agent</a>
                  </nav>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-accent-muted rounded-lg transition-theme">
                    <Bell size={20} className="text-muted" />
                  </button>
                  <button className="p-2 hover:bg-accent-muted rounded-lg transition-theme">
                    <ShoppingCart size={20} className="text-muted" />
                  </button>
                  <button className="p-2 hover:bg-accent-muted rounded-lg transition-theme">
                    <User size={20} className="text-muted" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Badges & Pills</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                    New
                  </span>
                  <span className="px-2 py-1 bg-success text-success-foreground text-xs font-medium rounded-full">
                    In Stock
                  </span>
                  <span className="px-2 py-1 bg-warning text-warning-foreground text-xs font-medium rounded-full">
                    Limited
                  </span>
                  <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
                    Sold Out
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-3">Action Icons</h4>
                <div className="flex gap-3">
                  <button className="p-3 bg-surface hover:bg-accent hover:text-accent-foreground rounded-lg transition-theme shadow-card">
                    <Heart size={20} />
                  </button>
                  <button className="p-3 bg-surface hover:bg-accent hover:text-accent-foreground rounded-lg transition-theme shadow-card">
                    <ShoppingCart size={20} />
                  </button>
                  <button className="p-3 bg-surface hover:bg-accent hover:text-accent-foreground rounded-lg transition-theme shadow-card">
                    <Settings size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Alerts & Notifications */}
        <Section title="Alerts & Notifications">
          <div className="space-y-4">
            <Alert type="success" icon={CheckCircle}>
              Order placed successfully! Your items will be delivered within 2-3 business days.
            </Alert>
            <Alert type="warning" icon={AlertTriangle}>
              Low stock alert: Only 3 items remaining for this product.
            </Alert>
            <Alert type="destructive" icon={X}>
              Payment failed. Please check your payment method and try again.
            </Alert>
            <Alert type="info" icon={Info}>
              New AI-powered recommendations are available based on your recent purchases.
            </Alert>
          </div>
        </Section>

        {/* Loading States */}
        <Section title="Loading & Skeleton States">
          <div className="space-y-4">
            <div className="bg-surface p-6 rounded-lg border border-default">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-surface-alt rounded w-3/4"></div>
                <div className="h-4 bg-surface-alt rounded w-1/2"></div>
                <div className="h-4 bg-surface-alt rounded w-5/6"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface p-4 rounded-lg border border-default animate-pulse">
                  <div className="w-full h-32 bg-surface-alt rounded mb-3"></div>
                  <div className="h-4 bg-surface-alt rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-surface-alt rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-serif font-semibold text-foreground mb-6 pb-2 border-b border-default">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ColorSwatch({ name, color, className }: { name: string; color: string; className: string }) {
  return (
    <div className={`p-4 rounded-lg ${className}`}>
      <div className="font-medium text-sm mb-1">{name}</div>
      <div className="text-xs opacity-75 font-mono">{color}</div>
    </div>
  );
}

function Button({ 
  variant = "primary", 
  children 
}: { 
  variant?: "primary" | "secondary" | "destructive" | "success" | "outline" | "ghost";
  children: React.ReactNode;
}) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-theme";
  
  const variants = {
    primary: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-button",
    secondary: "bg-surface-elevated text-foreground hover:bg-accent-muted border border-default",
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
    success: "bg-success text-success-foreground hover:opacity-90",
    outline: "border border-default text-foreground hover:bg-surface-elevated",
    ghost: "text-foreground hover:bg-accent-muted"
  };

  return (
    <button className={`${baseClasses} ${variants[variant]}`}>
      {children}
    </button>
  );
}

function Card({ 
  title, 
  description, 
  children, 
  elevated = false 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode; 
  elevated?: boolean;
}) {
  return (
    <div className={`p-6 rounded-lg border border-default transition-theme ${
      elevated ? 'bg-surface-elevated shadow-hover' : 'bg-surface shadow-card'
    }`}>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted mb-4">{description}</p>
      {children}
    </div>
  );
}

function Alert({ 
  type, 
  icon: Icon, 
  children 
}: { 
  type: "success" | "warning" | "destructive" | "info";
  icon: any;
  children: React.ReactNode;
}) {
  const variants = {
    success: "bg-success/10 border-success text-success-foreground",
    warning: "bg-warning/10 border-warning text-warning-foreground", 
    destructive: "bg-destructive/10 border-destructive text-destructive-foreground",
    info: "bg-info/10 border-info text-info-foreground"
  };

  const iconColors = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive", 
    info: "text-info"
  };

  return (
    <div className={`p-4 rounded-lg border ${variants[type]}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={iconColors[type]} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}