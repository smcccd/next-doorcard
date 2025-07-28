// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { ProfileSetupProvider } from "@/components/ProfileSetupProvider";
import { Toaster } from "@/components/ui/toaster";
import { ReactNode, Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], display: "swap" });

// Strongly typed metadata with richer SEO
export const metadata: Metadata = {
  title: "Faculty Doorcard App",
  description: "Create and manage faculty doorcards",
  applicationName: "Faculty Doorcard",
  openGraph: {
    title: "Faculty Doorcard App",
    description: "Create and manage faculty doorcards",
    type: "website",
  },
  // Prevent indexing on non-production
  robots:
    process.env.NODE_ENV === "production"
      ? undefined
      : { index: false, follow: false },
  themeColor: "#1e40af",
};

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-5 mt-auto">
      <div className="text-center text-gray-300 text-sm">
        <p>© {CURRENT_YEAR} San Mateo County Community College District</p>
      </div>
    </footer>
  );
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} bg-gray-50 min-h-screen flex flex-col antialiased`}
      >
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-blue-700 focus:p-2 focus:rounded"
        >
          Skip to main content
        </a>

        <AuthProvider session={session}>
          <ProfileSetupProvider>
            {/* Wrap Navbar in Suspense if it does async work */}
            <Suspense fallback={<div className="h-16" />}>
              <Navbar />
            </Suspense>

            <main
              id="main-content"
              className="w-full max-w-7xl flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-10"
            >
              <section className="bg-white rounded-lg shadow-md p-4 min-h-[400px] flex flex-col">
                {children}
              </section>
            </main>

            <Footer />
            <Toaster />
            
            {/* ARIA live region for announcements */}
            <div
              id="aria-live-region"
              aria-live="assertive"
              aria-atomic="true"
              className="sr-only"
            />
          </ProfileSetupProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
