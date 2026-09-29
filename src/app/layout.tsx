import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import RegisterSW from "@/components/RegisterSW";
import InstallBanner from "@/components/InstallBanner";
import AOSInit from "@/components/AOSInit";
import TopProgressBar from "@/components/TopProgressBar";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const siteDescription =
  "Secure, digital school pickup authorization for parents, schools, and security guards in Ghana. QR pickup passes, instant SMS alerts, and a full audit trail.";

export const metadata: Metadata = {
  metadataBase: new URL("https://verifygate.app"),
  title: {
    default: "VerifyGate - School Pickup Authorization",
    template: "%s - VerifyGate",
  },
  description: siteDescription,
  keywords: [
    "school pickup app",
    "school pickup authorization",
    "student pickup verification",
    "school security Ghana",
    "QR code pickup pass",
    "school SMS alerts",
  ],
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "AaZPxO3Oqm2z7QeqmuVvb9j9u7iHpzIGiXXBFg4J-2M",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VerifyGate",
    startupImage: "/icon-512.png",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
    shortcut: "/icon-192.png",
  },
  openGraph: {
    title: "VerifyGate - School Pickup Authorization",
    description: siteDescription,
    url: "/",
    siteName: "VerifyGate",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "VerifyGate",
      },
    ],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "VerifyGate - School Pickup Authorization",
    description: siteDescription,
    images: ["/icon-512.png"],
  },
};

// viewportFit "cover" lets iPhones report the notch/home-bar safe areas, so
// the fixed bottom navs can pad themselves above the home indicator.
// Pinch-zoom is deliberately left enabled for accessibility.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1d4ed8",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VerifyGate",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  description: siteDescription,
  url: "https://verifygate.app",
  areaServed: {
    "@type": "Country",
    name: "Ghana",
  },
  offers: {
    "@type": "Offer",
    priceCurrency: "GHS",
    availability: "https://schema.org/InStock",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={`${geist.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full bg-slate-50 text-slate-900" suppressHydrationWarning>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <TopProgressBar />
        <RegisterSW />
        <InstallBanner />
        <AOSInit />
        {children}
      </body>
    </html>
  );
}
