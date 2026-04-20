"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { STORE_CONFIG } from "@/lib/constants";

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="bg-[#060b18]/95 backdrop-blur-md border-b border-[#1a2a44] sticky top-0 z-50">
      <div className="neon-line" />
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md flex items-center justify-center border border-[#00d4ff33] bg-[#0a1628] shadow-[0_0_10px_rgba(0,212,255,0.2)]">
            <span className="text-[#00d4ff] font-bold text-sm">CP</span>
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-tight text-[#e0e8f0] group-hover:text-[#00d4ff] transition-colors">
              {STORE_CONFIG.name}
            </h1>
            <p className="text-[10px] md:text-xs text-[#7b8fa8] uppercase tracking-widest hidden sm:block">{STORE_CONFIG.slogan}</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium">
          <Link href="/home" className="text-[#7b8fa8] hover:text-[#00d4ff] transition-colors hidden sm:block">
            Catálogo
          </Link>
          <Link href="/meus-pedidos" className="text-[#7b8fa8] hover:text-[#00d4ff] transition-colors">
            <span className="hidden sm:inline">Meus Pedidos</span>
            <span className="sm:hidden">Pedidos</span>
          </Link>
          <Link
            href="/carrinho"
            className="relative flex items-center gap-2 text-[#7b8fa8] hover:text-[#00d4ff] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            <span className="hidden sm:inline">Carrinho</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-[#00d4ff] text-[#060b18] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_6px_rgba(0,212,255,0.5)]">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
