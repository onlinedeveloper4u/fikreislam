import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: "فکر اسلام | اسلامی کتب، آڈیو اور ویڈیو لائبریری",
  description: "مستند اسلامی مواد دریافت کریں جس میں کتب، قرآنی تلاوت، خطبات اور تعلیمی ویڈیوز شامل ہیں۔",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-background font-urdu antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
