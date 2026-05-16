import { useAuth } from "./auth-context";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { UserRole } from "@workspace/api-client-react";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === "superadmin") setLocation("/superadmin/users");
      else if (user.role === "admin") setLocation("/admin/dashboard");
      else setLocation("/");
    }
  }, [user, allowedRoles, setLocation]);

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null; // Return null while redirecting
  }

  return <>{children}</>;
}
