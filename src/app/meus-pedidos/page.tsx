"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatCurrency } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface OrderItem {
  productNameSnapshot: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalValue: number;
  subtotal: number;
  shippingType: string;
  shippingValue: number;
  discountValue: number;
  couponCode: string | null;
  customerNameSnapshot: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement: string;
  shippingDistrict: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  paymentProofPath: string | null;
  items: OrderItem[];
}

export default function MeusPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("customer_id");
    if (!id) {
      router.push("/login");
      return;
    }
    setCustomerId(id);
    fetchOrders(id);
  }, [router]);

  async function fetchOrders(id?: string) {
    const cid = id || customerId;
    if (!cid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?customerId=${cid}`);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function uploadComprovante(orderId: string, file: File) {
    setUploadingId(orderId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("orderId", orderId);
    try {
      const res = await fetch("/api/orders/upload-proof", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setFeedback("Comprovante enviado com sucesso!");
        setTimeout(() => setFeedback(""), 3000);
        fetchOrders();
      } else {
        const data = await res.json();
        setFeedback(data.error || "Erro ao enviar comprovante");
      }
    } catch {
      setFeedback("Erro ao enviar comprovante");
    }
    setUploadingId(null);
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      "Aguardando pagamento": "badge-warning",
      "Pago aguardando envio": "badge-info",
      "Já enviado": "badge-success",
      "Entregue": "badge-success",
      "Cancelado": "badge-danger",
      "Pagamento não identificado": "badge-danger",
    };
    return map[status] || "badge-neutral";
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <h2 className="text-base md:text-lg font-bold mb-3">Meus Pedidos</h2>

        {feedback && (
          <div className="bg-[#052e16] border border-[#166534] text-[#4ade80] px-3 py-2 rounded-md mb-3 text-xs">
            {feedback}
          </div>
        )}

        {loading && (
          <p className="text-center text-[#7b8fa8] py-8">Carregando pedidos...</p>
        )}

        {!loading && orders.length === 0 && (
          <p className="text-center text-[#7b8fa8] py-8">Você ainda não possui pedidos.</p>
        )}

        {detail ? (
          <div className="card-tech p-4 md:p-6">
            <button onClick={() => setDetail(null)} className="btn-secondary mb-4">
              ← Voltar à lista
            </button>
            <h3 className="font-semibold text-sm md:text-base mb-2">Pedido {detail.orderNumber}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              <div>
                <h4 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Status</h4>
                <span className={`badge ${statusBadge(detail.status)}`}>{detail.status}</span>
                <p className="text-[11px] text-[#7b8fa8] mt-1">
                  Criado em: {new Date(detail.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Entrega</h4>
                <p className="text-xs">{detail.shippingStreet}, {detail.shippingNumber} {detail.shippingComplement ? `- ${detail.shippingComplement}` : ""}</p>
                <p className="text-xs">{detail.shippingDistrict} — {detail.shippingCity}/{detail.shippingState}</p>
                <p className="text-xs">CEP: {detail.shippingZipCode}</p>
                <p className="text-xs mt-1">Frete: {detail.shippingType === "sedex" ? "SEDEX" : "Transportadora"} — {formatCurrency(detail.shippingValue)}</p>
              </div>
            </div>

            <div className="mt-3">
              <h4 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Itens</h4>
              <div className="space-y-1">
                {detail.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{item.productNameSnapshot}{item.dosage ? ` (${item.dosage})` : ""} x{item.quantity}</span>
                    <span>{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#1a2a44] mt-2 pt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(detail.subtotal)}</span></div>
                <div className="flex justify-between"><span>Frete</span><span>{formatCurrency(detail.shippingValue)}</span></div>
                {detail.discountValue > 0 && (
                  <div className="flex justify-between text-[#4ade80]"><span>Desconto{detail.couponCode ? ` (${detail.couponCode})` : ""}</span><span>-{formatCurrency(detail.discountValue)}</span></div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#1a2a44]">
                  <span>Total</span><span className="text-[#00d4ff]">{formatCurrency(detail.totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Comprovante */}
            <div className="mt-3 border-t border-[#1a2a44] pt-2">
              <h4 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Comprovante de pagamento</h4>
              {detail.paymentProofPath ? (
                <p className="text-xs text-[#4ade80]">✓ Comprovante já enviado</p>
              ) : (
                <p className="text-xs text-amber-600 mb-1">Nenhum comprovante enviado ainda.</p>
              )}
              <div className="mt-1">
                <label className="btn-secondary text-xs cursor-pointer">
                  {detail.paymentProofPath ? "Reenviar comprovante" : "Enviar comprovante"}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadComprovante(detail.id, file);
                    }}
                    disabled={uploadingId === detail.id}
                  />
                </label>
              </div>
            </div>

            {/* Payment instructions */}
            {detail.status === "Aguardando pagamento" && (
              <div className="mt-3 bg-amber-900/20 border border-amber-700/40 rounded-lg p-3 text-xs text-amber-300">
                <p className="font-semibold mb-1">Instruções de pagamento</p>
                <p>Realize o pagamento via PIX no valor exato de <strong>{formatCurrency(detail.totalValue)}</strong>.</p>
                <p>Após o pagamento, envie o comprovante acima.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="card-tech p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-[#7b8fa8]">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")} — {order.items.length} item(ns)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusBadge(order.status)}`}>{order.status}</span>
                  <span className="font-bold text-[#00d4ff] text-xs">{formatCurrency(order.totalValue)}</span>
                  <button onClick={() => setDetail(order)} className="btn-secondary text-xs">
                    Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
