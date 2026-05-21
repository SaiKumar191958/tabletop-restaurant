import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User as UserIcon, Menu as MenuIcon, X, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout() {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col w-full pt-14 sm:pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { config } = useRestaurant();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const restaurantName = config?.name || "Sri Durga Military Hotel";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b-2 border-gray-300 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="page-container h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight truncate">{restaurantName}</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/menu" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Menu</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/cart" className="md:hidden relative p-2 -mr-1">
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {user.profile_image ? (
                        <img src={user.profile_image} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium hidden lg:block">{user.username}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === "superadmin" && (
                    <DropdownMenuItem asChild>
                      <Link to="/superadmin/users" className="cursor-pointer w-full">Manage Users</Link>
                    </DropdownMenuItem>
                  )}
                  {(user.role === "admin" || user.role === "superadmin") && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="cursor-pointer w-full">Admin Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/menu" className="cursor-pointer w-full">Manage Menu</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/orders" className="cursor-pointer w-full">Manage Orders</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer w-full">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
          <nav className="flex flex-col p-4 gap-4 pb-6">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Home</Link>
            <Link to="/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Menu</Link>
            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium flex items-center justify-between">
              Cart
              {cartItemCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {cartItemCount} items
                </span>
              )}
            </Link>
            <div className="h-px bg-border my-2" />
            
            {user ? (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                {user.role === "superadmin" && (
                  <Link to="/superadmin/users" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">Manage Users</Link>
                )}
                {(user.role === "admin" || user.role === "superadmin") && (
                  <>
                    <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">Admin Dashboard</Link>
                    <Link to="/admin/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">Manage Menu</Link>
                    <Link to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">Manage Orders</Link>
                  </>
                )}
                <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">My Orders</Link>
                
                <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { config } = useRestaurant();
  const restaurantName = config?.name || "Sri Durga Military Hotel";

  return (
    <footer className="bg-secondary text-secondary-foreground py-10 sm:py-12 mt-auto">
      <div className="page-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md inline-block">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight">{restaurantName}</span>
          </Link>
          <p className="text-secondary-foreground/70 max-w-sm">
            Bringing the best flavors from your favorite local kitchens right to your door. Fast, fresh, and always satisfying.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Explore</h4>
          <ul className="space-y-2 text-secondary-foreground/70">
            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link to="/menu" className="hover:text-primary transition-colors">Full Menu</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-secondary-foreground/70">
            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
