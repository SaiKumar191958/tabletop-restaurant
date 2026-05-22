import { useGetDashboardStats, useListDailyReports } from "@/lib/api-hooks";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Banknote, Users, UtensilsCrossed, TrendingUp, Settings, FileText, List, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-500",
  confirmed: "bg-blue-500",
  preparing: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: reports, isLoading: reportsLoading } = useListDailyReports();

  const [expandedReport, setExpandedReport] = useState<number | null>(null);

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
    { label: "Total Orders", value: stats?.total_orders ?? 0, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/orders" },
    { label: "Total Revenue", value: `₹${(stats?.total_revenue ?? 0).toFixed(2)}`, icon: Banknote, color: "text-green-600", bg: "bg-green-50", link: "/admin/orders" },
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50", link: "/superadmin/users" },
    { label: "Menu Items", value: stats?.total_menu_items ?? 0, icon: UtensilsCrossed, color: "text-orange-600", bg: "bg-orange-50", link: "/admin/menu" },
  ];

  const maxCount = Math.max(...(stats?.orders_by_status?.map((s) => s.count) ?? [1]), 1);

  return (
    <div className="page-container py-5 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          <h1 className="page-title">Dashboard</h1>
        </div>
        <Link to="/admin/settings">
          <Button className="gap-2">
            <Settings className="w-4 h-4" />
            Restaurant Settings
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link 
              key={card.label} 
              to={card.link}
              className="bg-card border border-card-border rounded-2xl p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <p className="text-muted-foreground text-sm">{card.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground mt-1">{card.value}</p>
            </Link>
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
                    <p className="text-sm font-bold text-primary">₹{order.total_price.toFixed(2)}</p>
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

      {/* Daily Reports Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-6">
          <List className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Daily Performance Reports</h2>
        </div>

        {reportsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : !reports || reports.length === 0 ? (
          <p className="text-muted-foreground text-center py-12 bg-card border border-dashed rounded-2xl">
            No daily reports generated yet. Reports are automatically created at opening time for the previous day.
          </p>
        ) : (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <div key={report.id} className="bg-card border border-card-border rounded-2xl overflow-hidden">
                <div 
                  className="p-4 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-xs text-muted-foreground">{report.total_orders} orders • {report.total_users_active} active users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-primary">₹{Number(report.total_revenue).toFixed(2)}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Revenue</p>
                    </div>
                    {expandedReport === report.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </div>

                {expandedReport === report.id && (
                  <div className="border-t border-border bg-muted/20">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                            <th className="px-6 py-3 text-left font-semibold">Menu Item</th>
                            <th className="px-6 py-3 text-center font-semibold">Sold</th>
                            <th className="px-6 py-3 text-center font-semibold">Left</th>
                            <th className="px-6 py-3 text-right font-semibold">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {report.item_reports.map((item: any) => (
                            <tr key={item.id} className={item.quantity_sold > 0 ? "bg-primary/5" : ""}>
                              <td className="px-6 py-4 font-medium">{item.food_item_name}</td>
                              <td className="px-6 py-3 text-center">{item.quantity_sold}</td>
                              <td className="px-6 py-3 text-center text-muted-foreground">{item.quantity_left}</td>
                              <td className="px-6 py-3 text-right font-bold">₹{Number(item.revenue).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
