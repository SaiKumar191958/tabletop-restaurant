import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import MenuPage from "@/pages/menu";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import OrdersPage from "@/pages/orders";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminMenu from "@/pages/admin/menu";
import AdminOrders from "@/pages/admin/orders";
import SuperAdminUsers from "@/pages/superadmin/users";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/menu" component={MenuPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/checkout">
              <ProtectedRoute allowedRoles={["user", "admin", "superadmin"]}>
                <CheckoutPage />
              </ProtectedRoute>
            </Route>
            <Route path="/orders">
              <ProtectedRoute allowedRoles={["user", "admin", "superadmin"]}>
                <OrdersPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/dashboard">
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/menu">
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminMenu />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/orders">
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminOrders />
              </ProtectedRoute>
            </Route>
            <Route path="/superadmin/users">
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <SuperAdminUsers />
              </ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
