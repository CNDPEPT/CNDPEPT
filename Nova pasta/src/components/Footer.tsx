import { STORE_CONFIG } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-[#1a2a44] mt-8 py-4 text-center text-xs text-[#7b8fa8]">
      <div className="neon-line mb-4" />
      <p>&copy; {new Date().getFullYear()} {STORE_CONFIG.name}. Todos os direitos reservados.</p>
      <p className="mt-1 text-[11px] text-[#4a5f7a]">{STORE_CONFIG.slogan}</p>
    </footer>
  );
}
