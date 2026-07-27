import React from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/authContext";

export const metadata = {
  title: "YourChords 2.0 - Platform Chord & Lirik Gitar Cyber-Zen",
  description: "Platform Chord & Lirik Gitar AI-Powered Terdepan dengan Fitur Transpose, Auto-Scroll, dan Scraper Chordtela.",
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
          {/* Fixed Navbar */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 bg-surface/50 backdrop-blur-md">
            <div className="max-w-[1400px] mx-auto px-6 py-10 text-center text-sm text-slate-500">
              <p>&copy; {new Date().getFullYear()} YourChords. All rights reserved.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
