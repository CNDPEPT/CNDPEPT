"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, BRAZILIAN_STATES, maskPhone, maskCEP, isValidPhoneFormat, isValidCEPFormat, isValidEmailFormat } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "address" | "shipping" | "review" | "pix";

interface CustomerData {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart, couponCode, couponDiscount } = useCart();
  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pre-selected shipping from cart page
  const preSelectedShipping = searchParams.get("shipping") as "sedex" | "transportadora" | null;

  // Customer data
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Shipping
  const [shippingType, setShippingType] = useState<"sedex" | "transportadora">("sedex");
  const [shippingRates, setShippingRates] = useState<{ sedex: number; transportadora: number }>({ sedex: 0, transportadora: 0 });

  // Track original state to detect address changes
  const [originalState, setOriginalState] = useState("");

  // Order result
  const [orderNumber, setOrderNumber] = useState("");
  const [pixPayload, setPixPayload] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [totalValue, setTotalValue] = useState(0);

  const shippingValue = state ? shippingRates[shippingType] : 0;
  const total = subtotal - couponDiscount + shippingValue;

  // Auto-load customer on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("customer_email");
    if (!storedEmail) {
      router.push("/login");
      return;
    }
    fetch("/api/customers/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: storedEmail }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.exists && data.customer) {
          const c = data.customer as CustomerData;
          setCustomer(c);
          setFullName(c.fullName);
          setCpf(c.cpf);
          setEmail(c.email);
          setPhone(c.phone);
          setZipCode(c.zipCode);
          setStreet(c.street);
          setNumber(c.number);
          setComplement(c.complement || "");
          setDistrict(c.district);
          setCity(c.city);
          setState(c.state);
          setOriginalState(c.state);
        } else {
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  // Fetch shipping rates when state changes
  useEffect(() => {
    if (!state) return;
    fetch(`/api/shipping?state=${state}`)
      .then((r) => r.json())
      .then((data) => {
        setShippingRates({ sedex: data.sedex || 0, transportadora: data.transportadora || 0 });
        // Auto-select shipping if pre-selected from cart
        if (preSelectedShipping && (preSelectedShipping === "sedex" || preSelectedShipping === "transportadora")) {
          setShippingType(preSelectedShipping);
        }
      })
      .catch(() => setShippingRates({ sedex: 0, transportadora: 0 }));
  }, [state, preSelectedShipping]);

  // Create order
  async function createOrder() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf,
          fullName,
          email,
          phone,
          zipCode,
          street,
          number,
          complement,
          district,
          city,
          state,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            dosage: i.dosage || "",
          })),
          shippingType,
          couponCode: couponCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar pedido");
        setLoading(false);
        return;
      }
      setOrderNumber(data.orderNumber);
      setPixPayload(data.pixPayload);
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setTotalValue(data.totalValue);
      clearCart();
      setStep("pix");
    } catch {
      setError("Erro ao criar pedido");
    }
    setLoading(false);
  }

  if (loading && step !== "pix") {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-[#7b8fa8]">Carregando dados...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (items.length === 0 && step !== "pix") {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-base font-bold mb-3">Carrinho vazio</h2>
          <p className="text-[#7b8fa8] mb-4 text-xs">Adicione produtos antes de finalizar.</p>
          <a href="/home" className="btn-primary">Ver Catálogo</a>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <h2 className="text-base md:text-lg font-bold mb-3">Checkout</h2>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 sm:gap-2 mb-3 md:mb-4 text-xs">
          {(["address", "shipping", "review", "pix"] as Step[]).map((s, i) => {
            const labels = ["Endereço", "Frete", "Resumo", "PIX"];
            const stepOrder = ["address", "shipping", "review", "pix"];
            const currentIdx = stepOrder.indexOf(step);
            return (
              <div key={s} className="flex items-center gap-2 sm:gap-2">
                <div className="flex flex-col items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step === s ? "bg-[#00d4ff] text-[#060b18]" :
                    (currentIdx > i ? "bg-[#052e16] text-[#4ade80] border border-[#166534]" : "bg-[#0a1628] text-[#7b8fa8] border border-[#1a2a44]")
                  }`}>
                    {currentIdx > i ? "✓" : i + 1}
                  </span>
                  <span className="text-[10px] text-[#7b8fa8] mt-0.5">{labels[i]}</span>
                </div>
                {i < 3 && <span className="w-4 sm:w-8 h-px bg-[#1a2a44] mb-4" />}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-3 py-2 rounded-md mb-3 text-xs">
            {error}
          </div>
        )}

        {/* Step 1: Confirm Address */}
        {step === "address" && (
          <div className="card-tech p-3 md:p-4">
            <h3 className="font-semibold text-base md:text-lg mb-1">Confirme seu endereço de entrega</h3>
            <p className="text-xs text-[#7b8fa8] mb-3">Dados carregados do seu cadastro. Modifique se necessário.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Nome completo</label>
                <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">E-mail</label>
                <input className="input-field bg-[#0a1628]/50" value={email} readOnly />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Telefone</label>
                <input className="input-field" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">CEP</label>
                <input className="input-field" placeholder="00000-000" value={zipCode} onChange={(e) => setZipCode(maskCEP(e.target.value))} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Rua</label>
                <input className="input-field" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Número</label>
                <input className="input-field" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Complemento</label>
                <input className="input-field" value={complement} onChange={(e) => setComplement(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Bairro</label>
                <input className="input-field" value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Cidade</label>
                <input className="input-field" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Estado</label>
                <select className="input-field" value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Selecione</option>
                  {BRAZILIAN_STATES.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-between">
              <a href="/carrinho" className="btn-secondary">Voltar ao Carrinho</a>
              <button
                onClick={() => {
                  if (!fullName || !phone || !zipCode || !street || !number || !district || !city || !state) {
                    setError("Preencha todos os campos obrigatórios");
                    return;
                  }
                  if (!isValidPhoneFormat(phone)) {
                    setError("Telefone deve ter 10 ou 11 dígitos. Ex: (11) 99999-9999");
                    return;
                  }
                  if (!isValidCEPFormat(zipCode)) {
                    setError("CEP deve ter 8 dígitos. Ex: 01234-567");
                    return;
                  }
                  if (!isValidEmailFormat(email)) {
                    setError("E-mail inválido. Verifique o formato.");
                    return;
                  }
                  setError("");
                  // If state didn't change and shipping was pre-selected from cart, skip to review
                  if (preSelectedShipping && state === originalState) {
                    setStep("review");
                  } else {
                    setStep("shipping");
                  }
                }}
                className="btn-primary"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Shipping */}
        {step === "shipping" && (
          <div className="card-tech p-4">
            <h3 className="font-semibold text-base mb-1">Escolha o tipo de frete</h3>
            <p className="text-xs text-[#7b8fa8] mb-3">
              Entrega para <strong className="text-[#e0e8f0]">{city}/{state}</strong>
            </p>
            <div className="space-y-2">
              <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                shippingType === "sedex" ? "border-[#00d4ff] bg-[#00d4ff08]" : "border-[#1a2a44] hover:border-[#00d4ff44]"
              }`}>
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingType === "sedex"}
                  onChange={() => setShippingType("sedex")}
                  className="accent-[#00d4ff]"
                />
                <div className="flex-1">
                  <span className="font-medium text-[#e0e8f0] text-xs">SEDEX</span>
                  <p className="text-[11px] text-[#7b8fa8]">Entrega expressa via Correios</p>
                </div>
                <span className="font-bold text-[#00d4ff]">{formatCurrency(shippingRates.sedex)}</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                shippingType === "transportadora" ? "border-[#00d4ff] bg-[#00d4ff08]" : "border-[#1a2a44] hover:border-[#00d4ff44]"
              }`}>
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingType === "transportadora"}
                  onChange={() => setShippingType("transportadora")}
                  className="accent-[#00d4ff]"
                />
                <div className="flex-1">
                  <span className="font-medium text-[#e0e8f0] text-xs">Transportadora</span>
                  <p className="text-[11px] text-[#7b8fa8]">Entrega econômica</p>
                </div>
                <span className="font-bold text-[#00d4ff]">{formatCurrency(shippingRates.transportadora)}</span>
              </label>
            </div>
            <div className="mt-3 flex justify-between">
              <button onClick={() => setStep("address")} className="btn-secondary">Voltar</button>
              <button onClick={() => { setError(""); setStep("review"); }} className="btn-primary">Continuar</button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === "review" && (
          <div className="card-tech p-4">
            <h3 className="font-semibold text-base mb-2">Resumo do Pedido</h3>

            <div className="space-y-2">
              <div>
                <h4 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Endereço de entrega</h4>
                <p className="text-xs">{fullName}</p>
                <p className="text-xs">{street}, {number} {complement ? `- ${complement}` : ""}</p>
                <p className="text-xs">{district} — {city}/{state} — CEP: {zipCode}</p>
                <p className="text-xs text-[#7b8fa8]">{email} • {phone}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Itens</h4>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.dosage}`} className="flex justify-between text-xs">
                      <span>{item.name}{item.dosage ? ` (${item.dosage})` : ""} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#1a2a44] pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Frete ({shippingType === "sedex" ? "SEDEX" : "Transportadora"})</span>
                  <span>{formatCurrency(shippingValue)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-xs text-[#4ade80]">
                    <span>Desconto ({couponCode})</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1 border-t border-[#1a2a44]">
                  <span>Total</span>
                  <span className="text-[#00d4ff]">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-between">
              <button onClick={() => setStep("shipping")} className="btn-secondary">Voltar</button>
              <button onClick={createOrder} className="btn-primary" disabled={loading}>
                {loading ? "Criando pedido..." : "Pagar com PIX"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: PIX */}
        {step === "pix" && (
          <div className="card-tech p-4 text-center">
            <div className="w-6 h-6 bg-[#052e16] border border-[#166534] rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-base text-[#4ade80]">✓</span>
            </div>
            <h3 className="font-semibold text-base mb-1 text-[#e0e8f0]">Pedido criado com sucesso!</h3>
            <p className="text-[#7b8fa8] text-xs mb-1">Número do pedido: <strong className="text-[#e0e8f0]">{orderNumber}</strong></p>
            <p className="text-[#7b8fa8] text-xs mb-3">Valor total: <strong className="text-[#00d4ff]">{formatCurrency(totalValue)}</strong></p>

            <div className="bg-[#0a1628] border border-[#1a2a44] rounded-lg p-3 max-w-sm mx-auto mb-3">
              <h4 className="font-semibold mb-2 text-[#e0e8f0] text-xs">Pague via PIX</h4>
              {qrCodeDataUrl && (
                <img src={qrCodeDataUrl} alt="QR Code PIX" className="w-32 h-32 mx-auto mb-2 rounded-lg" />
              )}
              <p className="text-[11px] text-[#7b8fa8] mb-1">Ou copie o código PIX:</p>
              <div className="bg-[#060b18] border border-[#1a2a44] rounded p-1 text-[11px] break-all mb-2 text-[#7b8fa8]">
                {pixPayload}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(pixPayload)}
                className="btn-secondary text-xs"
              >
                Copiar código PIX
              </button>
            </div>

            <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-3 text-xs text-amber-300 mb-3">
              <p className="font-semibold mb-1">Importante</p>
              <p>Realize o pagamento exatamente no valor de <strong>{formatCurrency(totalValue)}</strong>.</p>
              <p>Após pagar, envie o comprovante na área &quot;Meus Pedidos&quot;.</p>
            </div>

            <div className="flex justify-center gap-2">
              <a href="/meus-pedidos" className="btn-primary">
                Ver Meus Pedidos
              </a>
              <a href="/home" className="btn-secondary">
                Voltar ao Catálogo
              </a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
