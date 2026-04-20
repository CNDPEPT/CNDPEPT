"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  dosage: string;  // e.g. "20mg" or "" if no dosages
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, dosage?: string) => void;
  updateQuantity: (productId: string, quantity: number, dosage?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  couponCode: string;
  couponDiscount: number;
  setCoupon: (code: string, discount: number) => void;
  clearCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("canada_pepts_cart");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch { /* ignore */ }
    }
    const savedCoupon = localStorage.getItem("canada_pepts_coupon");
    if (savedCoupon) {
      try {
        const c = JSON.parse(savedCoupon);
        setCouponCode(c.code || "");
        setCouponDiscount(c.discount || 0);
      } catch { /* ignore */ }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("canada_pepts_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (couponCode) {
      localStorage.setItem("canada_pepts_coupon", JSON.stringify({ code: couponCode, discount: couponDiscount }));
    } else {
      localStorage.removeItem("canada_pepts_coupon");
    }
  }, [couponCode, couponDiscount]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId && i.dosage === (item.dosage || ""));
      if (existing) {
        const newQty = Math.min(existing.quantity + (item.quantity || 1), item.stock);
        return prev.map((i) =>
          i.productId === item.productId && i.dosage === (item.dosage || "") ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1, dosage: item.dosage || "" }];
    });
  }, []);

  const removeItem = useCallback((productId: string, dosage?: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.dosage === (dosage || ""))));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, dosage?: string) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.dosage === (dosage || ""))));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.dosage === (dosage || "") ? { ...i, quantity: Math.min(quantity, i.stock) } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode("");
    setCouponDiscount(0);
  }, []);

  const setCoupon = useCallback((code: string, discount: number) => {
    setCouponCode(code);
    setCouponDiscount(discount);
  }, []);

  const clearCoupon = useCallback(() => {
    setCouponCode("");
    setCouponDiscount(0);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, couponCode, couponDiscount, setCoupon, clearCoupon }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
