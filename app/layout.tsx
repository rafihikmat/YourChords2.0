import React from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "YourChords 2.0",
  description: "Premium Platform to Learn and Play Guitar Chords",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col selection:bg-primary/30">
        
        {/* Fixed Navbar */}
        <Navbar />

        {/* Main Content Area — pt-16 to compensate for fixed navbar */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-surface">
          <div className="max-w-[1400px] mx-auto px-6 py-10 text-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} YourChords. All rights reserved.</p>
          </div>
        </footer>

      </body>
    </html>
  );
}
