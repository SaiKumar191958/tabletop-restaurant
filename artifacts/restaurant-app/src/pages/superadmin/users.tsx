import { useState } from "react";
import {
  useListUsers,
  useUpdateUserRole,
  getListUsersQueryKey,
} from "@/lib/api-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Shield, User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-700",
  admin:      "bg-blue-100 text-blue-700",
  user:       "bg-gray-100 text-gray-600",
};

const ROLES = ["user", "admin", "superadmin"] as const;
type UserRole = typeof ROLES[number];

export default function SuperAdminUsers() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useListUsers();
  const updateMutation = useUpdateUserRole();
  const { toast } = useToast();
  const { user: me } = useAuth();
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = users?.filter(u => {
    const q = userSearch.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const handleRoleChange = (id: number, role: UserRole) => {
    updateMutation.mutate(
      { id, data: { role } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
          toast({ title: "User role updated" });
        },
        onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="page-container py-5 sm:py-8">
        <h1 className="page-title mb-6">Manage Users</h1>
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="page-container py-5 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          <h1 className="page-title">Manage Users</h1>
          <span className="text-muted-foreground text-sm">({users?.length ?? 0})</span>
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={userSearch} 
            onChange={(e) => setUserSearch(e.target.value)} 
            placeholder="Search by name, email, phone..." 
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-2xl overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[32rem]">
          <thead className="bg-muted/50 text-sm text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-4 font-semibold">User</th>
              <th className="text-left px-6 py-4 font-semibold hidden md:table-cell">Phone</th>
              <th className="text-left px-6 py-4 font-semibold hidden sm:table-cell">Joined</th>
              <th className="text-left px-6 py-4 font-semibold">Current Role</th>
              <th className="text-left px-6 py-4 font-semibold">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers?.map((u) => {
              const role = u.role as UserRole;
              const isSelf = u.id === me?.id;

              return (
                <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${isSelf ? "bg-primary/5" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          {u.username}
                          {isSelf && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{u.phone ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${ROLE_COLORS[role] ?? ""}`}>
                      {role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={role}
                      onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                      disabled={updateMutation.isPending || isSelf}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUsers?.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No users found.</p>
        )}
      </div>
    </div>
  );
}
