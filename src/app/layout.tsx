import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "CND pepts — Comercial de Produtos Bioquímicos",
  description: "Peptídeos de alta pureza para pesquisa científica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#060b18] text-[#e0e8f0]">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
