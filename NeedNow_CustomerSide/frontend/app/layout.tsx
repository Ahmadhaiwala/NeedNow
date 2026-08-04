import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import clsx from "clsx";
import "./globals.css";
import Layout from "./layout/Layout";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeedNow - AI Shopping Assistant",
  description: "Your personal AI shopping assistant for smart ingredient shopping and meal planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className={clsx('min-h-full', 'flex', 'flex-col', 'bg-background', 'text-foreground', 'transition-theme')}>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
