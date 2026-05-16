import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
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

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col w-full">{children}</main>
      <Footer />
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">TableTop</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href="/menu" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Menu</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/cart">
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
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover" />
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
                      <Link href="/superadmin/users" className="cursor-pointer w-full">Manage Users</Link>
                    </DropdownMenuItem>
                  )}
                  {(user.role === "admin" || user.role === "superadmin") && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="cursor-pointer w-full">Admin Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/menu" className="cursor-pointer w-full">Manage Menu</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/orders" className="cursor-pointer w-full">Manage Orders</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer w-full">My Orders</Link>
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
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
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
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-4">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Home</Link>
            <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Menu</Link>
            <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium flex items-center justify-between">
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
                  <Link href="/superadmin/users" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">Manage Users</Link>
                )}
                {(user.role === "admin" || user.role === "superadmin") && (
                  <>
                    <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">Admin Dashboard</Link>
                    <Link href="/admin/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">Manage Menu</Link>
                    <Link href="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">Manage Orders</Link>
                  </>
                )}
                <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-muted-foreground">My Orders</Link>
                
                <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
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
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md inline-block">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight">TableTop</span>
          </Link>
          <p className="text-secondary-foreground/70 max-w-sm">
            Bringing the best flavors from your favorite local kitchens right to your door. Fast, fresh, and always satisfying.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Explore</h4>
          <ul className="space-y-2 text-secondary-foreground/70">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link href="/menu" className="hover:text-primary transition-colors">Full Menu</Link></li>
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
