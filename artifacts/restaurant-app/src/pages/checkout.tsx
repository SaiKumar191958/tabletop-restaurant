import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  useCreateOrder,
  useUpdateProfile,
  useCreateAddress,
  useUpdateAddress,
  type PaymentMethod,
  type Address
} from "@/lib/api-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import api from "@/lib/api";
import {
  MapPin,
  Smartphone,
  Banknote,
  Loader2,
  Info,
  CheckCircle2,
  Home,
  Briefcase,
  MoreHorizontal,
  Plus,
  Edit2,
  UserCircle
} from "lucide-react";

export default function CheckoutPage() {
  const { user, guestLogin, login } = useAuth();
  const { items, total, clearCart } = useCart();
  const { config } = useRestaurant();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dialog states
  const [authDialogOpen, setAuthOpen] = useState(false);
  const [guestAcknowledgeOpen, setGuestOpen] = useState(false);
  const [addressDialogOpen, setAddressOpen] = useState(false);

  // Form states
  const [phone, setPhone] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new' | null>(null);
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newAddressType, setNewAddressType] = useState<'home' | 'work' | 'other'>('home');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [isPickupOnly, setIsPickupOnly] = useState(false);

  const createOrderMutation = useCreateOrder();
  const updateProfileMutation = useUpdateProfile();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();

  const packingCharge = config?.packing_charge || 20;
  const gstPercent = config?.gst_percentage || 5;
  const gstAmount = (total * gstPercent) / 100;
  const grandTotal = total + packingCharge + gstAmount;

  // Initial setup based on user status
  useEffect(() => {
    if (!user) {
      setAuthOpen(true);
    } else {
      setPhone(user.phone || "");
      setIsPickupOnly(user.role === 'guest');
      
      const defaultAddr = user.addresses?.find(a => a.is_default) || user.addresses?.[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (user.role !== 'guest') {
        setSelectedAddressId('new');
      }
    }
  }, [user]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const { data } = await api.post("auth/google-login/", {
        id_token: credentialResponse.credential,
      });
      await login(data.access, data.refresh);
      setAuthOpen(false);
      toast.success("Signed in with Google");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Google sign-in failed");
    }
  };

  const handleContinueAsGuest = async () => {
    setAuthOpen(false);
    setGuestOpen(true);
  };

  const confirmGuestAccess = async () => {
    try {
      await guestLogin();
      setGuestOpen(false);
      setIsPickupOnly(true);
      toast.success("Guest access enabled (Pickup only)");
    } catch (error) {
      toast.error("Guest login failed");
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddressLine.trim()) return;
    
    try {
      const res = await createAddressMutation.mutateAsync({
        data: {
          address_line: newAddressLine,
          address_type: newAddressType,
          is_default: true
        }
      });
      setSelectedAddressId(res.id);
      setAddressOpen(false);
      setNewAddressLine("");
      toast.success("Address saved");
    } catch (err) {
      toast.error("Failed to save address");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!phone.trim()) {
      toast.error("Mobile number is required");
      return;
    }

    // Save phone if changed/new
    if (phone !== user?.phone) {
      await updateProfileMutation.mutateAsync({ data: { phone } });
    }

    let deliveryAddress = "Restaurant Pickup";
    if (!isPickupOnly) {
      const selected = user?.addresses?.find(a => a.id === selectedAddressId);
      if (!selected && selectedAddressId === 'new' && newAddressLine.trim()) {
        const res = await createAddressMutation.mutateAsync({
          data: { address_line: newAddressLine, address_type: newAddressType, is_default: true }
        });
        deliveryAddress = res.address_line;
      } else if (selected) {
        deliveryAddress = selected.address_line;
      } else {
        toast.error("Please provide a delivery address");
        return;
      }
    }

    createOrderMutation.mutate(
      {
        data: {
          address: deliveryAddress,
          phone,
          items: items.map((i) => ({ food_item_id: i.food_item_id, quantity: i.quantity })),
          payment_method: paymentMethod,
        },
      },
      {
        onSuccess: () => {
          clearCart();
          toast.success("Order Placed Successfully!");
          navigate("/orders");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Checkout failed");
        },
      }
    );
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  if (!user && !authDialogOpen) return null;

  return (
    <div className="page-container py-5 sm:py-8">
      <h1 className="page-title mb-6 sm:mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
          {/* Mobile Number Section */}
          <Card className="border-card-border rounded-2xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-bold text-lg">Contact Information</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery/Pickup Section */}
          <Card className="border-card-border rounded-2xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-bold text-lg">Order Type</h2>
              </div>

              {isPickupOnly ? (
                <div className="bg-muted/50 p-4 rounded-xl border border-dashed border-border flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Restaurant Pickup Only</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Guest orders are currently restricted to self-pickup at the restaurant.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user?.addresses?.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedAddressId === addr.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-muted-foreground/30 bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getAddressIcon(addr.address_type)}
                          <span className="text-xs font-bold uppercase tracking-wider">{addr.address_type}</span>
                          {addr.is_default && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-auto">Default</span>}
                        </div>
                        <p className="text-sm line-clamp-2 text-muted-foreground">{addr.address_line}</p>
                        {selectedAddressId === addr.id && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-primary fill-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => setAddressOpen(true)}
                      className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-sm font-medium">Add New Address</span>
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card className="border-card-border rounded-2xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-bold text-lg">Payment Method</h2>
              </div>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Label
                  htmlFor="cod"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  }`}
                >
                  <RadioGroupItem value="cod" id="cod" className="sr-only" />
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Cash on Delivery</p>
                    <p className="text-[10px] text-muted-foreground">Pay when you receive</p>
                  </div>
                </Label>
                {/* ... other payment methods placeholder */}
              </RadioGroup>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 text-lg font-bold shadow-xl"
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Placing Order...
              </>
            ) : (
              `Confirm Order • ₹${grandTotal.toFixed(2)}`
            )}
          </Button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="lg:w-96">
          <div className="bg-card border border-card-border rounded-2xl p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {items.map((item) => (
                  <div key={item.food_item_id} className="flex justify-between items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Packing Charge</span>
                  <span className="font-medium">₹{packingCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({gstPercent}%)</span>
                  <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <Dialog open={authDialogOpen} onOpenChange={(open) => !open && navigate("/cart")}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6 overflow-hidden">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">Checkout</DialogTitle>
            <DialogDescription>Choose how you'd like to proceed with your order</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google Login Failed")}
                useOneTap
                theme="outline"
                width="320px"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12 gap-2 border-primary/20 hover:bg-primary/5"
              onClick={handleContinueAsGuest}
            >
              <UserCircle className="w-5 h-5 text-primary" />
              Continue as Guest
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guest Acknowledge Modal */}
      <Dialog open={guestAcknowledgeOpen} onOpenChange={setGuestOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">Notice for Guest Orders</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Guest users cannot use the delivery service. All guest orders are available for <span className="font-bold text-foreground">restaurant pickup only</span>.
            </p>
            <p className="text-xs bg-muted p-3 rounded-lg border border-border italic">
              Please sign in with Google if you require delivery to your home or office.
            </p>
          </div>
          <DialogFooter>
            <Button className="w-full h-11" onClick={confirmGuestAccess}>
              I Understand, Continue to Pickup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Address Modal */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Delivery Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Address Type</Label>
              <RadioGroup value={newAddressType} onValueChange={(v) => setNewAddressType(v as any)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="home" id="home-type" />
                  <Label htmlFor="home-type" className="flex items-center gap-1.5 cursor-pointer"><Home className="w-3.5 h-3.5" /> Home</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="work" id="work-type" />
                  <Label htmlFor="work-type" className="flex items-center gap-1.5 cursor-pointer"><Briefcase className="w-3.5 h-3.5" /> Work</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other-type" />
                  <Label htmlFor="other-type" className="flex items-center gap-1.5 cursor-pointer"><MoreHorizontal className="w-3.5 h-3.5" /> Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-line">Full Address</Label>
              <Textarea 
                id="addr-line" 
                placeholder="House No, Building, Street, Landmark..." 
                className="min-h-[100px] rounded-xl"
                value={newAddressLine}
                onChange={(e) => setNewAddressLine(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddressOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress} disabled={!newAddressLine.trim()}>Save Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
