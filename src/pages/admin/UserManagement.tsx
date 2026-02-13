import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Search, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  is_deactivated: boolean | null;
  role: string;
}

function useAdminUsers(roleFilter: string, search: string) {
  return useQuery({
    queryKey: ["admin-users", roleFilter, search],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Get profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, created_at, is_deactivated")
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;

      // Get roles
      const userIds = profiles?.map((p) => p.user_id) || [];
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (roleError) throw roleError;

      const roleMap: Record<string, string> = {};
      roles?.forEach((r) => (roleMap[r.user_id] = r.role));

      let users = profiles?.map((p) => ({
        ...p,
        role: roleMap[p.user_id] || "unknown",
      })) || [];

      if (roleFilter && roleFilter !== "all") {
        users = users.filter((u) => u.role === roleFilter);
      }

      if (search) {
        const q = search.toLowerCase();
        users = users.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
      }

      return users;
    },
  });
}

const roleIcons: Record<string, typeof Shield> = {
  admin: ShieldAlert,
  recruiter: ShieldCheck,
  student: Shield,
};

const roleBadgeVariant: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive",
  recruiter: "bg-primary/10 text-primary",
  student: "bg-info/10 text-info",
};

export default function UserManagement() {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useAdminUsers(roleFilter, search);

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar userRole="admin" />
      <main className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">User Management</h1>
            <p className="text-muted-foreground">
              {users?.length ?? 0} users total
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="recruiter">Recruiters</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const RoleIcon = roleIcons[user.role] || Shield;
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>
                                  {user.full_name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">
                                  {user.full_name || "No name"}
                                </p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={roleBadgeVariant[user.role] || ""}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.is_deactivated ? (
                              <Badge variant="outline" className="text-destructive border-destructive/50">
                                Deactivated
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-success border-success/50">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
