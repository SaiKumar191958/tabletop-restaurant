import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateOrder, getListMyOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createOrderMutation = useCreateOrder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast({ title: "Cart is empty", description: "Add items to your cart before checking out.", variant: "destructive" });
      return;
    }

    createOrderMutation.mutate(
      {
        data: {
          address: `${name ? name + ", " : ""}${address}`,
          items: items.map((i) => ({ food_item_id: i.food_item_id, quantity: i.quantity })),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyOrdersQueryKey() });
          clearCart();
          toast({ title: "Order placed!", description: "Your order is on its way." });
          setLocation("/orders");
        },
        onError: () => {
          toast({ title: "Failed to place order", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left — delivery form */}
        <div className="flex-1">
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Delivery Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full delivery address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-2 font-semibold"
                disabled={createOrderMutation.isPending || items.length === 0}
              >
                {createOrderMutation.isPending ? (
                  "Placing Order..."
                ) : (
                  <>
                    <CheckCircle className="mr-2 w-4 h-4" />
                    Place Order — ${total.toFixed(2)}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Right — order summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.food_item_id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
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
          </div>
        </div>
      </div>
    </div>
  );
}
