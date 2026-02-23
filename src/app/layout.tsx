import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cuidou - Marketplace de cuidado",
  description:
    "Marketplace para conectar famílias a babás e cuidadoras de idosos, sem intermediação de pagamento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${nunito.variable} ${fredoka.variable} antialiased`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
