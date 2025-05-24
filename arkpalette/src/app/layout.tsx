import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "我有通行症",
  description: "通行证平铺助手",
  icons: {
    icon: [
      { url: '/ArkPalette/favicon.ico', sizes: 'any' },
      { url: '/ArkPalette/favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: '/ArkPalette/favicon.ico',
    apple: '/ArkPalette/favicon.ico',
  },
  manifest: '/ArkPalette/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
