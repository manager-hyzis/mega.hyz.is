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
  title: "Mega da Virada 2025 - Bolão Colaborativo | Gerencie seus Bolões",
  description: "Crie e gerencie bolões colaborativos para a Mega da Virada 2025. Escolha seus números, compartilhe com amigos e aumente suas chances! 🍀",
  keywords: ["Mega da Virada", "Bolão", "Loteria", "Colaborativo", "2025", "Mega Sena"],
  authors: [{ name: "Mega Virada" }],
  creator: "Mega Virada",
  publisher: "Mega Virada",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>🍀</text></svg>",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://mega.hyz.is",
    siteName: "Mega da Virada 2025",
    title: "Mega da Virada 2025 - Bolão Colaborativo",
    description: "Crie e gerencie bolões colaborativos para a Mega da Virada 2025",
    images: [
      {
        url: "https://mega.hyz.is/og.webp",
        width: 1200,
        height: 630,
        alt: "Mega da Virada 2025 - Bolão Colaborativo",
        type: "image/webp",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Mega da Virada 2025 - Bolão Colaborativo",
    description: "Crie e gerencie bolões colaborativos para a Mega da Virada 2025",
    creator: "@megavirada",
    images: ["https://mega.hyz.is/og.webp"]
  },
  alternates: {
    canonical: "https://mega.hyz.is",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
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
