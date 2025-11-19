import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { Sarpanch } from "next/font/google";

// Configure Server Actions timeout (max 60s on Pro, 10s on Hobby)
export const maxDuration = 60;

// Initialize fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const sarpanch = Sarpanch({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-sarpanch",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Copyscript",
  description:
    "A simple web application for fetching and copying YouTube video transcripts",
  generator: "v0.app",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${sarpanch.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
