import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { NotFoundScreen } from "@/components/site/NotFoundScreen";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], axes: ["opsz"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "404 · Dias Protection",
  robots: { index: false, follow: true },
};

export const viewport: Viewport = { themeColor: "#07090d" };

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-dvh">
        <NotFoundScreen />
      </body>
    </html>
  );
}
