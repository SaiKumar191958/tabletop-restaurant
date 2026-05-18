import {
  useListAllOrders,
  useUpdateOrderStatus,
  getListAllOrdersQueryKey,
} from "@/lib/api-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PaymentBadge } from "@/components/payment-badge";
import { ClipboardList } from "lucide-react";

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
  const { data: orders, isLoading } = useListAllOrders();
  const updateMutation = useUpdateOrderStatus();
  const { toast } = useToast();

  const handleStatusChange = (id: number, status: OrderStatus) => {
    updateMutation.mutate(
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
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
        <h1 className="page-title">All Orders</h1>
        <span className="text-muted-foreground text-sm">({orders?.length ?? 0})</span>
      </div>

      {orders?.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No orders yet.</p>
      ) : (
        <div className="bg-card border border-card-border rounded-2xl overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[36rem]">
            <thead className="bg-muted/50 text-sm text-muted-foreground">
              <tr>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold">Order</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden md:table-cell">Customer</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden lg:table-cell">Items</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold">Total</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden md:table-cell">Payment</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden sm:table-cell">Status</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders?.map((order) => {
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
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground hidden lg:table-cell">
                      {order.items?.map((i) => i.food_item?.name).filter(Boolean).slice(0, 2).join(", ")}
                      {(order.items?.length ?? 0) > 2 && ` +${(order.items?.length ?? 0) - 2} more`}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-primary">${order.total_price.toFixed(2)}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                      <PaymentBadge order={order} />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[status] ?? ""}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <Select
                        value={status}
                        onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className="w-full min-w-[7rem] sm:w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
