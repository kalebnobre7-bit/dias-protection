import type { Metadata, Viewport } from "next";
import { Hurricane, Inter } from "next/font/google";

import "../globals.css";

const inter = Inter({ subsets: ["latin"], axes: ["opsz"], variable: "--font-inter", display: "swap" });
// Assinatura digitada nos documentos; sem preload, só baixa quando a proposta abre
const signature = Hurricane({ subsets: ["latin"], weight: "400", variable: "--font-signature", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Painel · Dias Protection",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#07090d" };

// Painel só em português, fora das rotas /pt e /en do site
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${signature.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
