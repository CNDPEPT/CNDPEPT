import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  cleanCPF,
  getShippingRegionLabel,
  generateOrderNumber,
  PIX_PAYLOAD,
} from "@/lib/constants";
import QRCode from "qrcode";

// GET: list orders by CPF, customerId, or all (admin)
export async function GET(req: NextRequest) {
  const cpf = req.nextUrl.searchParams.get("cpf");
  const customerId = req.nextUrl.searchParams.get("customerId");
  const all = req.nextUrl.searchParams.get("all");

  if (customerId) {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  if (cpf) {
    const orders = await prisma.order.findMany({
      where: { customerCpfSnapshot: cleanCPF(cpf) },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  if (all === "true") {
    const status = req.nextUrl.searchParams.get("status");
    const search = req.nextUrl.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerNameSnapshot: { contains: search, mode: "insensitive" } },
        { customerCpfSnapshot: { contains: cleanCPF(search) } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  return NextResponse.json([]);
}

// POST: create new order
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    cpf, fullName, email, phone, zipCode, street, number,
    complement, district, city, state, items, shippingType, couponCode,
  } = body;

  const cleanedCpf = cleanCPF(cpf);
  if (!cleanedCpf || cleanedCpf.length !== 11) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Nenhum item no pedido" }, { status: 400 });
  }
  if (!state || !shippingType) {
    return NextResponse.json({ error: "Dados de frete incompletos" }, { status: 400 });
  }

  // Upsert customer
  const customer = await prisma.customer.upsert({
    where: { cpf: cleanedCpf },
    update: { fullName, email, phone, zipCode, street, number, complement: complement || "", district, city, state },
    create: { fullName, cpf: cleanedCpf, email, phone, zipCode, street, number, complement: complement || "", district, city, state },
  });

  // Validate stock and calculate subtotal
  let subtotal = 0;
  const orderItems: { productId: string; productNameSnapshot: string; dosage: string; unitPrice: number; quantity: number; lineTotal: number }[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { dosageStocks: true },
    });
    if (!product) {
      return NextResponse.json({ error: `Produto não encontrado: ${item.productId}` }, { status: 400 });
    }
    if (!product.isActive) {
      return NextResponse.json({ error: `Produto indisponível: ${product.name}` }, { status: 400 });
    }
    // Check per-dosage stock if dosage is specified and dosageStocks exist
    const dosageMg = item.dosage ? parseInt(item.dosage) : 0;
    const dosageEntry = dosageMg > 0 ? product.dosageStocks.find((ds) => ds.dosageMg === dosageMg) : null;
    if (dosageEntry) {
      if (dosageEntry.stock < item.quantity) {
        return NextResponse.json({ error: `Estoque insuficiente para: ${product.name} (${item.dosage}). Disponível: ${dosageEntry.stock}` }, { status: 400 });
      }
    } else if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Estoque insuficiente para: ${product.name}. Disponível: ${product.stock}` }, { status: 400 });
    }
    // Use per-dosage price if available
    const unitPrice = dosageEntry && dosageEntry.price > 0 ? dosageEntry.price : product.price;
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    subtotal += lineTotal;
    orderItems.push({
      productId: product.id,
      productNameSnapshot: product.name,
      dosage: item.dosage || "",
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  // Shipping
  const shippingRate = await prisma.shippingRate.findUnique({ where: { state: state.toUpperCase() } });
  const shippingValue = shippingRate
    ? (shippingType === "sedex" ? shippingRate.sedexPrice : shippingRate.transportadoraPrice)
    : 0;
  const shippingRegion = getShippingRegionLabel(state);

  // Coupon
  let discountValue = 0;
  let appliedCouponCode: string | null = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive) {
      if (coupon.type === "percentage") {
        discountValue = Math.round((subtotal * coupon.value / 100) * 100) / 100;
      } else {
        discountValue = Math.min(coupon.value, subtotal);
      }
      appliedCouponCode = coupon.code;
      // Increment usage
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }
  }

  const totalValue = Math.round((subtotal + shippingValue - discountValue) * 100) / 100;

  // Generate unique order number
  let orderNumber = generateOrderNumber();
  let exists = await prisma.order.findUnique({ where: { orderNumber } });
  while (exists) {
    orderNumber = generateOrderNumber();
    exists = await prisma.order.findUnique({ where: { orderNumber } });
  }

  // Create order and decrement stock in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Decrement stock (per-dosage and total)
    for (const item of orderItems) {
      const dosageMg = item.dosage ? parseInt(item.dosage) : 0;
      if (dosageMg > 0) {
        // Decrement dosage-specific stock
        const dsRecord = await tx.productDosage.findUnique({
          where: { productId_dosageMg: { productId: item.productId, dosageMg } },
        });
        if (dsRecord) {
          await tx.productDosage.update({
            where: { id: dsRecord.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
      // Always decrement total product stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        subtotal,
        shippingType,
        shippingRegion,
        shippingValue,
        discountValue,
        couponCode: appliedCouponCode,
        totalValue,
        status: "Aguardando pagamento",
        customerCpfSnapshot: cleanedCpf,
        customerNameSnapshot: fullName,
        customerEmailSnapshot: email,
        customerPhoneSnapshot: phone,
        shippingZipCode: zipCode,
        shippingStreet: street,
        shippingNumber: number,
        shippingComplement: complement || "",
        shippingDistrict: district,
        shippingCity: city,
        shippingState: state,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Create initial status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        previousStatus: "",
        newStatus: "Aguardando pagamento",
        comment: "Pedido criado",
      },
    });

    return newOrder;
  });

  // Generate QR Code
  const pixPayload = PIX_PAYLOAD;
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(pixPayload, { width: 256 });
  } catch {
    // QR generation failed, continue without it
  }

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    totalValue: order.totalValue,
    pixPayload,
    qrCodeDataUrl,
  });
}
