import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { PWAProvider } from "@/components/pwa-provider";
import { FloatingTools } from "@/components/floating-tools";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fintech Casal - Finanças Compartilhadas",
  description: "O Fintech Casal é um aplicativo de organização financeira projetado para ajudar casais a gerenciar orçamentos conjuntos.",
  openGraph: {
    title: "Fintech Casal",
    description: "SaaS financeiro compartilhado e gamificado para casais. Planejem, poupem e joguem juntos pelo seu futuro.",
    url: "https://fintechcasal.com.br",
    siteName: "Fintech Casal",
    images: [
      {
        url: "/opengraph-image.png", // Imagem na pasta public/
        width: 1200,
        height: 630,
        alt: "Fintech Casal Preview",
      },
    ],
    locale: "pt_BR",
    type: "website",
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
      </body>
    </html>
  );
}
