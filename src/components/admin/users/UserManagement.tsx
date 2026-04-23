import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Shield, Loader2, Users, Mail } from 'lucide-react';
import { getUsersWithRoles, updateUserRole } from '@/actions/auth';

type AppRole = 'admin' | 'user';

interface UserDetails {
  id: string;
  email: string;
  full_name: string;
  user_role: AppRole;
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const roleConfig: Record<AppRole, { icon: React.ElementType; color: string; label: string }> = {
    admin: { icon: Shield, color: 'bg-red-500/10 text-red-600', label: "منتظم" },
    user: { icon: User, color: 'bg-gray-500/10 text-gray-600', label: "صارف" },
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsersWithRoles();
      if (res.error) throw res.error;
      setUsers((res.data as unknown as UserDetails[]) || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const errorMessage = error.message || 'Unknown error';
      toast.error(`${"صارفین لوڈ کرنے میں ناکامی"}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingId(userId);
    try {
      const { error } = await updateUserRole(userId, newRole);
      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, user_role: newRole } : u
      ));
      toast.success("کردار کامیابی سے تبدیل ہو گیا");
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error("کردار تبدیل کرنے میں ناکامی");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">{"کوئی صارف نہیں ملا"}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {"نظام میں کوئی صارف اندراج شدہ نہیں ہے۔"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {`${users.length} اندراج شدہ صارف`}
        </p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const config = roleConfig[user.user_role] || roleConfig.user;
          const RoleIcon = config.icon;

          return (
            <Card key={user.id} className="border-border/50 bg-card/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.full_name}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email}
                      </p>
                      <p className="text-[10px] text-muted-foreground opacity-70">
                        {`شامل ہوئے ${new Date(user.created_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={config.color}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>

                  <Select
                    value={user.user_role}
                    onValueChange={(value: AppRole) => handleRoleChange(user.id, value)}
                    disabled={updatingId === user.id}
                  >
                    <SelectTrigger className="w-32">
                      {updatingId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{"صارف"}</SelectItem>
                      <SelectItem value="admin">{"منتظم"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
