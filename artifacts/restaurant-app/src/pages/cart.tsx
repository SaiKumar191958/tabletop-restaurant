import { Link } from "react-router-dom";
import { useCart } from "@/lib/cart-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();
  const { config } = useRestaurant();

  const isRestaurantOpen = config?.is_open ?? true;
  const packingCharge = config?.packing_charge || 20;
  const grandTotal = total + packingCharge;

  if (items.length === 0) {
    return (
      <div className="page-container py-16 sm:py-20 text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">Looks like you haven't added anything yet.</p>
        <Link to="/menu">
          <Button size="lg">Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-5 sm:py-8">
      <h1 className="page-title mb-6 sm:mb-8">Your Cart</h1>

      {!isRestaurantOpen && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          The restaurant is currently closed. You can review your cart but cannot place an order right now.
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
          {items.map((item) => (
            <div
              key={item.food_item_id}
              className="bg-card border border-card-border rounded-2xl p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl">🍽️</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground line-clamp-2 sm:line-clamp-1">{item.name}</h3>
                  <p className="text-primary font-semibold mt-1 text-sm sm:text-base">
                    ₹{Number(item.price).toFixed(2)} each
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 sm:shrink-0 border-t border-border pt-3 sm:border-0 sm:pt-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.food_item_id, item.quantity - 1)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    {item.quantity >= item.current_stock && (
                      <span className="text-[10px] text-orange-600 font-bold whitespace-nowrap">MAX</span>
                    )}
                  </div>
                  <button
                    onClick={() => updateQty(item.food_item_id, item.quantity + 1)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Increase quantity"
                    disabled={item.quantity >= item.current_stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-foreground text-base sm:text-lg">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.food_item_id)}
                    className="text-destructive hover:text-destructive/80 p-1 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-80 shrink-0">
          <div className="bg-card border border-card-border rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.food_item_id} className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground line-clamp-1 flex-1">{item.name} x{item.quantity}</span>
                  <span className="font-medium shrink-0">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Packing Charge</span>
                <span>₹{packingCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <Link to={isRestaurantOpen ? "/checkout" : "#"}>
              <Button className="w-full h-11 mt-6" disabled={!isRestaurantOpen}>
                Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/menu">
              <Button variant="ghost" className="w-full mt-2">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
