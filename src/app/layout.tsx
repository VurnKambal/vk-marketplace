import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VK Marketplace - Buy & Sell Local Items",
    template: "%s | VK Marketplace",
  },
  description:
    "Discover and sell items in your local community. A secure marketplace for buying and selling second-hand goods, electronics, furniture, and more.",
  keywords: [
    "marketplace",
    "buy",
    "sell",
    "local",
    "second-hand",
    "electronics",
    "furniture",
    "community",
  ],
  authors: [{ name: "VK Marketplace Team" }],
  creator: "VK Marketplace",
  publisher: "VK Marketplace",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://vk-marketplace.vercel.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://vk-marketplace.vercel.app",
    title: "VK Marketplace - Buy & Sell Local Items",
    description:
      "Discover and sell items in your local community. A secure marketplace for buying and selling second-hand goods.",
    siteName: "VK Marketplace",
  },
  twitter: {
    card: "summary_large_image",
    title: "VK Marketplace - Buy & Sell Local Items",
    description:
      "Discover and sell items in your local community. A secure marketplace for buying and selling second-hand goods.",
    creator: "@vkmarketplace",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
