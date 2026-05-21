import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Mail, KeyRound, ArrowLeft, UserCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

type Step = "email" | "otp";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const { login, guestLogin } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (role: string) => {
    if (role === "superadmin") navigate("/superadmin/users");
    else if (role === "admin") navigate("/admin/dashboard");
    else navigate("/");
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await guestLogin();
      toast.success("Logged in as guest");
      navigate("/");
    } catch (error) {
      toast.error("Guest login failed");
    } finally {
      setGuestLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
// ...
    e.preventDefault();
    if (!email.trim()) {
      setShowValidationErrors(true);
      toast.error("Please enter the mandatory fields");
      return;
    }
    setLoading(true);
    setDemoOtp(null);
    try {
      const { data } = await api.post("auth/otp/request/", {
        email: email.trim(),
        purpose: "login",
      });
      if (data.demo_otp) setDemoOtp(data.demo_otp);
      toast.success(data.message || "Code sent to your email");
      setStep("otp");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("auth/otp/verify/", {
        email: email.trim(),
        otp: otp.trim(),
        purpose: "login",
      });
      await login(data.access, data.refresh);
      toast.success("Signed in successfully");
      redirectByRole(data.user?.role ?? "user");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-12 relative overflow-hidden">
        <div className="relative text-center text-secondary-foreground">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl inline-block mb-6">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Sri Durga Military Hotel</h1>
          <p className="text-secondary-foreground/70 text-lg max-w-sm">
            Sign in securely with a one-time code sent to your email.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md px-1">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">
            {step === "email" ? "Enter your email to receive a sign-in code" : `Code sent to ${email}`}
          </p>

          {step === "email" ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all group"
                  onClick={handleGuestLogin}
                  disabled={guestLoading || loading}
                >
                  {guestLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <UserCircle className="w-5 h-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
                  )}
                  Continue as Guest
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-medium">Or user login</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className={showValidationErrors && !email.trim() ? "text-destructive" : ""}>
                    Email *
                  </Label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${showValidationErrors && !email.trim() ? "text-destructive" : "text-muted-foreground"}`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-9 ${showValidationErrors && !email.trim() ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading || guestLoading}>
                  {loading ? "Sending code..." : "Send verification code"}
                </Button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {demoOtp && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                  <p className="font-medium text-primary">Dev fallback — your code:</p>
                  <p className="font-mono text-lg mt-1 tracking-widest">{demoOtp}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-9 tracking-[0.3em] font-mono text-center"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify & sign in"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setDemoOtp(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Use a different email
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              New to Sri Durga Military Hotel?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-xl text-sm text-muted-foreground">
            <p className="font-medium mb-2">Demo accounts (email OTP):</p>
            <div className="space-y-1 font-mono text-xs">
              <p>user@tabletop.com</p>
              <p>admin@tabletop.com</p>
              <p>super@tabletop.com</p>
            </div>
            <p className="mt-2 text-xs">Configure SMTP in backend .env to receive codes in your inbox.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
