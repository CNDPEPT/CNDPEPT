import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      orderItems: {
        select: { quantity: true, dosage: true },
      },
      dosageStocks: {
        orderBy: { dosageMg: "asc" },
      },
    },
  });

  const result = products.map((p) => {
    const consumed = p.orderItems.reduce((sum, oi) => sum + oi.quantity, 0);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      dosages: p.dosages,
      dosageStocks: p.dosageStocks.map((ds) => ({
        dosageMg: ds.dosageMg,
        stock: ds.stock,
        price: ds.price,
      })),
      consumed,
      originalStock: p.stock + consumed,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const dosageStocksInput: { dosageMg: number; stock: number; price: number }[] = body.dosageStocks || [];

  // Total stock = sum of dosage stocks (if any) or explicit stock
  const totalStock = dosageStocksInput.length > 0
    ? dosageStocksInput.reduce((sum, ds) => sum + ds.stock, 0)
    : parseInt(body.stock) || 0;

  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description,
      price: parseFloat(body.price),
      stock: totalStock,
      dosages: body.dosages || "",
      isActive: body.isActive ?? true,
      dosageStocks: dosageStocksInput.length > 0 ? {
        create: dosageStocksInput.map((ds) => ({
          dosageMg: ds.dosageMg,
          stock: ds.stock,
          price: ds.price,
        })),
      } : undefined,
    },
  });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.price !== undefined) data.price = parseFloat(body.price);
  if (body.dosages !== undefined) data.dosages = body.dosages;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  // Handle dosage stocks
  const dosageStocksInput: { dosageMg: number; stock: number; price: number }[] | undefined = body.dosageStocks;
  if (dosageStocksInput !== undefined) {
    // Delete old dosage stocks and recreate
    await prisma.productDosage.deleteMany({ where: { productId: body.id } });
    if (dosageStocksInput.length > 0) {
      await prisma.productDosage.createMany({
        data: dosageStocksInput.map((ds) => ({
          productId: body.id,
          dosageMg: ds.dosageMg,
          stock: ds.stock,
          price: ds.price,
        })),
      });
    }
    // Update total stock
    data.stock = dosageStocksInput.reduce((sum, ds) => sum + ds.stock, 0);
  } else if (body.stock !== undefined) {
    data.stock = parseInt(body.stock);
  }

  const product = await prisma.product.update({
    where: { id: body.id },
    data,
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
