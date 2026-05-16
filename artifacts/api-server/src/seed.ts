import bcrypt from "bcryptjs";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const superHash = await bcrypt.hash("super123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);

  await pool.query(
    `INSERT INTO users (username, email, password_hash, role, phone) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING`,
    ["superadmin", "super@tabletop.com", superHash, "superadmin", "555-0001"]
  );
  await pool.query(
    `INSERT INTO users (username, email, password_hash, role, phone) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING`,
    ["admin", "admin@tabletop.com", adminHash, "admin", "555-0002"]
  );
  await pool.query(
    `INSERT INTO users (username, email, password_hash, role, phone) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING`,
    ["john_doe", "user@tabletop.com", userHash, "user", "555-0003"]
  );
  console.log("Users seeded");

  const cats = ["Burgers", "Pizza", "Pasta", "Salads", "Desserts", "Drinks"];
  for (const name of cats) {
    await pool.query(`INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING`, [name]);
  }
  console.log("Categories seeded");

  const { rows: catRows } = await pool.query("SELECT id, name FROM categories ORDER BY id");
  const catMap: Record<string, number> = Object.fromEntries(catRows.map((r: { name: string; id: number }) => [r.name, r.id]));

  const items = [
    { name: "Classic Beef Burger", desc: "Juicy beef patty with lettuce, tomato, and our signature sauce", price: "12.99", type: "nonveg", cat: "Burgers", rating: 4.8 },
    { name: "Chicken Avocado Burger", desc: "Grilled chicken breast with fresh avocado and chipotle mayo", price: "13.99", type: "nonveg", cat: "Burgers", rating: 4.6 },
    { name: "Veggie Delight Burger", desc: "House-made black bean patty with roasted peppers", price: "11.99", type: "veg", cat: "Burgers", rating: 4.3 },
    { name: "Margherita Pizza", desc: "San Marzano tomatoes, fresh mozzarella, and basil on thin crust", price: "14.99", type: "veg", cat: "Pizza", rating: 4.7 },
    { name: "BBQ Chicken Pizza", desc: "Smoky BBQ sauce, grilled chicken, red onions, and mozzarella", price: "16.99", type: "nonveg", cat: "Pizza", rating: 4.5 },
    { name: "Truffle Mushroom Pizza", desc: "Truffle oil, wild mushrooms, fontina, and fresh thyme", price: "17.99", type: "veg", cat: "Pizza", rating: 4.9 },
    { name: "Spaghetti Carbonara", desc: "Creamy egg sauce with pancetta, pecorino, and black pepper", price: "15.99", type: "nonveg", cat: "Pasta", rating: 4.7 },
    { name: "Penne Arrabbiata", desc: "Spicy tomato sauce with garlic and fresh herbs", price: "13.99", type: "veg", cat: "Pasta", rating: 4.4 },
    { name: "Caesar Salad", desc: "Crisp romaine, parmesan shavings, croutons, and classic Caesar dressing", price: "10.99", type: "veg", cat: "Salads", rating: 4.5 },
    { name: "Grilled Chicken Salad", desc: "Mixed greens, grilled chicken, cherry tomatoes, and balsamic vinaigrette", price: "12.99", type: "nonveg", cat: "Salads", rating: 4.6 },
    { name: "Tiramisu", desc: "Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream", price: "7.99", type: "veg", cat: "Desserts", rating: 4.9 },
    { name: "Chocolate Lava Cake", desc: "Warm chocolate cake with a molten center, served with vanilla ice cream", price: "8.99", type: "veg", cat: "Desserts", rating: 4.8 },
    { name: "Fresh Lemonade", desc: "Hand-squeezed lemonade with mint and a hint of ginger", price: "4.99", type: "veg", cat: "Drinks", rating: 4.6 },
    { name: "Mango Lassi", desc: "Thick and creamy yogurt drink blended with fresh mango", price: "5.49", type: "veg", cat: "Drinks", rating: 4.7 },
  ];

  for (const item of items) {
    await pool.query(
      `INSERT INTO food_items (name, description, price, food_type, is_available, rating, category_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [item.name, item.desc, item.price, item.type, true, item.rating, catMap[item.cat]]
    );
  }
  console.log("Food items seeded");
  await pool.end();
}

seed().catch(console.error);
