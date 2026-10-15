import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const shopDataTable = pgTable("shop_data", {
  ownerId: text("owner_id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ShopDataRow = typeof shopDataTable.$inferSelect;
