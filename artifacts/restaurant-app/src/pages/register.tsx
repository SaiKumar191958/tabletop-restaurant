import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

type Step = "details" | "otp";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setShowValidationErrors(true);
      toast.error("Please enter the mandatory fields");
      return;
    }
    setLoading(true);
    setDemoOtp(null);
    try {
      const { data } = await api.post("auth/otp/request/", {
        email: form.email.trim(),
        purpose: "register",
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
        email: form.email.trim(),
        otp: otp.trim(),
        purpose: "register",
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      await login(data.access, data.refresh);
      toast.success("Account created successfully");
      navigate("/");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="relative text-center text-primary-foreground">
          <div className="bg-primary-foreground/20 p-4 rounded-2xl inline-block mb-6">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Join Sri Durga Military Hotel</h1>
          <p className="text-primary-foreground/80 text-lg max-w-sm">
            Verify your email with a one-time code — no password needed.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-foreground mb-2">Create account</h2>
          <p className="text-muted-foreground mb-8">
            {step === "details" ? "We'll email you a code to verify your address" : `Code sent to ${form.email}`}
          </p>

          {step === "details" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className={showValidationErrors && !form.firstName.trim() ? "text-destructive" : ""}>
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className={showValidationErrors && !form.firstName.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className={showValidationErrors && !form.lastName.trim() ? "text-destructive" : ""}>
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className={showValidationErrors && !form.lastName.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className={showValidationErrors && !form.email.trim() ? "text-destructive" : ""}>
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={showValidationErrors && !form.email.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  maxLength={10}
                />
              </div>
              <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
                {loading ? "Sending code..." : "Send verification code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {demoOtp && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                  <p className="font-medium text-primary">Demo mode — your code:</p>
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
                {loading ? "Creating account..." : "Verify & create account"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("details");
                  setOtp("");
                  setDemoOtp(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit details
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
