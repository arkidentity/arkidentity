import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { BrochureShell } from "@/components/layout/BrochureShell";
import { CreedCardsFAB } from "@/components/CreedCardsFAB";
import { EncouragementToast } from "@/components/EncouragementToast";
import { ChallengeNudge } from "@/components/ChallengeNudge";
import "./globals.css";
import "../styles/prayer.css";
import "../styles/community.css";
import "../styles/creed-cards.css";
import "../styles/encouragements.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARK Identity",
  description: "Discipleship tools that naturally multiply — courses, journal, prayer, and community.",
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
    <html lang="en">
      <head>
        <meta name="theme-color" content="#143348" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <BrochureShell>
              {children}
            </BrochureShell>
            <BottomTabBar />
            <CreedCardsFAB />
            <EncouragementToast />
            <ChallengeNudge />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
