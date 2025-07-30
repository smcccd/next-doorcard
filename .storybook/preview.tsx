import type { Preview } from "@storybook/nextjs";
import React from "react";
import "../app/globals.css";
import { Inter, Source_Sans_3 } from "next/font/google";
import { DarkModeProvider } from "../components/DarkModeProvider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "../components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-sans",
});

// Global decorator to apply styles and providers
const withProviders = (Story: any) => (
  <div
    className={`${inter.variable} ${sourceSans.variable} ${inter.className}`}
  >
    <SessionProvider session={null}>
      <DarkModeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <Story />
          <Toaster />
        </div>
      </DarkModeProvider>
    </SessionProvider>
  </div>
);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#f9fafb",
        },
        {
          name: "dark",
          value: "#111827",
        },
      ],
    },
  },
  decorators: [withProviders],
};

export default preview;
