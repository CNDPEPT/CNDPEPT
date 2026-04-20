"use client";

import { useCart } from "@/contexts/CartContext";
import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/constants";

interface DosageStock {
  dosageMg: number;
  stock: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  dosages: string;
  formattedPrice: string;
  dosageStocks: DosageStock[];
}

interface ShippingRates {
  sedex: number;
  transportadora: number;
}

export default function CatalogClient({ products }: { products: Product[] }) {
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [shippingRates, setShippingRates] = useState<ShippingRates | null>(null);
  const [customerState, setCustomerState] = useState("");

  // Load customer state from localStorage and fetch shipping rates
  useEffect(() => {
    const state = localStorage.getItem("customer_state");
    if (state) {
      setCustomerState(state);
      fetch(`/api/shipping?state=${encodeURIComponent(state)}`)
        .then((r) => r.json())
        .then((data) => setShippingRates(data))
        .catch(() => {});
    }
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const term = search.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }, [products, search]);

  function handleAdd(product: Product, qty: number, dosage: string) {
    // Get stock and price for the selected dosage
    const dosageMg = parseInt(dosage);
    const ds = product.dosageStocks.find((d) => d.dosageMg === dosageMg);
    const stockForDosage = ds ? ds.stock : product.stock;
    const priceForDosage = ds && ds.price > 0 ? ds.price : product.price;
    if (stockForDosage <= 0) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: priceForDosage,
      stock: stockForDosage,
      dosage,
      quantity: qty,
    });
    const dosageLabel = dosage ? ` (${dosage})` : "";
    setFeedback(`${product.name}${dosageLabel} adicionado ao carrinho!`);
    setTimeout(() => setFeedback(null), 2000);
  }

  return (
    <>
      {feedback && (
        <div className="fixed top-4 right-4 z-50 bg-[#00d4ff] text-[#060b18] px-4 py-2 rounded-md text-sm font-semibold shadow-lg shadow-[#00d4ff33] animate-pulse">
          {feedback}
        </div>
      )}

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5f7a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0d1525] border border-[#1a2a44] text-[#e0e8f0] placeholder-[#4a5f7a] focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all duration-200 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5f7a] hover:text-[#e0e8f0] transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-[#7b8fa8] mt-1">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Shipping info bar */}
      {customerState && shippingRates && (shippingRates.sedex > 0 || shippingRates.transportadora > 0) && (
        <div className="mb-4 p-3 bg-[#0a1628] border border-[#1a2a44] rounded-lg flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[#7b8fa8]">📦 Frete para <strong className="text-[#e0e8f0]">{customerState}</strong>:</span>
          {shippingRates.sedex > 0 && (
            <span className="text-[#e0e8f0]">Sedex <strong className="text-[#00d4ff]">{formatCurrency(shippingRates.sedex)}</strong></span>
          )}
          {shippingRates.transportadora > 0 && (
            <span className="text-[#e0e8f0]">Transportadora <strong className="text-[#00d4ff]">{formatCurrency(shippingRates.transportadora)}</strong></span>
          )}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <p className="text-center text-[#7b8fa8] py-8">Nenhum produto encontrado para &quot;{search}&quot;.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={handleAdd} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, qty: number, dosage: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const dosageList = product.dosages ? product.dosages.split(",").map((d) => d.trim()).filter(Boolean) : [];
  const [selectedDosage, setSelectedDosage] = useState(dosageList.length > 0 ? `${dosageList[0]}mg` : "");

  // Get the stock and price for the currently selected dosage
  const selectedMg = parseInt(selectedDosage);
  const dosageStockEntry = product.dosageStocks.find((ds) => ds.dosageMg === selectedMg);
  const currentStock = dosageStockEntry ? dosageStockEntry.stock : product.stock;
  const currentPrice = dosageStockEntry && dosageStockEntry.price > 0 ? dosageStockEntry.price : product.price;
  const available = currentStock > 0;

  // Reset qty when dosage changes
  useEffect(() => {
    setQty(1);
  }, [selectedDosage]);

  return (
    <div className="card-tech p-3 md:p-4 flex flex-col">
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-[#e0e8f0] text-sm md:text-base leading-tight">{product.name}</h3>
          {available ? (
            <span className="badge badge-success ml-2 whitespace-nowrap">Em estoque</span>
          ) : (
            <span className="badge badge-danger ml-2 whitespace-nowrap">Indisponível</span>
          )}
        </div>
        <p className="text-xs md:text-sm text-[#7b8fa8] mb-3 line-clamp-3">{product.description}</p>
      </div>
      <div className="border-t border-[#1a2a44] pt-3 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm md:text-base font-bold text-[#00d4ff]">{formatCurrency(currentPrice)}</span>
          {available && (
            <span className="text-xs text-[#7b8fa8]">{currentStock} un. disponíveis</span>
          )}
        </div>
        {/* Dosage selector */}
        {dosageList.length > 0 && (
          <div className="mb-3 bg-[#0a1628] border border-[#1a2a44] rounded-xl p-3">
            <label className="block text-xs font-semibold text-[#e0e8f0] mb-1">⚡ Escolha a dosagem:</label>
            <div className="flex flex-wrap gap-2">
              {dosageList.map((d) => {
                const val = `${d}mg`;
                const ds = product.dosageStocks.find((s) => s.dosageMg === parseInt(d));
                const dsStock = ds ? ds.stock : 0;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDosage(val)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border-2 ${
                      selectedDosage === val
                        ? "bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white border-[#818cf8] shadow-[0_0_12px_rgba(99,102,241,0.4)] scale-105"
                        : dsStock > 0
                          ? "bg-[#0d1525] border-[#2a4a6a] text-[#a0c4e8] hover:border-[#818cf8] hover:text-[#a78bfa] hover:shadow-[0_0_6px_rgba(129,140,248,0.2)]"
                          : "bg-[#0d1525] border-[#1a2a44] text-[#4a5f7a] opacity-60 cursor-not-allowed"
                    }`}
                    disabled={dsStock <= 0}
                  >
                    {val}
                    <span className="ml-1 text-[10px] font-normal opacity-75">({dsStock})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {available ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-[#1a2a44] rounded-md">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2 text-sm hover:bg-[#0a1628] text-[#7b8fa8] transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={currentStock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(currentStock, parseInt(e.target.value) || 1)))}
                className="w-10 text-center text-sm border-x border-[#1a2a44] py-2 bg-transparent text-[#e0e8f0]"
              />
              <button
                onClick={() => setQty(Math.min(currentStock, qty + 1))}
                className="px-3 py-2 text-sm hover:bg-[#0a1628] text-[#7b8fa8] transition-colors"
              >
                +
              </button>
            </div>
            <button onClick={() => onAdd(product, qty, selectedDosage)} className="btn-primary flex-1 text-sm !py-2">
              Adicionar
            </button>
          </div>
        ) : (
          <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed text-sm">
            Indisponível
          </button>
        )}
      </div>
    </div>
  );
}
