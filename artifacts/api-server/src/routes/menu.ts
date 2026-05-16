import { Router } from "express";
import { db } from "@workspace/db";
import { foodItemsTable, categoriesTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, sql } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

function formatItem(item: typeof foodItemsTable.$inferSelect, category?: typeof categoriesTable.$inferSelect | null) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    image: item.image,
    food_type: item.foodType,
    is_available: item.isAvailable,
    rating: item.rating,
    category_id: item.categoryId,
    category: category ? { id: category.id, name: category.name, image: category.image } : undefined,
  };
}

// GET /api/menu/featured — must come before /api/menu/:id
router.get("/featured", async (req, res) => {
  try {
    const items = await db
      .select({ item: foodItemsTable, category: categoriesTable })
      .from(foodItemsTable)
      .leftJoin(categoriesTable, eq(foodItemsTable.categoryId, categoriesTable.id))
      .where(eq(foodItemsTable.isAvailable, true))
      .orderBy(sql`${foodItemsTable.rating} DESC`)
      .limit(8);
    res.json(items.map(({ item, category }) => formatItem(item, category)));
  } catch (err) {
    req.log.error({ err }, "List featured error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/menu
router.get("/", async (req, res) => {
  const { category_id, food_type, min_price, max_price, search } = req.query;
  try {
    const conditions = [];
    if (category_id) conditions.push(eq(foodItemsTable.categoryId, Number(category_id)));
    if (food_type && food_type !== "null") conditions.push(eq(foodItemsTable.foodType, String(food_type)));
    if (min_price) conditions.push(gte(foodItemsTable.price, String(min_price)));
    if (max_price) conditions.push(lte(foodItemsTable.price, String(max_price)));
    if (search) conditions.push(ilike(foodItemsTable.name, `%${search}%`));

    const items = await db
      .select({ item: foodItemsTable, category: categoriesTable })
      .from(foodItemsTable)
      .leftJoin(categoriesTable, eq(foodItemsTable.categoryId, categoriesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(items.map(({ item, category }) => formatItem(item, category)));
  } catch (err) {
    req.log.error({ err }, "List menu error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/menu/:id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [row] = await db
      .select({ item: foodItemsTable, category: categoriesTable })
      .from(foodItemsTable)
      .leftJoin(categoriesTable, eq(foodItemsTable.categoryId, categoriesTable.id))
      .where(eq(foodItemsTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Food item not found" });
      return;
    }
    res.json(formatItem(row.item, row.category));
  } catch (err) {
    req.log.error({ err }, "Get menu item error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/menu (admin)
router.post("/", authenticate, requireRole("admin", "superadmin"), async (req: AuthRequest, res) => {
  const { name, description, price, image, food_type, is_available, category_id } = req.body;
  if (!name || !price || !category_id) {
    res.status(400).json({ error: "name, price, and category_id are required" });
    return;
  }
  try {
    const [item] = await db.insert(foodItemsTable).values({
      name,
      description: description ?? null,
      price: String(price),
      image: image ?? null,
      foodType: food_type ?? "veg",
      isAvailable: is_available ?? true,
      categoryId: Number(category_id),
    }).returning();
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, item.categoryId)).limit(1);
    res.status(201).json(formatItem(item, category ?? null));
  } catch (err) {
    req.log.error({ err }, "Create menu item error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/menu/:id (admin)
router.put("/:id", authenticate, requireRole("admin", "superadmin"), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { name, description, price, image, food_type, is_available, category_id } = req.body;
  try {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = String(price);
    if (image !== undefined) updates.image = image;
    if (food_type !== undefined) updates.foodType = food_type;
    if (is_available !== undefined) updates.isAvailable = is_available;
    if (category_id !== undefined) updates.categoryId = Number(category_id);

    const [item] = await db.update(foodItemsTable).set(updates).where(eq(foodItemsTable.id, id)).returning();
    if (!item) {
      res.status(404).json({ error: "Food item not found" });
      return;
    }
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, item.categoryId)).limit(1);
    res.json(formatItem(item, category ?? null));
  } catch (err) {
    req.log.error({ err }, "Update menu item error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/menu/:id (admin)
router.delete("/:id", authenticate, requireRole("admin", "superadmin"), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  try {
    const deleted = await db.delete(foodItemsTable).where(eq(foodItemsTable.id, id)).returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Food item not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete menu item error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
