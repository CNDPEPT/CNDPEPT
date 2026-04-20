/**
 * Loggi Integration Service
 *
 * Uses the official Loggi API to create shipments and generate labels.
 * Documentation: https://docs.loggi.com
 *
 * Required environment variables:
 *   LOGGI_API_URL        - e.g. https://api.loggi.com
 *   LOGGI_COMPANY_ID     - Your Loggi company ID
 *   LOGGI_API_KEY        - Bearer token / API key for authentication
 *
 * The flow:
 * 1. createShipment()  - Creates a shipment on Loggi for an order
 * 2. generateLabels()  - Generates PDF labels for one or more shipments
 */

export interface LoggiConfig {
  apiUrl: string;
  companyId: string;
  apiKey: string;
}

export interface LoggiSender {
  name: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LoggiRecipient {
  name: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LoggiPackage {
  weight: number; // kg
  width: number;  // cm
  height: number; // cm
  length: number; // cm
}

export interface CreateShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingCode?: string;
  error?: string;
}

export interface GenerateLabelResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  labelUrl?: string;
  labelBase64?: string;
  error?: string;
}

function getConfig(): LoggiConfig {
  const apiUrl = process.env.LOGGI_API_URL || "";
  const companyId = process.env.LOGGI_COMPANY_ID || "";
  const apiKey = process.env.LOGGI_API_KEY || "";
  return { apiUrl, companyId, apiKey };
}

function isConfigured(): boolean {
  const { apiUrl, companyId, apiKey } = getConfig();
  return !!(apiUrl && companyId && apiKey);
}

/**
 * Create a shipment on Loggi for a single order.
 * This must be called before generating labels.
 */
export async function createShipment(
  sender: LoggiSender,
  recipient: LoggiRecipient,
  pkg: LoggiPackage = { weight: 0.5, width: 15, height: 10, length: 20 }
): Promise<CreateShipmentResult> {
  const config = getConfig();

  if (!isConfigured()) {
    return { success: false, error: "Loggi não configurada. Defina LOGGI_API_URL, LOGGI_COMPANY_ID e LOGGI_API_KEY no .env" };
  }

  try {
    const response = await fetch(`${config.apiUrl}/v1/companies/${config.companyId}/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        shipper: {
          name: sender.name,
          phone: sender.phone,
          address: {
            street: sender.street,
            number: sender.number,
            complement: sender.complement,
            neighborhood: sender.district,
            city: sender.city,
            state: sender.state,
            zipCode: sender.zipCode.replace(/\D/g, ""),
          },
        },
        recipient: {
          name: recipient.name,
          phone: recipient.phone,
          address: {
            street: recipient.street,
            number: recipient.number,
            complement: recipient.complement,
            neighborhood: recipient.district,
            city: recipient.city,
            state: recipient.state,
            zipCode: recipient.zipCode.replace(/\D/g, ""),
          },
        },
        packages: [
          {
            weight: pkg.weight,
            width: pkg.width,
            height: pkg.height,
            length: pkg.length,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `Loggi API error (${response.status}): ${errorBody}` };
    }

    const data = await response.json();
    return {
      success: true,
      shipmentId: data.loggi_key || data.shipment_id || data.id,
      trackingCode: data.tracking_code || data.trackingCode,
    };
  } catch (err) {
    return { success: false, error: `Erro de conexão com Loggi: ${(err as Error).message}` };
  }
}

/**
 * Generate official Loggi labels for a list of shipment IDs (loggiKeys).
 * Returns PDF as base64 or URL depending on Loggi's response.
 */
export async function generateLabels(
  loggiKeys: string[]
): Promise<{ success: boolean; pdfBase64?: string; pdfUrl?: string; error?: string }> {
  const config = getConfig();

  if (!isConfigured()) {
    return { success: false, error: "Loggi não configurada. Defina LOGGI_API_URL, LOGGI_COMPANY_ID e LOGGI_API_KEY no .env" };
  }

  if (loggiKeys.length === 0) {
    return { success: false, error: "Nenhum shipment ID fornecido." };
  }

  try {
    const response = await fetch(`${config.apiUrl}/v1/companies/${config.companyId}/labels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
        "Accept": "application/pdf",
      },
      body: JSON.stringify({
        loggi_keys: loggiKeys,
        format: "pdf",
        layout: "a4",
        label_type: "standard",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `Loggi API error (${response.status}): ${errorBody}` };
    }

    const contentType = response.headers.get("content-type") || "";

    // If the response is a PDF binary
    if (contentType.includes("application/pdf")) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return { success: true, pdfBase64: base64 };
    }

    // If the response is JSON with a URL
    const data = await response.json();
    if (data.url || data.label_url) {
      return { success: true, pdfUrl: data.url || data.label_url };
    }

    // If JSON contains base64 directly
    if (data.pdf || data.base64) {
      return { success: true, pdfBase64: data.pdf || data.base64 };
    }

    return { success: false, error: "Formato de resposta inesperado da Loggi." };
  } catch (err) {
    return { success: false, error: `Erro de conexão com Loggi: ${(err as Error).message}` };
  }
}

/**
 * Validate if orders have the required Loggi shipment data.
 * Returns categorized results: ready (have loggiShipmentId) and notReady (missing).
 */
export function validateLoggiShipmentData(
  orders: Array<{ id: string; orderNumber: string; loggiShipmentId: string | null }>
): {
  ready: Array<{ id: string; orderNumber: string; loggiShipmentId: string }>;
  notReady: Array<{ id: string; orderNumber: string; reason: string }>;
} {
  const ready: Array<{ id: string; orderNumber: string; loggiShipmentId: string }> = [];
  const notReady: Array<{ id: string; orderNumber: string; reason: string }> = [];

  for (const order of orders) {
    if (order.loggiShipmentId) {
      ready.push({ id: order.id, orderNumber: order.orderNumber, loggiShipmentId: order.loggiShipmentId });
    } else {
      notReady.push({ id: order.id, orderNumber: order.orderNumber, reason: "Envio não criado na Loggi (sem loggiShipmentId)" });
    }
  }

  return { ready, notReady };
}

/**
 * Check if Loggi integration is configured.
 */
export function isLoggiConfigured(): boolean {
  return isConfigured();
}

export function getLoggiConfigStatus(): { configured: boolean; missingVars: string[] } {
  const missing: string[] = [];
  if (!process.env.LOGGI_API_URL) missing.push("LOGGI_API_URL");
  if (!process.env.LOGGI_COMPANY_ID) missing.push("LOGGI_COMPANY_ID");
  if (!process.env.LOGGI_API_KEY) missing.push("LOGGI_API_KEY");
  return { configured: missing.length === 0, missingVars: missing };
}
