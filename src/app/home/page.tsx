import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/constants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CatalogClient from "@/components/CatalogClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { dosageStocks: true },
  });

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-3 md:mb-4">
          <h2 className="text-base md:text-lg font-bold text-[#e0e8f0]">Catálogo de Produtos</h2>
          <p className="text-xs text-[#7b8fa8] mt-1">
            Peptídeos de alta pureza para pesquisa científica
          </p>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-[#7b8fa8] py-8">Nenhum produto disponível no momento.</p>
        ) : (
          <CatalogClient
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              stock: p.stock,
              dosages: p.dosages,
              formattedPrice: formatCurrency(p.price),
              dosageStocks: p.dosageStocks.map((ds) => ({
                dosageMg: ds.dosageMg,
                stock: ds.stock,
                price: ds.price,
              })),
            }))}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
