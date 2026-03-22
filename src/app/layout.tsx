import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { I18nProvider } from "@/providers/i18n-provider";
import { PaymentModalProvider } from "@/providers/payment-modal-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AXS Tracker | Premium Habit Tracking",
  description: "Track your habits with style. Premium habit tracking app with dark luxury design.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "AXS Tracker | Premium Habit Tracking",
    description: "Track your habits with style. Premium habit tracking app with dark luxury design.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AXS Tracker" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AXS Tracker | Premium Habit Tracking",
    description: "Track your habits with style.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AXS Tracker",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${cormorant.variable} font-sans antialiased bg-[#0a0a0a] text-[#f5f5f5]`}
      >
        <I18nProvider>
          <QueryProvider>
            <PaymentModalProvider>
              {children}
              <Toaster />
            </PaymentModalProvider>
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
