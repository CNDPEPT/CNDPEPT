"use client";

import Link from "next/link";
import { STORE_CONFIG } from "@/lib/constants";

const cards = [
  {
    href: "/admin/pedidos",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
    title: "Pedidos",
    description: "Gerencie pedidos, altere status e adicione rastreio",
    color: "from-[#00d4ff] to-[#00b4d8]",
  },
  {
    href: "/admin/clientes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Clientes",
    description: "Visualize, edite e gerencie clientes cadastrados",
    color: "from-[#a78bfa] to-[#7c3aed]",
  },
  {
    href: "/admin/produtos",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: "Produtos",
    description: "Cadastre, edite produtos e controle estoque",
    color: "from-[#34d399] to-[#059669]",
  },
  {
    href: "/admin/cupons",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
        <path d="M2 8h20v4H2z" />
        <path d="M12 2v2" />
        <path d="M12 8v12" />
        <path d="M8 2l4 4 4-4" />
      </svg>
    ),
    title: "Cupons",
    description: "Crie e gerencie cupons de desconto",
    color: "from-[#f59e0b] to-[#d97706]",
  },
  {
    href: "/admin/frete",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Frete",
    description: "Configure valores de frete por estado",
    color: "from-[#f472b6] to-[#db2777]",
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 border border-[#00d4ff33] bg-[#0a1628] shadow-[0_0_30px_rgba(0,212,255,0.15)]">
          <span className="text-[#00d4ff] font-bold text-sm">CP</span>
        </div>
        <h1 className="text-base font-bold text-[#e0e8f0] mb-1">{STORE_CONFIG.name}</h1>
        <p className="text-xs text-[#7b8fa8]">Painel Administrativo</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-w-5xl w-full px-2 md:px-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group card-tech p-3 md:p-4 flex flex-col items-center text-center hover:border-[#00d4ff44] transition-all duration-300"
          >
            <div
              className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center mb-1.5 md:mb-2 bg-gradient-to-br ${card.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              {card.icon}
            </div>
            <h2 className="text-sm md:text-base font-bold text-[#e0e8f0] mb-0.5 md:mb-1 group-hover:text-[#00d4ff] transition-colors">
              {card.title}
            </h2>
            <p className="text-xs text-[#7b8fa8] hidden md:block">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
