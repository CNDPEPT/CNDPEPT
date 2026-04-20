// ============================================
// Configuração central da loja CANADA PEPTS
// Altere o nome e dados aqui para trocar a identidade
// ============================================

export const STORE_CONFIG = {
  name: "CND pepts",
  slogan: "Comercial de Produtos Bioquímicos",
  currency: "BRL",
  locale: "pt-BR",
};

export const CONTENT_DECLARATION_DESCRIPTION = "peptídeos liofilizados para pesquisa";

export const PIX_PAYLOAD = process.env.PIX_PAYLOAD || "";

export const ORDER_STATUSES = [
  "Aguardando pagamento",
  "Enviar",
  "Etiqueta impressa",
  "Enviado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Frete por região
export const SHIPPING_RATES: Record<string, { sedex: number; transportadora: number }> = {
  SUL_SUDESTE: { sedex: 40, transportadora: 20 },
  CENTRO_OESTE: { sedex: 65, transportadora: 25 },
  NORTE_NORDESTE: { sedex: 100, transportadora: 35 },
};

export const UF_TO_REGION: Record<string, string> = {
  PR: "SUL_SUDESTE", SC: "SUL_SUDESTE", RS: "SUL_SUDESTE",
  SP: "SUL_SUDESTE", RJ: "SUL_SUDESTE", MG: "SUL_SUDESTE", ES: "SUL_SUDESTE",
  GO: "CENTRO_OESTE", DF: "CENTRO_OESTE", MT: "CENTRO_OESTE", MS: "CENTRO_OESTE",
  AC: "NORTE_NORDESTE", AP: "NORTE_NORDESTE", AM: "NORTE_NORDESTE",
  PA: "NORTE_NORDESTE", RO: "NORTE_NORDESTE", RR: "NORTE_NORDESTE", TO: "NORTE_NORDESTE",
  AL: "NORTE_NORDESTE", BA: "NORTE_NORDESTE", CE: "NORTE_NORDESTE",
  MA: "NORTE_NORDESTE", PB: "NORTE_NORDESTE", PE: "NORTE_NORDESTE",
  PI: "NORTE_NORDESTE", RN: "NORTE_NORDESTE", SE: "NORTE_NORDESTE",
};

export const BRAZILIAN_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

export function getShippingRate(uf: string, type: "sedex" | "transportadora"): number {
  const region = UF_TO_REGION[uf.toUpperCase()];
  if (!region) return 0;
  return SHIPPING_RATES[region][type];
}

export function getShippingRegionLabel(uf: string): string {
  const region = UF_TO_REGION[uf.toUpperCase()];
  if (!region) return "Desconhecida";
  const labels: Record<string, string> = {
    SUL_SUDESTE: "Sul/Sudeste",
    CENTRO_OESTE: "Centro-Oeste",
    NORTE_NORDESTE: "Norte/Nordeste",
  };
  return labels[region] || region;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(digits[10]);
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9999) + 1;
  return `PED-${year}-${String(random).padStart(4, "0")}`;
}

// ============================================
// Input format masks (auto-format while typing)
// ============================================

/** CPF mask: 000.000.000-00 */
export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** CEP mask: 00000-000 */
export function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

/** Phone mask: (00) 00000-0000 or (00) 0000-0000 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/** Basic email format check */
export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Check CPF has 11 digits (format only, no integrity check) */
export function isValidCPFFormat(cpf: string): boolean {
  return cpf.replace(/\D/g, "").length === 11;
}

/** Check CEP has 8 digits */
export function isValidCEPFormat(cep: string): boolean {
  return cep.replace(/\D/g, "").length === 8;
}

/** Check phone has 10 or 11 digits */
export function isValidPhoneFormat(phone: string): boolean {
  const len = phone.replace(/\D/g, "").length;
  return len === 10 || len === 11;
}
