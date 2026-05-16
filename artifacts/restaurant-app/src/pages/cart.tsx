import { Link } from "wouter";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
        <Link href="/menu">
          <Button size="lg">Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Your Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart items */}
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <div key={item.food_item_id} className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl">🍽️</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
                <p className="text-primary font-semibold mt-1">${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => updateQty(item.food_item_id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.food_item_id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                <button
                  onClick={() => removeItem(item.food_item_id)}
                  className="text-destructive hover:text-destructive/80 mt-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-card border border-card-border rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.food_item_id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full h-11 mt-6">
                Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/menu">
              <Button variant="ghost" className="w-full mt-2">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
