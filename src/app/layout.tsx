import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ToastProvider } from "@/components/notifications/toast-provider";
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
  icons: {
    icon: [
      {
        url: "/iconcuidou.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: [
      {
        url: "/iconcuidou.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/iconcuidou.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${nunito.variable} ${fredoka.variable} min-h-screen antialiased`}>
        <ToastProvider>
          <SiteHeader />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
