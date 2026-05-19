import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateOrder,
  usePaymentConfig,
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
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

const PAYMENT_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  card: CreditCard,
  upi: Smartphone,
  cod: Banknote,
};

export default function CheckoutPage() {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const { items, total, clearCart } = useCart();
  const { config } = useRestaurant();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createOrderMutation = useCreateOrder();
  const { data: paymentConfig } = usePaymentConfig();

  const packingCharge = config?.packing_charge || 20;
  const grandTotal = total + packingCharge;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast({ title: "Cart is empty", description: "Add items before checkout.", variant: "destructive" });
      return;
    }
    if (!address.trim()) {
      toast({ title: "Address required", variant: "destructive" });
      return;
    }
    if (paymentMethod === "upi" && !upiId.trim()) {
      toast({ title: "Enter UPI ID", description: "e.g. name@upi", variant: "destructive" });
      return;
    }
    if (paymentMethod === "card") {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 12) {
        toast({ title: "Invalid card", description: "Enter a valid card number.", variant: "destructive" });
        return;
      }
      if (!cardName.trim() || !cardExpiry.trim() || cardCvv.length < 3) {
        toast({ title: "Complete card details", variant: "destructive" });
        return;
      }
    }

    createOrderMutation.mutate(
      {
        data: {
          address: `${name ? name + ", " : ""}${address}`,
          items: items.map((i) => ({ food_item_id: i.food_item_id, quantity: i.quantity })),
          payment_method: paymentMethod,
          card_number: paymentMethod === "card" ? cardNumber.replace(/\D/g, "") : undefined,
        },
      },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getListMyOrdersQueryKey() });
          if (order.payment_status === "failed") {
            toast({
              title: "Payment failed",
              description: "Demo: use a different card or try UPI / COD.",
              variant: "destructive",
            });
            return;
          }
          clearCart();
          const paid = order.payment_status === "paid";
          toast({
            title: paid ? "Payment successful!" : "Order placed!",
            description: paid
              ? `Paid via ${order.payment_method?.toUpperCase()} · Ref ${order.payment_reference}`
              : "Pay cash on delivery when your order arrives.",
          });
          navigate("/orders");
        },
        onError: () => {
          toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
        },
      },
    );
  };

  const submitLabel =
    paymentMethod === "cod"
      ? `Place Order (COD) — ₹${grandTotal.toFixed(2)}`
      : `Pay ₹${grandTotal.toFixed(2)} (Demo)`;

  return (
    <div className="page-container py-5 sm:py-8 max-w-5xl">
      <h1 className="page-title mb-6 sm:mb-8">Checkout</h1>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 text-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-100">Demo payment mode</p>
          <p className="text-amber-800/90 dark:text-amber-200/80 mt-1">
            {paymentConfig?.message ??
              "No real money is charged. This mimics Razorpay Checkout until live keys are added."}
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Razorpay Checkout (Demo)</h2>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">STATIC</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["upi", "card", "cod"] as PaymentMethod[]).map((method) => {
                const Icon = PAYMENT_ICONS[method];
                const labels = { upi: "UPI", card: "Card", cod: "COD" };
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors ${
                      paymentMethod === method
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {labels[method]}
                  </button>
                );
              })}
            </div>

            {paymentMethod === "upi" && (
              <div className="space-y-2 rounded-lg border border-dashed border-border p-4">
                <Label htmlFor="upi">UPI ID</Label>
                <Input
                  id="upi"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Demo: any valid-looking UPI ID will succeed.</p>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="4111 1111 1111 1111"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" maxLength={4} value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on card</Label>
                  <Input id="cardName" placeholder="As on card" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                </div>
                {paymentConfig?.demo_fail_card && (
                  <p className="text-xs text-muted-foreground">
                    Demo fail card: {paymentConfig.demo_fail_card}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === "cod" && (
              <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
                Pay with cash when your order is delivered. No online payment now.
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-semibold"
              disabled={createOrderMutation.isPending || items.length === 0}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </form>
        </div>

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
                  <span className="text-sm font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Packing Charge</span>
                <span className="font-medium">₹{packingCharge.toFixed(2)}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
