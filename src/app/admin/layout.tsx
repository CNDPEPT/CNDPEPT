"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { STORE_CONFIG } from "@/lib/constants";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't show sidebar on login page
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/admin/pedidos", label: "Pedidos", icon: "📋" },
    { href: "/admin/acessos", label: "Acessos", icon: "🔑" },
    { href: "/admin/clientes", label: "Clientes", icon: "👥" },
    { href: "/admin/produtos", label: "Produtos", icon: "🧪" },
    { href: "/admin/cupons", label: "Cupons", icon: "🏷️" },
    { href: "/admin/frete", label: "Frete", icon: "🚚" },
    { href: "/admin/remetente", label: "Remetente", icon: "📮" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-[#060b18] border-b border-[#1a2a44] px-3 py-2">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center border border-[#00d4ff33] bg-[#0a1628]">
            <span className="text-[#00d4ff] font-bold text-xs">CP</span>
          </div>
          <span className="font-bold text-sm text-[#e0e8f0]">{STORE_CONFIG.name}</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[#7b8fa8] hover:text-[#00d4ff] p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            ) : (
              <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar - desktop always visible, mobile toggleable */}
      <aside className={`${sidebarOpen ? "block" : "hidden"} md:block w-full md:w-52 bg-[#060b18] text-white flex-shrink-0 border-r border-[#1a2a44] md:min-h-screen`}>
        <div className="hidden md:block p-3 border-b border-[#1a2a44]">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#00d4ff33] bg-[#0a1628]">
              <span className="text-[#00d4ff] font-bold text-xs">CP</span>
            </div>
            <div>
              <p className="font-bold text-sm">{STORE_CONFIG.name}</p>
              <p className="text-[11px] text-[#4a5f7a]">Admin</p>
            </div>
          </Link>
        </div>
        <nav className="p-2 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                pathname.startsWith(link.href)
                  ? "bg-[#0a1628] text-[#00d4ff] border border-[#00d4ff33]"
                  : "text-[#7b8fa8] hover:text-[#00d4ff] hover:bg-[#0a1628]"
              }`}
            >
              <span className="text-sm">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1a2a44]">
          <Link href="/home" className="block text-[11px] text-[#4a5f7a] hover:text-[#00d4ff] mb-2">
            ← Ver loja
          </Link>
          <button
            onClick={handleLogout}
            className="text-[11px] text-red-400 hover:text-red-300"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-[#0a0f1e] overflow-auto">
        <div className="p-3 md:p-5">
          {children}
        </div>
      </main>
    </div>
  );
}
