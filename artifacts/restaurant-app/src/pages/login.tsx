import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, UserCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const { data } = await api.post("auth/google-login/", {
        id_token: credentialResponse.credential,
      });
      await login(data.access, data.refresh);
      toast.success("Signed in with Google");
      redirectByRole(data.user?.role ?? "user");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Google sign-in failed");
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
            Sign in securely with Google or continue as a guest to browse our menu and place orders.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md px-1 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome</h2>
          <p className="text-muted-foreground mb-8">
            Choose a way to get started
          </p>

          <div className="space-y-6">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google Login Failed")}
                useOneTap
                theme="outline"
                width="320px"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium">Or</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all group max-w-[320px] mx-auto"
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
          </div>

          <p className="mt-12 text-xs text-muted-foreground max-w-[280px] mx-auto">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
