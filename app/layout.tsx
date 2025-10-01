import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Source_Sans_3, Geist } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { SessionRefresher } from "@/components/SessionRefresher";
import { ProfileSetupProvider } from "@/components/ProfileSetupProvider";
import { Toaster } from "@/components/ui/toaster";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import ClarityInit from "@/components/ClarityInit";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { ReactNode, Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-sans",
});

// Strongly typed metadata with richer SEO
export const metadata: Metadata = {
  title: "Faculty Doorcard App",
  description: "Create and manage faculty doorcards",
  applicationName: "Faculty Doorcard",
  manifest: "/manifest.json",
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
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
};

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer className="bg-smccd-blue-900 dark:bg-smccd-blue-950 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center text-smccd-blue-200 text-sm">
          <p>© {CURRENT_YEAR} San Mateo County Community College District</p>
        </div>
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
    <html
      lang="en"
      className={`h-full ${inter.variable} ${sourceSans.variable}`}
    >
      <body
        className={`${geist.className} bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col antialiased`}
      >
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-blue-700 focus:p-2 focus:rounded"
        >
          Skip to main content
        </a>

        <DarkModeProvider>
          <AuthProvider session={session}>
            <SessionRefresher />
            <ProfileSetupProvider>
              {/* Wrap Navbar in Suspense if it does async work */}
              <Suspense fallback={<div className="h-16" />}>
                <Navbar />
              </Suspense>

              {/* Network status banner for offline/slow connection alerts */}
              <NetworkStatusBanner />

              {/* Site Index moved to individual pages that need it */}

              <main id="main-content" className="w-full flex-1">
                {children}
              </main>

              <Footer />
              <Toaster />

              {/* Microsoft Clarity Analytics */}
              <ClarityInit />

              {/* ARIA live region for announcements */}
              <div
                id="aria-live-region"
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
              />
            </ProfileSetupProvider>
          </AuthProvider>
        </DarkModeProvider>
        <Analytics />
      </body>
    </html>
  );
}
