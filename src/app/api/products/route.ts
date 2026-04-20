import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { dosageStocks: true },
  });
  return NextResponse.json(products);
}
