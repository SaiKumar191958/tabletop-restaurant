import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  food_item_id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("restaurant_cart");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("restaurant_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.food_item_id === item.food_item_id);
      if (existing) {
        return current.map((i) =>
          i.food_item_id === item.food_item_id
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...current, { ...item, quantity: qty }];
    });
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((i) => i.food_item_id !== id));
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((current) =>
      current.map((i) => (i.food_item_id === id ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
