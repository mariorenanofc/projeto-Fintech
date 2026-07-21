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
  display: "swap",
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fintechcasal.com.br"),
  title: {
    default: "Fintech Casal - Sintonia & Planejamento Financeiro 💛",
    template: "%s | Fintech Casal"
  },
  description: "Organize o orçamento do casal, planeje o futuro, acompanhe vencimentos com agenda compartilhada e alcance a prosperidade financeira juntos.",
  keywords: [
    "finanças de casal",
    "planejamento financeiro casal",
    "aplicativo de finanças para casais",
    "orçamento conjugal",
    "controle financeiro familiar",
    "renegociação de dívidas",
    "simulador de dívidas bancárias",
    "cartão de crédito casal",
    "fintech de casal",
    "agenda financeira compartilhada"
  ],
  authors: [{ name: "Fintech Casal Team", url: "https://fintechcasal.com.br" }],
  creator: "Fintech Casal",
  publisher: "Fintech Casal",
  alternates: {
    canonical: "https://fintechcasal.com.br",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification-token",
  },
  openGraph: {
    title: "Fintech Casal - Sintonia & Planejamento Financeiro 💛",
    description: "Organize o orçamento do casal, planeje o futuro, acompanhe vencimentos com agenda compartilhada e alcance a prosperidade financeira juntos.",
    url: "https://fintechcasal.com.br",
    siteName: "Fintech Casal",
    images: [
      {
        url: "https://fintechcasal.com.br/opengraph-image.jpg",
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
    images: ["https://fintechcasal.com.br/opengraph-image.jpg"],
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

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://fintechcasal.com.br/#webapp",
      "url": "https://fintechcasal.com.br",
      "name": "Fintech Casal",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "description": "Aplicativo de organização financeira conjugal, planejamento de orçamento do casal, simulador de renegociação de dívidas e sincronização com Google Calendar.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BRL"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://fintechcasal.com.br/#organization",
      "name": "Fintech Casal",
      "url": "https://fintechcasal.com.br",
      "logo": "https://fintechcasal.com.br/icon-512.png"
    }
  ]
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
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
