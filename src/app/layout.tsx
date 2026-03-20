import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ThemeProvider } from "@/lib/theme-context";
import { DonationBanner } from "@/components/donation-banner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFD700",
};

export const metadata: Metadata = {
  verification: {
    google: "QcmIh2RbdJ7kU7Qq9x2WgwK9-IDHN2kPpNYWkEroqow",
  },
  title: {
    default: "Meta do Milhão | Controle Financeiro Familiar Gratuito",
    template: "%s | Meta do Milhão",
  },
  description: "Controle financeiro familiar 100% gratuito. Gerencie gastos, receitas, orçamentos e metas da sua família. Dashboard com gráficos, categorias personalizáveis, exportação PDF/Excel e app instalável.",
  keywords: [
    "controle financeiro",
    "controle financeiro familiar",
    "gestão financeira",
    "planejamento financeiro",
    "controle de gastos",
    "organizar finanças",
    "finanças pessoais",
    "finanças da família",
    "orçamento familiar",
    "orçamento doméstico",
    "controle de despesas",
    "planilha de gastos",
    "app financeiro gratuito",
    "meta financeira",
    "investimentos",
    "economia doméstica",
    "educação financeira",
    "dinheiro",
    "renda familiar",
    "cartão de crédito controle",
  ],
  authors: [{ name: "Bruno Lanzo" }],
  creator: "Bruno Lanzo",
  metadataBase: new URL("https://metadomilhao.com.br"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://metadomilhao.com.br",
    siteName: "Meta do Milhão",
    title: "Meta do Milhão | Controle Financeiro Familiar Gratuito",
    description: "Gerencie gastos e receitas da sua família em um só lugar. 100% gratuito, com dashboard, gráficos, metas e categorias personalizáveis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Meta do Milhão - Controle Financeiro Familiar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meta do Milhão | Controle Financeiro Familiar Gratuito",
    description: "Gerencie gastos e receitas da sua família em um só lugar. 100% gratuito.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meta do Milhão",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-48.svg", type: "image/svg+xml", sizes: "48x48" },
    ],
    apple: "/icons/icon-192.svg",
  },
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <DonationBanner />
          {children}
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
