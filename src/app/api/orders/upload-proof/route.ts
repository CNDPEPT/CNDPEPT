import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const orderId = formData.get("orderId") as string | null;

  if (!file || !orderId) {
    return NextResponse.json({ error: "Arquivo e ID do pedido são obrigatórios" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido. Use JPG, PNG, WebP ou PDF." }, { status: 400 });
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5MB." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "proofs");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, "").substring(0, 5);
  const fileName = `${orderId}-${Date.now()}.${sanitizedExt}`;
  const filePath = path.join(uploadsDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentProofPath: `/uploads/proofs/${fileName}`,
      paymentReportedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, path: `/uploads/proofs/${fileName}` });
}
