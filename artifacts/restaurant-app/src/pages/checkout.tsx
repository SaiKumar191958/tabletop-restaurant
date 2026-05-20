import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateOrder,
  getListMyOrdersQueryKey,
  type PaymentMethod,
} from "@/lib/api-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Smartphone,
  Banknote,
  Loader2,
  Info,
  CheckCircle2
} from "lucide-react";

export default function CheckoutPage() {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const { items, total, clearCart } = useCart();
  const { config } = useRestaurant();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createOrderMutation = useCreateOrder();

  const packingCharge = config?.packing_charge || 20;
  const gstPercent = config?.gst_percentage || 5;
  const gstAmount = (total * gstPercent) / 100;
  const grandTotal = total + packingCharge + gstAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast({ title: "Cart is empty", description: "Add items before checkout.", variant: "destructive" });
      return;
    }
    if (!address.trim() || !phone.trim()) {
      toast({ 
        title: "Mandatory fields missing", 
        description: "Please enter both delivery address and mobile number.", 
        variant: "destructive" 
      });
      return;
    }

    createOrderMutation.mutate(
      {
        data: {
          address: `${name ? name + ", " : ""}${address}`,
          phone,
          items: items.map((i) => ({ food_item_id: i.food_item_id, quantity: i.quantity })),
          payment_method: paymentMethod,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyOrdersQueryKey() });
          clearCart();
          toast({
            title: "Order Placed Successfully!",
            description: "The restaurant has been notified. You can pay when you receive your order.",
          });
          navigate("/orders");
        },
        onError: () => {
          toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="page-container py-5 sm:py-8 max-w-5xl">
      <h1 className="page-title mb-6 sm:mb-8">Checkout</h1>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-primary">Ordering Process</p>
          <p className="text-muted-foreground mt-1">
            Once you place your order, the restaurant will receive a notification and start preparing your food. 
            You can pay the total amount via <strong>UPI or Cash</strong> when you receive your order.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 space-y-6">
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Delivery Details</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number *</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  placeholder="Enter your 10-digit mobile number" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                />
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
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Payment Method</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  paymentMethod === "cod"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Banknote className={`w-6 h-6 ${paymentMethod === "cod" ? "text-primary" : "text-muted-foreground"}`} />
                <span>Cash on Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  paymentMethod === "upi"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Smartphone className={`w-6 h-6 ${paymentMethod === "upi" ? "text-primary" : "text-muted-foreground"}`} />
                <span>UPI on Delivery</span>
              </button>
            </div>

            <div className="rounded-xl bg-muted/30 p-4 border border-border">
              <p className="text-sm text-muted-foreground">
                Total Payable: <span className="font-bold text-foreground">₹{grandTotal.toFixed(2)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {paymentMethod === "cod" 
                  ? "Please keep exact change ready if possible." 
                  : "The delivery partner will show you a QR code to pay via any UPI app."}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
              disabled={createOrderMutation.isPending || items.length === 0}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Placing Order...
                </>
              ) : (
                `Confirm Order — ₹${grandTotal.toFixed(2)}`
              )}
            </Button>
          </form>
        </div>

        <div className="lg:w-80 shrink-0">
          <div className="bg-card border border-card-border rounded-2xl p-6 sticky top-24">
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
                  <span className="text-sm font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Packing Charge</span>
                  <span className="font-medium text-foreground">₹{packingCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({gstPercent}%)</span>
                  <span className="font-medium text-foreground">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-green-600 font-bold uppercase text-[10px] tracking-wider">Free</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-xl pt-1">
                <span>Total</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
