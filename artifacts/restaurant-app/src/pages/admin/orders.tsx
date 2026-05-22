import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useListAllOrders,
  useUpdateOrderStatus,
  useUpdateOrder,
  useListMenuItems,
  getListAllOrdersQueryKey,
  type Order,
  type OrderItem,
} from "@/lib/api-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PaymentBadge } from "@/components/payment-badge";
import { ClipboardList, Edit, Plus, Minus, Trash2, Save, X, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = ["pending", "confirmed", "preparing", "delivered", "cancelled"] as const;
type OrderStatus = typeof STATUSES[number];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: orders, isLoading } = useListAllOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  const updateOrderMutation = useUpdateOrder();
  const { data: menuItems } = useListMenuItems();
  const { toast } = useToast();

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editItems, setEditItems] = useState<{ food_item_id: number; name: string; quantity: number; price: number }[]>([]);
  const [orderSearch, setOrderSearch] = useState("");

  const filteredOrders = orders?.filter(order => {
    const q = orderSearch.toLowerCase();
    return (
      order.id.toString().includes(q) ||
      order.user?.username.toLowerCase().includes(q) ||
      order.user?.email?.toLowerCase().includes(q) ||
      order.phone.includes(q) ||
      order.address.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = (id: number, status: OrderStatus) => {
    updateStatusMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
          toast({ title: "Order status updated" });
        },
        onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
      }
    );
  };

  const startEditing = (order: Order) => {
    setEditingOrder(order);
    setEditAddress(order.address);
    setEditPhone(order.phone);
    setEditItems(
      (order.items || []).map((item) => ({
        food_item_id: item.food_item?.id || 0,
        name: item.food_item?.name || "Unknown Item",
        quantity: item.quantity,
        price: item.price,
      }))
    );
  };

  const handleUpdateItemQuantity = (id: number, delta: number) => {
    setEditItems(prev => prev.map(item => {
      if (item.food_item_id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: number) => {
    setEditItems(prev => prev.filter(item => item.food_item_id !== id));
  };

  const handleAddItem = (foodItemId: string) => {
    const id = parseInt(foodItemId);
    const menuItem = menuItems?.find(m => m.id === id);
    if (!menuItem) return;

    setEditItems(prev => {
      const existing = prev.find(i => i.food_item_id === id);
      if (existing) {
        return prev.map(i => i.food_item_id === id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { food_item_id: id, name: menuItem.name, quantity: 1, price: menuItem.price }];
    });
  };

  const handleSaveOrder = () => {
    if (!editingOrder) return;
    if (editItems.length === 0) {
      toast({ title: "Order must have items", variant: "destructive" });
      return;
    }

    updateOrderMutation.mutate(
      {
        id: editingOrder.id,
        data: {
          address: editAddress,
          phone: editPhone,
          payment_method: editingOrder.payment_method || "cod",
          items: editItems.map(i => ({ food_item_id: i.food_item_id, quantity: i.quantity })),
        }
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
          toast({ title: "Order updated successfully" });
          setEditingOrder(null);
        },
        onError: () => toast({ title: "Failed to update order", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="page-container py-5 sm:py-8">
        <h1 className="page-title mb-6">All Orders</h1>
        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="page-container py-5 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          <h1 className="page-title">All Orders</h1>
          <span className="text-muted-foreground text-sm">({orders?.length ?? 0})</span>
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={orderSearch} 
            onChange={(e) => setOrderSearch(e.target.value)} 
            placeholder="Search by ID, name, email, phone..." 
            className="pl-9"
          />
        </div>
      </div>

      {filteredOrders?.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No orders found.</p>
      ) : (
        <div className="bg-card border border-card-border rounded-2xl overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[45rem]">
            <thead className="bg-muted/50 text-sm text-muted-foreground">
              <tr>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold">Order</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden md:table-cell">Customer</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden lg:table-cell">Items</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold">Total</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden md:table-cell">Payment</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden sm:table-cell">Status</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders?.map((order) => {
                const status = order.status as OrderStatus;
                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <p className="font-semibold">#{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                      <p className="text-sm font-medium">{order.user?.username ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{order.phone}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight max-w-[12rem] truncate">{order.address}</p>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground hidden lg:table-cell">
                      {order.items?.map((i) => i.food_item?.name).filter(Boolean).slice(0, 2).join(", ")}
                      {(order.items?.length ?? 0) > 2 && ` +${(order.items?.length ?? 0) - 2} more`}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-primary">₹{order.total_price.toFixed(2)}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                      <PaymentBadge order={order} />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[status] ?? ""}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2">
                        <Select
                          value={status}
                          onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-full min-w-[7rem] sm:w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {user?.role === "superadmin" && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={() => startEditing(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Order Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order #{editingOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Delivery Address</Label>
                <Textarea
                  id="edit-address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">Order Items</Label>
                <div className="w-48">
                  <Select onValueChange={handleAddItem}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Add item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} - ₹{item.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Item</th>
                      <th className="text-center px-4 py-2 font-medium">Qty</th>
                      <th className="text-right px-4 py-2 font-medium">Price</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {editItems.map((item) => (
                      <tr key={item.food_item_id}>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleUpdateItemQuantity(item.food_item_id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-4 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleUpdateItemQuantity(item.food_item_id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveItem(item.food_item_id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 font-bold">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-right">Subtotal</td>
                      <td className="px-4 py-2 text-right">
                        ₹{editItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingOrder(null)} disabled={updateOrderMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrder} disabled={updateOrderMutation.isPending}>
              {updateOrderMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
