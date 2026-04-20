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

  const rates = await prisma.shippingRate.findMany({ orderBy: { state: "asc" } });
  return NextResponse.json(rates);
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { states, sedexPrice, transportadoraPrice } = await req.json();

  if (!states || !Array.isArray(states) || states.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um estado" }, { status: 400 });
  }

  const stateNames: Record<string, string> = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
    DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso",
    MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
    PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
    SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
  };

  const results = [];
  for (const uf of states) {
    const result = await prisma.shippingRate.upsert({
      where: { state: uf },
      update: {
        sedexPrice: Number(sedexPrice) || 0,
        transportadoraPrice: Number(transportadoraPrice) || 0,
      },
      create: {
        state: uf,
        stateName: stateNames[uf] || uf,
        sedexPrice: Number(sedexPrice) || 0,
        transportadoraPrice: Number(transportadoraPrice) || 0,
      },
    });
    results.push(result);
  }

  return NextResponse.json({ message: `${results.length} estado(s) atualizado(s)`, results });
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  await prisma.shippingRate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
