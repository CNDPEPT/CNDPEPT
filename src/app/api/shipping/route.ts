import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");

  if (state) {
    const rate = await prisma.shippingRate.findUnique({
      where: { state: state.toUpperCase() },
    });
    if (!rate) return NextResponse.json({ sedex: 0, transportadora: 0 });
    return NextResponse.json({
      sedex: rate.sedexPrice,
      transportadora: rate.transportadoraPrice,
    });
  }

  const rates = await prisma.shippingRate.findMany({ orderBy: { state: "asc" } });
  return NextResponse.json(rates);
}
