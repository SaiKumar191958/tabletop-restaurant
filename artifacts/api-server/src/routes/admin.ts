import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, ordersTable, foodItemsTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/admin/dashboard
router.get("/dashboard", authenticate, requireRole("admin", "superadmin"), async (req: AuthRequest, res) => {
  try {
    const [{ total_orders }] = await db.select({ total_orders: count() }).from(ordersTable);
    const [{ total_revenue }] = await db.select({ total_revenue: sum(ordersTable.totalPrice) }).from(ordersTable);
    const [{ total_users }] = await db.select({ total_users: count() }).from(usersTable);
    const [{ total_menu_items }] = await db.select({ total_menu_items: count() }).from(foodItemsTable);

    const statuses = ["pending", "confirmed", "preparing", "delivered", "cancelled"];
    const orders_by_status = await Promise.all(
      statuses.map(async (status) => {
        const [{ c }] = await db
          .select({ c: count() })
          .from(ordersTable)
          .where(eq(ordersTable.status, status));
        return { status, count: Number(c) };
      })
    );

    const recentRaw = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5);
    const recent_orders = recentRaw.map(o => ({
      id: o.id,
      status: o.status,
      total_price: Number(o.totalPrice),
      address: o.address,
      created_at: o.createdAt,
    }));

    res.json({
      total_orders: Number(total_orders),
      total_revenue: Number(total_revenue ?? 0),
      total_users: Number(total_users),
      total_menu_items: Number(total_menu_items),
      orders_by_status,
      recent_orders,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users (superadmin)
router.get("/users", authenticate, requireRole("superadmin"), async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      phone: u.phone,
      profileImage: u.profileImage,
      createdAt: u.createdAt,
    })));
  } catch (err) {
    req.log.error({ err }, "List users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id/role (superadmin)
router.patch("/users/:id/role", authenticate, requireRole("superadmin"), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { role } = req.body;
  if (!["superadmin", "admin", "user"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  try {
    const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Update user role error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
