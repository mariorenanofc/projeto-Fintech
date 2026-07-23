import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { PWAProvider } from "@/components/pwa-provider";
import { FloatingTools } from "@/components/floating-tools";
import { CookieBanner } from "@/components/cookie-banner";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundParallaxElements } from "@/components/ui/background-parallax-elements";
import { SmoothScrollProvider } from "@/components/ui/smooth-scroll-provider";

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
    default: "Fintech Casal - Organização Financeira para Casal & Orçamento 💛",
    template: "%s | Fintech Casal"
  },
  description: "O melhor sistema de organização financeira para casal. Controle orçamento do casal, contas fixas, faturas, conciliação e despesas com agenda compartilhada.",
  keywords: [
    "organização financeira para casal",
    "sistema financeiro para casal",
    "conciliação financeira para casal",
    "finanças de casal",
    "planejamento financeiro casal",
    "finanças de casal",
    "planejamento financeiro para casal",
    "app de finanças para casal",
    "organização financeira para casais",
    "aplicativo de organização financeira para casal",
    "aplicativo de finanças para casais",
    "fintech casal",
    "Fintech Casal",
    "Fin Tech Casal",
    "Fintech Casal App",
    "Fin Tech Casal App",
    "FintechCasal",
    "aplicativo de finanças para casais",
    "organização financeira para casal lgpd",
    "simulador de renegociação de dividas",
    "simulador de dividas bancarias",
    "simulador de dividas",
    "simulador de dividas compartilhado",
    "simulador de dividas casal",
    "calculadora de renegociação de dividas",
    "calculadora de dividas",
    "calculadora de dividas bancarias",
    "calculadora de dividas compartilhado",
    "calculadora de dividas casal",
    "orçamento conjugal",
    "controle financeiro familiar",
    "renegociação de dívidas",
    "simulador de dívidas bancárias",
    "cartão de crédito casal",
    "fintech de casal",
    "agenda financeira compartilhada",
    "finanças compartilhadas casal",
    "gestão financeira para casais",
    "planilha de finanças casal",
    "planejamento financeiro conjugal"
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
    title: "Fintech Casal - Organização Financeira para Casal & Orçamento 💛",
    description: "O melhor sistema de organização financeira para casal. Controle orçamento do casal, contas fixas, faturas, conciliação e despesas com agenda compartilhada.",
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
    title: "Fintech Casal - Organização Financeira para Casal & Orçamento 💛",
    description: "O melhor sistema de organização financeira para casal. Controle orçamento do casal, contas fixas, faturas, conciliação e despesas com agenda compartilhada.",
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
      "@type": "WebSite",
      "@id": "https://fintechcasal.com.br/#website",
      "url": "https://fintechcasal.com.br",
      "name": "Fintech Casal",
      "description": "O melhor sistema de organização financeira para casal e planejamento conjugal.",
      "publisher": {
        "@id": "https://fintechcasal.com.br/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://fintechcasal.com.br/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "WebApplication",
      "@id": "https://fintechcasal.com.br/#webapp",
      "url": "https://fintechcasal.com.br",
      "name": "Fintech Casal - Sistema Financeiro para Casal",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "description": "Aplicativo de organização financeira para casal, planejamento de orçamento conjugal, conciliação financeira, simulador de renegociação de dívidas e sincronização com Google Calendar.",
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
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://fintechcasal.com.br/#nav-onboarding",
      "name": "App de Planejamento Financeiro para Casais",
      "description": "Planeje o orçamento do casal, parcele contas e defina metas de reserva.",
      "url": "https://fintechcasal.com.br/onboarding"
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://fintechcasal.com.br/#nav-privacidade",
      "name": "Política de Privacidade & Segurança LGPD",
      "description": "Segurança e isolamento de dados com criptografia de ponta a ponta.",
      "url": "https://fintechcasal.com.br/politica-de-privacidade"
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://fintechcasal.com.br/#nav-termos",
      "name": "Termos de Uso & Serviços",
      "description": "Regras de utilização do aplicativo de finanças compartilhadas.",
      "url": "https://fintechcasal.com.br/termos-de-uso"
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#0A0A0A] text-zinc-50 selection:bg-yellow-500 selection:text-zinc-950 animate-fade-in relative">
        <SmoothScrollProvider>
          <BackgroundParallaxElements />
          <PWAProvider />
          {children}
          <FloatingTools />
          <CookieBanner />
          <Toaster position="top-right" />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
