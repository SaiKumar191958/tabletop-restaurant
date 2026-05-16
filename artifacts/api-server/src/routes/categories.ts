import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable);
    res.json(categories.map(c => ({ id: c.id, name: c.name, image: c.image })));
  } catch (err) {
    req.log.error({ err }, "List categories error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
