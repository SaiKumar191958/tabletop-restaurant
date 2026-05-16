import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, foodItemsTable, usersTable, categoriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function formatOrder(order: typeof ordersTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);
  const rawItems = await db
    .select({ item: orderItemsTable, food: foodItemsTable, category: categoriesTable })
    .from(orderItemsTable)
    .leftJoin(foodItemsTable, eq(orderItemsTable.foodItemId, foodItemsTable.id))
    .leftJoin(categoriesTable, eq(foodItemsTable.categoryId, categoriesTable.id))
    .where(eq(orderItemsTable.orderId, order.id));

  return {
    id: order.id,
    status: order.status,
    total_price: Number(order.totalPrice),
    address: order.address,
    created_at: order.createdAt,
    user: user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    } : undefined,
    items: rawItems.map(({ item, food, category }) => ({
      food_item_id: item.foodItemId,
      quantity: item.quantity,
      price: Number(item.price),
      food_item: food ? {
        id: food.id,
        name: food.name,
        description: food.description,
        price: Number(food.price),
        image: food.image,
        food_type: food.foodType,
        is_available: food.isAvailable,
        rating: food.rating,
        category_id: food.categoryId,
        category: category ? { id: category.id, name: category.name, image: category.image } : undefined,
      } : undefined,
    })),
  };
}

// POST /api/orders
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { items, address } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0 || !address) {
    res.status(400).json({ error: "items and address are required" });
    return;
  }
  try {
    // Calculate total price
    let totalPrice = 0;
    const enrichedItems: { food_item_id: number; quantity: number; price: number }[] = [];
    for (const item of items) {
      const [food] = await db.select().from(foodItemsTable).where(eq(foodItemsTable.id, item.food_item_id)).limit(1);
      if (!food) {
        res.status(400).json({ error: `Food item ${item.food_item_id} not found` });
        return;
      }
      const itemPrice = Number(food.price) * item.quantity;
      totalPrice += itemPrice;
      enrichedItems.push({ food_item_id: item.food_item_id, quantity: item.quantity, price: Number(food.price) });
    }

    const [order] = await db.insert(ordersTable).values({
      userId: req.userId!,
      status: "pending",
      totalPrice: String(totalPrice),
      address,
    }).returning();

    await db.insert(orderItemsTable).values(
      enrichedItems.map(i => ({
        orderId: order.id,
        foodItemId: i.food_item_id,
        quantity: i.quantity,
        price: String(i.price),
      }))
    );

    res.status(201).json(await formatOrder(order));
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/all (admin)
router.get("/all", authenticate, requireRole("admin", "superadmin"), async (req: AuthRequest, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const formatted = await Promise.all(orders.map(formatOrder));
    res.json(formatted);
  } catch (err) {
    req.log.error({ err }, "List all orders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders (my orders)
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, req.userId!))
      .orderBy(desc(ordersTable.createdAt));
    const formatted = await Promise.all(orders.map(formatOrder));
    res.json(formatted);
  } catch (err) {
    req.log.error({ err }, "List my orders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/orders/:id/status (admin)
router.patch("/:id/status", authenticate, requireRole("admin", "superadmin"), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "preparing", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  try {
    const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(await formatOrder(order));
  } catch (err) {
    req.log.error({ err }, "Update order status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
