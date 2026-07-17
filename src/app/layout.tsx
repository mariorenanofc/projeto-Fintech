import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { PWAProvider } from "@/components/pwa-provider";
import { FloatingTools } from "@/components/floating-tools";
import { CookieBanner } from "@/components/cookie-banner";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fintechcasal.com.br"),
  title: "Fintech Casal - Sintonia & Planejamento Financeiro 💛",
  description: "Organize o orçamento do casal, planeje o futuro, acompanhe vencimentos com agenda compartilhada e alcance a prosperidade financeira juntos.",
  openGraph: {
    title: "Fintech Casal - Sintonia & Planejamento Financeiro 💛",
    description: "Organize o orçamento do casal, planeje o futuro, acompanhe vencimentos com agenda compartilhada e alcance a prosperidade financeira juntos.",
    url: "https://www.fintechcasal.com.br",
    siteName: "Fintech Casal",
    images: [
      {
        url: "https://www.fintechcasal.com.br/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fintech Casal Preview",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fintech Casal - Sintonia & Planejamento Financeiro 💛",
    description: "Organize o orçamento do casal, planeje o futuro, acompanhe vencimentos com agenda compartilhada e alcance a prosperidade financeira juntos.",
    images: ["https://www.fintechcasal.com.br/opengraph-image.jpg"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fintech Casal",
  },
  formatDetection: {
    telephone: false,
  },
};


export const viewport: Viewport = {
  themeColor: "#eab308",
  width: "device-width",
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
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 selection:bg-yellow-500 selection:text-zinc-950 animate-fade-in">
        <PWAProvider />
        {children}
        <FloatingTools />
        <CookieBanner />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
