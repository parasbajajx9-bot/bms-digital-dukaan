import type { ShopDataSnapshot } from "@/lib/storage";

export type CloudShopData = {
  hasCloudData: boolean;
  data: ShopDataSnapshot;
};

export type BmsBackupFile = {
  format: "bms-shop-backup";
  version: 1;
  exportedAt: string;
  data: ShopDataSnapshot;
};

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;
const shopDataUrl = `${apiBase}/shop-data`;

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.error === "string") return body.error;
  } catch {
    // Use the status-specific message below for non-JSON responses.
  }
  return `Cloud request failed (${response.status}).`;
}

export async function getCloudShopData(): Promise<CloudShopData> {
  const response = await fetch(shopDataUrl, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<CloudShopData>;
}

export async function saveCloudShopData(
  data: ShopDataSnapshot,
): Promise<CloudShopData> {
  const response = await fetch(shopDataUrl, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<CloudShopData>;
}

export function downloadShopBackup(data: ShopDataSnapshot): void {
  const backup: BmsBackupFile = {
    format: "bms-shop-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  const file = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bms-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseShopBackup(value: unknown): ShopDataSnapshot {
  if (!isRecord(value) || value.format !== "bms-shop-backup" || value.version !== 1) {
    throw new Error("This is not a BMS shop backup file.");
  }
  const data = value.data;
  if (
    !isRecord(data) ||
    !isRecord(data.settings) ||
    !Array.isArray(data.inventory) ||
    !Array.isArray(data.customers) ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.bills) ||
    !Number.isInteger(data.invoiceCounter) ||
    (data.invoiceCounter as number) < 0
  ) {
    throw new Error("The backup file is incomplete or damaged.");
  }
  const arrays = [data.inventory, data.customers, data.transactions, data.bills];
  if (arrays.some((entries) => entries.some((entry) => !isRecord(entry)))) {
    throw new Error("The backup contains an invalid record.");
  }
  return data as unknown as ShopDataSnapshot;
}
