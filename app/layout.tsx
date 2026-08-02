import React from "react";
import type { Metadata, Viewport } from 'next';
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/authContext";
import OfflineGuard from "@/components/OfflineGuard";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'YourChords 2.0 - Platform Chord & Lirik Lagu Terlengkap',
    template: '%s | YourChords 2.0'
  },
  description: 'Belajar, latih, dan mainkan ribuan chord & lirik lagu favoritmu secara real-time dengan Smart Transposer & Interactive Fretboard.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YourChords 2.0",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased min-h-screen flex flex-col selection:bg-primary/30 bg-slate-950 text-slate-100">
        <AuthProvider>
          {/* Offline Guard Indicator */}
          <OfflineGuard />

          {/* Fixed Navbar */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-grow">
            {children}
          </main>

          {/* PWA Installation Floating Banner */}
          <PWAInstallPrompt />

          {/* Cyber-Zen Footer Component */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

