import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json();
  if (!code) return NextResponse.json({ error: "Código do cupom é obrigatório" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
  if (!coupon.isActive) return NextResponse.json({ error: "Cupom inativo" }, { status: 400 });
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 });
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round((subtotal * coupon.value / 100) * 100) / 100;
  } else {
    discount = Math.min(coupon.value, subtotal);
  }

  return NextResponse.json({ discount, type: coupon.type, value: coupon.value });
}
