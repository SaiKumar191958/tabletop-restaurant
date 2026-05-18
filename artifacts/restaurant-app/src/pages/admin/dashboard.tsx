import { useGetDashboardStats } from "@/lib/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, DollarSign, Users, UtensilsCrossed, TrendingUp } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-500",
  confirmed: "bg-blue-500",
  preparing: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <div className="page-container py-5 sm:py-8">
        <h1 className="page-title mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Orders", value: stats?.total_orders ?? 0, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Revenue", value: `$${(stats?.total_revenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Menu Items", value: stats?.total_menu_items ?? 0, icon: UtensilsCrossed, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const maxCount = Math.max(...(stats?.orders_by_status?.map((s) => s.count) ?? [1]), 1);

  return (
    <div className="page-container py-5 sm:py-8">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card border border-card-border rounded-2xl p-4 sm:p-6">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <p className="text-muted-foreground text-sm">{card.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-6">Orders by Status</h2>
          <div className="space-y-4">
            {stats?.orders_by_status?.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium capitalize">{s.status}</span>
                  <span className="text-muted-foreground">{s.count}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${STATUS_COLORS[s.status] ?? "bg-gray-400"}`}
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-6">Recent Orders</h2>
          <div className="space-y-3">
            {stats?.recent_orders?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            ) : (
              stats?.recent_orders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">${order.total_price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
