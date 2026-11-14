import Script from 'next/script';
import type { Metadata, Viewport } from "next";
import { Archivo, Public_Sans, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { BrochureShell } from "@/components/layout/BrochureShell";
import "./globals.css";

// Site type (human-made-sites skill, 11/8): Archivo at an expanded width for headings (keeps the wide,
// confident feel of the old Montserrat brand spec without the default look) + Public Sans for reading.
// Replaces the Next.js starter's unused Geist + Arial fallback.
const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const sans = Public_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.arkidentity.com"
  ),
  title: "ARK Identity",
  description: "Discipleship courses, resources, and training from ARK Identity.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ARK Identity",
  },
};

export const viewport: Viewport = {
  themeColor: "#143348",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#143348" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        {/* Inside another app (e.g. Daily DNA's More tab iframes /friday) or ?embed=1: hide site chrome before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(window.self!==window.top||/[?&]embed=1/.test(location.search))document.documentElement.setAttribute('data-embed','')}catch(e){document.documentElement.setAttribute('data-embed','')}",
          }}
        />
      </head>
      <body
        className={`${display.variable} ${sans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <BrochureShell>
              {children}
            </BrochureShell>
            <BottomTabBar />
          </ToastProvider>
        </ThemeProvider>
        {/* Groundwork Note button: only people signed in through Review this site see it. */}
        <Script src="https://groundwork.chat/notes.js" data-site="arkidentity" strategy="afterInteractive" />
      </body>
    </html>
  );
}
