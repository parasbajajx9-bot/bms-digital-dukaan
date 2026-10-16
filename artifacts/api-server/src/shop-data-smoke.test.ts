import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import express from "express";
import { eq } from "drizzle-orm";
import { db, pool, shopDataTable } from "@workspace/db";
import { createShopDataRouter } from "./routes/shop-data.js";

const ownerId = `bms-smoke-${randomUUID()}`;
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: () => undefined } as never;
  next();
});
app.use("/api", createShopDataRouter(() => ownerId));
app.use("/api/other", createShopDataRouter(() => `${ownerId}-other`));

const server = app.listen(0);
await new Promise<void>((resolve) => server.once("listening", resolve));
const port = (server.address() as AddressInfo).port;
const baseUrl = `http://127.0.0.1:${port}/api/shop-data`;

const snapshot = {
  settings: { shopName: "BMS database smoke test" },
  inventory: [{ id: "smoke-product", name: "Test product" }],
  customers: [{ id: "smoke-customer", name: "Test customer" }],
  transactions: [{ id: "smoke-transaction", amount: 120 }],
  bills: [{ id: "smoke-invoice", billNumber: "SMOKE-001", total: 120 }],
  invoiceCounter: 101,
};

try {
  const emptyResponse = await fetch(baseUrl);
  assert.equal(emptyResponse.status, 200);
  const emptyData = await emptyResponse.json() as { hasCloudData: boolean };
  assert.equal(emptyData.hasCloudData, false);

  const saveResponse = await fetch(baseUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });
  assert.equal(saveResponse.status, 200);

  // A new GET after the write simulates the read after a page refresh.
  const refreshedResponse = await fetch(baseUrl);
  assert.equal(refreshedResponse.status, 200);
  const refreshed = await refreshedResponse.json() as {
    hasCloudData: boolean;
    data: { bills: { billNumber: string }[] };
  };
  assert.equal(refreshed.hasCloudData, true);
  assert.equal(refreshed.data.bills[0].billNumber, "SMOKE-001");

  const otherOwnerResponse = await fetch(
    `http://127.0.0.1:${port}/api/other/shop-data`,
  );
  assert.equal(otherOwnerResponse.status, 200);
  const otherOwnerData = await otherOwnerResponse.json() as { hasCloudData: boolean };
  assert.equal(otherOwnerData.hasCloudData, false);

  console.log(JSON.stringify({
    initialCloudData: false,
    savedCounts: {
      inventory: snapshot.inventory.length,
      customers: snapshot.customers.length,
      transactions: snapshot.transactions.length,
      invoices: snapshot.bills.length,
    },
    readAfterRefresh: {
      hasCloudData: refreshed.hasCloudData,
      invoices: refreshed.data.bills.length,
      invoiceNumber: refreshed.data.bills[0].billNumber,
    },
    otherOwnerHasData: false,
  }));
} finally {
  await db.delete(shopDataTable).where(eq(shopDataTable.ownerId, ownerId));
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await pool.end();
}
