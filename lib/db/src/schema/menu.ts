import { pgTable, serial, varchar, text, decimal, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const foodItemsTable = pgTable("food_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  image: text("image"),
  foodType: varchar("food_type", { length: 10 }).notNull().default("veg"),
  isAvailable: boolean("is_available").notNull().default(true),
  rating: real("rating").notNull().default(0.0),
});

export const insertFoodItemSchema = createInsertSchema(foodItemsTable).omit({ id: true });
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItemsTable.$inferSelect;
