import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Production optimizations
  reactStrictMode: true,

  // ESLint configuration for CI/CD
  eslint: {
    // Only run linting during development
    ignoreDuringBuilds: process.env.CI === "true",
  },

  // Environment-specific configs
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Suppress the serialization warnings
    config.infrastructureLogging = {
      level: "error",
    };

    // Optimize cache settings
    if (config.cache && !isServer) {
      config.cache = {
        type: "filesystem",
        compression: "gzip",
      };
    }

    return config;
  },

  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const isProduction = process.env.NODE_ENV === "production";

    // Base CSP directives that work for all environments
    const cspDirectives = {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        // NextAuth and Next.js chunks
        "'unsafe-inline'", // Required for Next.js dev and some components
        // Vercel Analytics and Live Features
        "https://va.vercel-scripts.com",
        "https://vercel.live",
        // Microsoft Clarity
        "https://www.clarity.ms",
        // Sentry
        "https://js.sentry-cdn.com",
        // OneLogin domains for SSO
        "https://smccd.onelogin.com",
        // Development hot reload
        ...(isDevelopment ? ["'unsafe-eval'"] : []),
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS and inline styles
        "https://fonts.googleapis.com",
      ],
      "font-src": [
        "'self'",
        "https://fonts.gstatic.com",
        "data:", // For base64 encoded fonts
      ],
      "img-src": [
        "'self'",
        "data:", // For base64 images and Next.js optimized images
        "blob:", // For canvas-generated images (html2canvas)
        // User avatars and external images
        "https:",
        // OneLogin profile pictures
        "https://smccd.onelogin.com",
        // Microsoft Clarity
        "https://www.clarity.ms",
      ],
      "connect-src": [
        "'self'",
        // OneLogin SSO endpoints
        "https://smccd.onelogin.com",
        // Vercel Analytics and Live Features
        "https://vitals.vercel-insights.com",
        "https://vercel.live",
        "wss://vercel.live",
        // Microsoft Clarity
        "https://www.clarity.ms",
        // Sentry
        "https://o4507609983934464.ingest.us.sentry.io",
        // Development hot reload
        ...(isDevelopment
          ? ["ws://localhost:3000", "http://localhost:3000"]
          : []),
      ],
      "frame-src": [
        // OneLogin iframe for SSO
        "https://smccd.onelogin.com",
      ],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": [
        "'self'",
        // OneLogin form submissions
        "https://smccd.onelogin.com",
      ],
      "frame-ancestors": ["'none'"], // Equivalent to X-Frame-Options: DENY
      "upgrade-insecure-requests": isProduction ? [] : undefined,
    };

    // Convert CSP object to string
    const csp = Object.entries(cspDirectives)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (Array.isArray(value) && value.length === 0) {
          return key;
        }
        return `${key} ${Array.isArray(value) ? value.join(" ") : value}`;
      })
      .join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy - Comprehensive protection against XSS, injection attacks
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          // HTTP Strict Transport Security - Force HTTPS in production
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
          // X-Frame-Options - Prevent clickjacking (backup for CSP frame-ancestors)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // X-Content-Type-Options - Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer Policy - Control referrer information leakage
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // X-XSS-Protection - Legacy XSS protection (modern browsers use CSP)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Permissions Policy - Control browser feature access
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=()",
              "usb=()",
              "magnetometer=()",
              "gyroscope=()",
              "accelerometer=()",
              "ambient-light-sensor=()",
              "autoplay=(self)",
              "encrypted-media=(self)",
              "fullscreen=(self)",
              "picture-in-picture=(self)",
            ].join(", "),
          },
          // Cross-Origin Embedder Policy - Enable cross-origin isolation
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          // Cross-Origin Opener Policy - Prevent cross-origin window access
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          // Cross-Origin Resource Policy - Control cross-origin resource sharing
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },

  // Optimize images and assets
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // Production logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports (removed @prisma/client to avoid conflict)
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // External packages for serverless functions
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "smcccd",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
