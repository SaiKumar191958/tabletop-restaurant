import { useListMyOrders } from "@/lib/api-hooks";
import { PaymentBadge } from "@/components/payment-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700",  icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700",      icon: CheckCircle },
  preparing: { label: "Preparing", color: "bg-orange-100 text-orange-700",  icon: Package },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700",    icon: Truck },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700",        icon: XCircle },
} as const;

export default function OrdersPage() {
  const { data: orders, isLoading } = useListMyOrders();

  if (isLoading) {
    return (
      <div className="page-container py-5 sm:py-8">
        <h1 className="page-title mb-6">My Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="page-container py-16 sm:py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">No orders yet</h2>
        <p className="text-muted-foreground">Your order history will appear here once you place your first order.</p>
      </div>
    );
  }

  return (
    <div className="page-container py-5 sm:py-8">
      <h1 className="page-title mb-2">My Orders</h1>
      <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>

      <div className="space-y-4">
        {orders.map((order) => {
          const status = order.status as keyof typeof STATUS_CONFIG;
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
          const Icon = cfg.icon;

          return (
            <div key={order.id} className="bg-card border border-card-border rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                    <h3 className="font-bold text-base sm:text-lg">Order #{order.id}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.address}
                    {order.phone && <span className="block text-xs mt-0.5 font-medium text-foreground/70">📞 {order.phone}</span>}
                  </p>
                  <PaymentBadge order={order} />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">₹{order.total_price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{order.items?.length ?? 0} items</p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-border pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                        {item.food_item?.image ? (
                          <img src={item.food_item.image} alt={item.food_item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.food_item?.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity} · ₹{item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
