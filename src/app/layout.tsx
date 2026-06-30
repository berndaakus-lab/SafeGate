import type { Metadata } from "next";
import { Geist } from "next/font/google";
import RegisterSW from "@/components/RegisterSW";
import InstallBanner from "@/components/InstallBanner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeGate — School Pickup Authorization",
  description: "Secure, digital school pickup authorization for parents, schools, and security guards.",
  manifest: "/manifest.json",
  themeColor: "#1d4ed8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SafeGate",
    startupImage: "/icon-512.png",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <RegisterSW />
        <InstallBanner />
        {children}
      </body>
    </html>
  );
}
