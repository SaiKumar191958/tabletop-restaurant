import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          const role = data.user.role;
          if (role === "superadmin") setLocation("/superadmin/users");
          else if (role === "admin") setLocation("/admin/dashboard");
          else setLocation("/");
        },
        onError: () => {
          toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                top: `${10 + i * 15}%`,
                left: `${-20 + i * 20}%`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
        <div className="relative text-center text-secondary-foreground">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl inline-block mb-6">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4">TableTop</h1>
          <p className="text-secondary-foreground/70 text-lg max-w-sm">
            Discover incredible food from the best local kitchens, delivered to your door.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 text-left">
            {[
              { label: "Fresh Ingredients", desc: "Sourced daily from local farms" },
              { label: "Fast Delivery", desc: "Average 30 minutes or less" },
              { label: "100+ Dishes", desc: "Always something new to try" },
              { label: "Trusted Chefs", desc: "Hand-picked restaurant partners" },
            ].map((item) => (
              <div key={item.label} className="bg-secondary-foreground/5 rounded-xl p-4">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-secondary-foreground/60 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">TableTop</span>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to continue ordering great food</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              New to TableTop?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-xl text-sm text-muted-foreground">
            <p className="font-medium mb-2">Demo accounts:</p>
            <div className="space-y-1">
              <p>User: <span className="font-mono">user@tabletop.com</span> / user123</p>
              <p>Admin: <span className="font-mono">admin@tabletop.com</span> / admin123</p>
              <p>Super Admin: <span className="font-mono">super@tabletop.com</span> / super123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
