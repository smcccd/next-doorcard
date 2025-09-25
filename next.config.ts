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
        "'unsafe-eval'", // Required for Next.js runtime in some browsers
        // Vercel Analytics and Live Features
        "https://va.vercel-scripts.com",
        "https://vercel.live",
        // Microsoft Clarity (official CSP requirements)
        "https://www.clarity.ms",
        "https://*.clarity.ms",
        "https://c.bing.com",
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
        "data:", // For inline CSS data URLs
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
        // Microsoft Clarity (official CSP requirements)
        "https://www.clarity.ms",
        "https://*.clarity.ms",
        "https://c.bing.com",
      ],
      "connect-src": [
        "'self'",
        // OneLogin SSO endpoints
        "https://smccd.onelogin.com",
        // Vercel Analytics and Live Features
        "https://vitals.vercel-insights.com",
        "https://vercel.live",
        "wss://vercel.live",
        // Microsoft Clarity (official CSP requirements)
        "https://www.clarity.ms",
        "https://*.clarity.ms",
        "https://c.bing.com",
        // Sentry
        "https://o4509746708611072.ingest.us.sentry.io",
        // Development hot reload
        ...(isDevelopment
          ? ["ws://localhost:3000", "http://localhost:3000"]
          : []),
      ],
      "frame-src": [
        // OneLogin iframe for SSO
        "https://smccd.onelogin.com",
        // Vercel Live features
        "https://vercel.live",
      ],
      "worker-src": [
        "'self'",
        "blob:", // For Next.js service workers and web workers
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
  // Sentry organization and project configuration
  org: "smcccd",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Modern sourcemaps configuration (2025 best practices)
  sourcemaps: {
    disable: false,
    assets: ["**/*.js", "**/*.js.map"],
    ignore: ["**/node_modules/**"],
    deleteSourcemapsAfterUpload: true, // Security: remove source maps after upload
  },

  // Release configuration
  release: {
    create: true,
    finalize: true,
  },

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Route browser requests to Sentry through Next.js rewrite (circumvent ad-blockers)
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Disable internal telemetry to avoid info messages
  telemetry: false,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
});
