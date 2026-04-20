"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/constants";
import Link from "next/link";

export default function CarrinhoPage() {
  const { items, updateQuantity, removeItem, subtotal, couponCode, couponDiscount, setCoupon, clearCoupon } = useCart();
  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Shipping
  const [customerState, setCustomerState] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [shippingRates, setShippingRates] = useState<{ sedex: number; transportadora: number }>({ sedex: 0, transportadora: 0 });
  const [shippingType, setShippingType] = useState<"sedex" | "transportadora" | "">("");
  const [shippingLoading, setShippingLoading] = useState(false);

  // Load customer address and fetch shipping rates
  useEffect(() => {
    const customerId = localStorage.getItem("customer_id");
    const customerEmail = localStorage.getItem("customer_email");
    if (!customerId || !customerEmail) return;

    fetch("/api/customers/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: customerEmail }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.exists && data.customer?.state) {
          setCustomerState(data.customer.state);
          setCustomerCity(data.customer.city || "");
          fetchShipping(data.customer.state);
        }
      })
      .catch(() => {});
  }, []);

  async function fetchShipping(uf: string) {
    setShippingLoading(true);
    try {
      const res = await fetch(`/api/shipping?state=${uf}`);
      if (res.ok) {
        const data = await res.json();
        setShippingRates({ sedex: data.sedex || 0, transportadora: data.transportadora || 0 });
      }
    } catch {}
    setShippingLoading(false);
  }

  const shippingValue = shippingType ? shippingRates[shippingType] : 0;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim().toUpperCase(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Cupom inválido");
      } else {
        setCoupon(couponInput.trim().toUpperCase(), data.discount);
      }
    } catch {
      setCouponError("Erro ao validar cupom");
    }
    setCouponLoading(false);
  }

  function removeCoupon() {
    clearCoupon();
    setCouponInput("");
    setCouponError("");
  }

  const total = subtotal - couponDiscount + shippingValue;

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-base font-bold mb-3">Seu carrinho está vazio</h2>
          <p className="text-[#7b8fa8] mb-6">Adicione produtos do catálogo para continuar.</p>
          <Link href="/home" className="btn-primary">
            Ver Catálogo
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <h2 className="text-base md:text-lg font-bold mb-3">Carrinho</h2>

        <div className="card-tech overflow-hidden table-responsive">
          <table className="table-tech">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="w-32">Preço unit.</th>
                <th className="w-36">Quantidade</th>
                <th className="w-32 text-right">Subtotal</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.productId}-${item.dosage}`}>
                  <td className="font-medium">
                    {item.name}
                    {item.dosage && <span className="badge badge-info ml-2">{item.dosage}</span>}
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>
                    <div className="flex items-center border border-[#1a2a44] rounded-md w-fit">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.dosage)}
                        className="px-2 py-1 text-sm hover:bg-[#0a1628] text-[#7b8fa8]"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1), item.dosage)
                        }
                        className="w-8 text-center text-xs border-x border-[#1a2a44] py-1 bg-transparent text-[#e0e8f0]"
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1), item.dosage)}
                        className="px-2 py-1 text-xs hover:bg-[#0a1628] text-[#7b8fa8]"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                  <td>
                    <button
                      onClick={() => removeItem(item.productId, item.dosage)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Coupon */}
        <div className="card-tech p-3 mt-3">
          <label className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1">Cupom de Desconto</label>
          {couponCode ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#4ade80]">
                Cupom <strong>{couponCode}</strong> aplicado — desconto de {formatCurrency(couponDiscount)}
              </span>
              <button onClick={removeCoupon} className="btn-secondary text-xs py-1 px-2">Remover</button>
            </div>
          ) : (
            <div>
              <div className="flex gap-3">
                <input
                  className="input-field flex-1 max-w-xs"
                  placeholder="Digite o código"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                />
                <button onClick={applyCoupon} className="btn-secondary" disabled={couponLoading}>
                  {couponLoading ? "..." : "Aplicar"}
                </button>
              </div>
              {couponError && <p className="text-[11px] text-red-400 mt-1">{couponError}</p>}
            </div>
          )}
        </div>

        {/* Shipping */}
        <div className="card-tech p-3 mt-3">
          <label className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-2">Frete</label>
          {shippingLoading ? (
            <p className="text-xs text-[#7b8fa8]">Calculando frete...</p>
          ) : !customerState ? (
            <p className="text-xs text-[#7b8fa8]">Faça login e complete seu cadastro para ver as opções de frete.</p>
          ) : (
            <div>
              <p className="text-xs text-[#7b8fa8] mb-2">
                Entrega para <strong className="text-[#e0e8f0]">{customerCity ? `${customerCity} - ${customerState}` : customerState}</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {shippingRates.sedex > 0 && (
                  <button
                    onClick={() => setShippingType("sedex")}
                    className={`flex-1 border rounded-lg px-3 py-2 text-left transition-colors ${
                      shippingType === "sedex"
                        ? "border-[#00d4ff] bg-[#00d4ff]/10"
                        : "border-[#1a2a44] hover:border-[#2a3a54]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#e0e8f0]">Sedex</p>
                        <p className="text-[10px] text-[#7b8fa8]">Entrega rápida</p>
                      </div>
                      <span className="text-sm font-bold text-[#00d4ff]">{formatCurrency(shippingRates.sedex)}</span>
                    </div>
                  </button>
                )}
                {shippingRates.transportadora > 0 && (
                  <button
                    onClick={() => setShippingType("transportadora")}
                    className={`flex-1 border rounded-lg px-3 py-2 text-left transition-colors ${
                      shippingType === "transportadora"
                        ? "border-[#00d4ff] bg-[#00d4ff]/10"
                        : "border-[#1a2a44] hover:border-[#2a3a54]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#e0e8f0]">Transportadora</p>
                        <p className="text-[10px] text-[#7b8fa8]">Entrega econômica</p>
                      </div>
                      <span className="text-sm font-bold text-[#00d4ff]">{formatCurrency(shippingRates.transportadora)}</span>
                    </div>
                  </button>
                )}
                {shippingRates.sedex === 0 && shippingRates.transportadora === 0 && (
                  <p className="text-xs text-amber-400">Frete não configurado para o estado {customerState}. Entre em contato.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="mt-3 flex flex-col items-end gap-2">
          <div className="text-right space-y-1">
            <div className="flex justify-between gap-8 text-xs">
              <span className="text-[#7b8fa8]">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between gap-8 text-xs text-[#4ade80]">
                <span>Desconto ({couponCode})</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            {shippingType && shippingValue > 0 && (
              <div className="flex justify-between gap-8 text-xs">
                <span className="text-[#7b8fa8]">Frete ({shippingType === "sedex" ? "Sedex" : "Transportadora"})</span>
                <span>{formatCurrency(shippingValue)}</span>
              </div>
            )}
            <div className="flex justify-between gap-8 pt-1 border-t border-[#1a2a44]">
              <span className="text-[#7b8fa8]">Total</span>
              <span className="text-base font-bold text-[#00d4ff]">{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <Link href="/home" className="btn-secondary">
              Continuar comprando
            </Link>
            <Link
              href={shippingType ? `/checkout?shipping=${shippingType}` : "#"}
              onClick={(e) => {
                if (!shippingType) {
                  e.preventDefault();
                  alert("Selecione uma opção de frete antes de finalizar.");
                }
              }}
              className={`btn-primary ${!shippingType ? "opacity-50" : ""}`}
            >
              Finalizar pedido
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
