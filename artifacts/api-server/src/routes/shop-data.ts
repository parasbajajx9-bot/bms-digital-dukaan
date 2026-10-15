import { getAuth } from "@clerk/express";
import {
  GetShopDataResponse,
  SaveShopDataBody,
  SaveShopDataResponse,
} from "@workspace/api-zod";
import { db, shopDataTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const emptySnapshot = {
  settings: {},
  inventory: [],
  customers: [],
  transactions: [],
  bills: [],
  invoiceCounter: 100,
};

function ownerIdFromRequest(req: Request, res: Response): string | null {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to access shop data." });
    return null;
  }
  return userId;
}

router.get("/shop-data", async (req, res): Promise<void> => {
  const ownerId = ownerIdFromRequest(req, res);
  if (!ownerId) return;

  try {
    const [record] = await db
      .select({ data: shopDataTable.data })
      .from(shopDataTable)
      .where(eq(shopDataTable.ownerId, ownerId))
      .limit(1);

    const response = GetShopDataResponse.parse({
      hasCloudData: Boolean(record),
      data: record?.data ?? emptySnapshot,
    });
    res.json(response);
  } catch (error) {
    req.log.error({ err: error }, "Unable to read owner shop data");
    res.status(503).json({ error: "Cloud storage is temporarily unavailable." });
  }
});

router.put("/shop-data", async (req, res): Promise<void> => {
  const ownerId = ownerIdFromRequest(req, res);
  if (!ownerId) return;

  const parsed = SaveShopDataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "The shop backup file is incomplete or invalid." });
    return;
  }

  try {
    await db
      .insert(shopDataTable)
      .values({
        ownerId,
        data: parsed.data,
      })
      .onConflictDoUpdate({
        target: shopDataTable.ownerId,
        set: {
          data: parsed.data,
          updatedAt: new Date(),
        },
      });

    res.json(
      SaveShopDataResponse.parse({
        hasCloudData: true,
        data: parsed.data,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Unable to save owner shop data");
    res.status(503).json({ error: "Cloud storage is temporarily unavailable." });
  }
});

export default router;
