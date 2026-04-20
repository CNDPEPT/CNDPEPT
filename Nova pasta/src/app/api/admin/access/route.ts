import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET: list all access credentials (email + status)
export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      email: c.email,
      fullName: c.fullName || "",
      isActive: c.isActive,
      hasPassword: !!c.passwordHash,
      createdAt: c.createdAt,
    }))
  );
}

// POST: create a new access (email + password only)
export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const existing = await prisma.customer.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password.trim());

    const customer = await prisma.customer.create({
      data: {
        email: trimmedEmail,
        passwordHash,
      },
    });

    return NextResponse.json({ id: customer.id, email: customer.email });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error creating access:", errorMessage, err);
    return NextResponse.json({ error: `Erro ao criar acesso: ${errorMessage}` }, { status: 500 });
  }
}

// PUT: update password or toggle active
export async function PUT(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, password, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (password && password.trim()) {
    data.passwordHash = await hashPassword(password.trim());
  }
  if (isActive !== undefined) {
    data.isActive = isActive;
  }

  const updated = await prisma.customer.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, email: updated.email, isActive: updated.isActive });
}

// DELETE: remove access
export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  // Check if customer has orders
  const orderCount = await prisma.order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    return NextResponse.json({ error: "Não é possível excluir. Cliente possui pedidos. Desative-o." }, { status: 400 });
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
