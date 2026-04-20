"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { STORE_CONFIG, BRAZILIAN_STATES, maskCPF, maskPhone, maskCEP, isValidCPFFormat, isValidEmailFormat, isValidPhoneFormat, isValidCEPFormat } from "@/lib/constants";

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("customer_id");
    const email = localStorage.getItem("customer_email");
    if (!id || !email) {
      router.replace("/login");
      return;
    }
    setCustomerId(id);
    setCustomerEmail(email);
  }, [router]);

  async function handleCEPBlur() {
    const cleanCep = zipCode.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setDistrict(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } catch {
      // ignore CEP lookup errors
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidCPFFormat(cpf)) {
      setError("CPF deve ter 11 d\u00edgitos.");
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      setError("Preencha todos os campos obrigat\u00f3rios.");
      return;
    }
    if (!isValidPhoneFormat(phone)) {
      setError("Telefone deve ter 10 ou 11 d\u00edgitos.");
      return;
    }
    if (!zipCode || !street || !number || !district || !city || !state) {
      setError("Preencha o endere\u00e7o completo.");
      return;
    }
    if (!isValidCEPFormat(zipCode)) {
      setError("CEP deve ter 8 d\u00edgitos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customerId,
          fullName: fullName.trim(),
          cpf: cpf.replace(/\D/g, ""),
          phone: phone.replace(/\D/g, ""),
          zipCode: zipCode.replace(/\D/g, ""),
          street,
          number,
          complement,
          district,
          city,
          state,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar cadastro.");
        return;
      }

      const customer = await res.json();
      localStorage.setItem("customer_name", customer.fullName);
      localStorage.setItem("customer_state", customer.state || "");
      router.push("/home");
    } catch {
      setError("Erro de conex\u00e3o. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#0d1525] border border-[#1a2a44] text-[#e0e8f0] placeholder-[#4a5f7a] focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all duration-200 text-xs";
  const labelClass = "block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1";

  if (!customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#7b8fa8] text-sm">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#00d4ff]/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center border border-[#00d4ff33] bg-[#0a1628] shadow-[0_0_15px_rgba(0,212,255,0.15)]">
            <span className="text-[#00d4ff] font-bold text-xs">CP</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-[#e0e8f0]">{STORE_CONFIG.name}</h1>
            <p className="text-[11px] text-[#7b8fa8] uppercase tracking-[0.2em]">{STORE_CONFIG.slogan}</p>
          </div>
        </div>

        <div className="card-tech p-4">
          <div className="mb-3">
            <h2 className="text-base font-bold text-[#e0e8f0] mb-1">Complete seu cadastro</h2>
            <p className="text-xs text-[#7b8fa8]">
              Logado como <strong className="text-[#00d4ff]">{customerEmail}</strong>. Preencha seus dados para acessar o cat\u00e1logo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className={labelClass}>Nome completo *</label>
                <input id="fullName" type="text" autoFocus required placeholder="Seu nome completo"
                  value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="cpf" className={labelClass}>CPF *</label>
                <input id="cpf" type="text" required placeholder="000.000.000-00"
                  value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Telefone *</label>
                <input id="phone" type="text" required placeholder="(00) 00000-0000"
                  value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} className={inputClass} />
              </div>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#1a2a44]" />
              <span className="text-[10px] text-[#4a5f7a] uppercase tracking-wider">Endere\u00e7o</span>
              <div className="flex-1 h-px bg-[#1a2a44]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="zipCode" className={labelClass}>CEP *</label>
                <input id="zipCode" type="text" required placeholder="00000-000"
                  value={zipCode} onChange={(e) => setZipCode(maskCEP(e.target.value))} onBlur={handleCEPBlur} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="street" className={labelClass}>Rua *</label>
                <input id="street" type="text" required placeholder="Nome da rua"
                  value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="number" className={labelClass}>N\u00famero *</label>
                <input id="number" type="text" required placeholder="N\u00ba"
                  value={number} onChange={(e) => setNumber(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="complement" className={labelClass}>Complemento</label>
                <input id="complement" type="text" placeholder="Apto, bloco..."
                  value={complement} onChange={(e) => setComplement(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="district" className={labelClass}>Bairro *</label>
                <input id="district" type="text" required placeholder="Bairro"
                  value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>Cidade *</label>
                <input id="city" type="text" required placeholder="Cidade"
                  value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>Estado *</label>
                <select id="state" required value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                  <option value="">Selecione</option>
                  {BRAZILIAN_STATES.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2 rounded-lg font-semibold text-xs transition-all duration-200
                bg-gradient-to-r from-[#00b4d8] to-[#00d4ff] text-[#060b18]
                hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-[1.01]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              {loading ? "Salvando..." : "Salvar e acessar cat\u00e1logo"}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-[#4a5f7a] text-center mt-3">
          Seus dados s\u00e3o protegidos e usados apenas para processar pedidos.
        </p>
      </div>
    </div>
  );
}