'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, User, Lock } from 'lucide-react';

export function ProfileSettings() {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync fullName with user once loaded
  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user?.fullName]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    try {
      const { success, error } = await updateProfile({ fullName: fullName.trim() });
      if (error) throw error;
      await refreshSession();
      toast.success("نام کامیابی سے تبدیل کر دیا گیا");
    } catch (error: any) {
      toast.error(error.message || "تبدیلی میں ناکامی");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    if (password !== confirmPassword) {
      toast.error("پاس ورڈز مطابقت نہیں رکھتے");
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await updateProfile({ password });
      if (error) throw error;
      toast.success("پاس ورڈ کامیابی سے تبدیل کر دیا گیا");
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || "تبدیلی میں ناکامی");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">{"پروفائل کی معلومات"}</CardTitle>
          </div>
          <CardDescription>{"اپنا نام تبدیل کریں جو ڈیش بورڈ پر ظاہر ہوتا ہے۔"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{"پورا نام"}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اپنا پورا نام درج کریں"
                className="bg-background/50"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {"نام تبدیل کریں"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">{"پاس ورڈ تبدیل کریں"}</CardTitle>
          </div>
          <CardDescription>{"اپنا اکاؤنٹ محفوظ رکھنے کے لیے نیا پاس ورڈ منتخب کریں۔"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">{"نیا پاس ورڈ"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="نیا پاس ورڈ"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{"پاس ورڈ کی تصدیق"}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="پاس ورڈ کی تصدیق"
                  className="bg-background/50"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} variant="destructive" className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              {"پاس ورڈ تبدیل کریں"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
