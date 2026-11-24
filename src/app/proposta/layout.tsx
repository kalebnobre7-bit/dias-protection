import type { Metadata, Viewport } from "next";
import { Hurricane, Inter } from "next/font/google";

import "../globals.css";

const inter = Inter({ subsets: ["latin"], axes: ["opsz"], variable: "--font-inter", display: "swap" });
// Caligrafia das assinaturas do documento
const signature = Hurricane({ subsets: ["latin"], weight: "400", variable: "--font-signature", display: "swap", preload: false });

// Link da proposta para o cliente: fora do site e do painel, nunca indexado
export const metadata: Metadata = {
  title: "Proposta · Dias Protection",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export const viewport: Viewport = { themeColor: "#07090d" };

export default function ProposalLinkLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${signature.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
