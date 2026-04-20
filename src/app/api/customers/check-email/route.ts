import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { email },
  });

  if (customer) {
    return NextResponse.json({ exists: true, customer });
  }

  return NextResponse.json({ exists: false });
}
