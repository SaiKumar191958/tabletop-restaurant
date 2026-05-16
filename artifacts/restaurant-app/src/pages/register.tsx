import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", phone: "" });
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(
      { data: { username: form.username, email: form.email, password: form.password, phone: form.phone } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation("/");
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed.";
          toast({ title: "Registration failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-foreground/10 rounded-full" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-primary-foreground/10 rounded-full" />
        </div>
        <div className="relative text-center text-primary-foreground">
          <div className="bg-primary-foreground/20 p-4 rounded-2xl inline-block mb-6">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Join TableTop</h1>
          <p className="text-primary-foreground/80 text-lg max-w-sm">
            Create an account and start ordering from the best local restaurants today.
          </p>
          <div className="mt-12 space-y-4">
            {[
              "Free delivery on your first order",
              "Real-time order tracking",
              "Exclusive member discounts",
            ].map((perk) => (
              <div key={perk} className="flex items-center gap-3 text-left bg-primary-foreground/10 rounded-xl p-4">
                <div className="w-2 h-2 rounded-full bg-primary-foreground shrink-0" />
                <p className="text-sm font-medium">{perk}</p>
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

          <h2 className="text-3xl font-bold text-foreground mb-2">Create account</h2>
          <p className="text-muted-foreground mb-8">Start your TableTop journey today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" placeholder="johndoe" value={form.username} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+1 555 0000" value={form.phone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
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

            <Button type="submit" className="w-full h-11 mt-2" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
