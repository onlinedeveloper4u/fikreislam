import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Lock, ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setIsLoadingProfile(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setFullName(data.full_name || "");
      }
      setIsLoadingProfile(false);
    };

    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: t('qa.form.errorTitle'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('settings.profile.success'),
        description: t('settings.profile.successDesc'),
      });
    }

    setIsSavingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: t('settings.password.errorMissing'),
        description: t('settings.password.errorMissingDesc'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('settings.password.errorMismatch'),
        description: t('settings.password.errorMismatchDesc'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('settings.password.errorShort'),
        description: t('settings.password.errorShortDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: t('qa.form.errorTitle'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('settings.password.success'),
        description: t('settings.password.successDesc'),
      });
      setNewPassword("");
      setConfirmPassword("");
    }

    setIsChangingPassword(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">{t('settings.backToHome')}</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <SettingsIcon className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {t('settings.title')}
            </h1>
          </div>
          <div className="h-1.5 w-32 bg-primary/20 rounded-full mt-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-10"
        >
          <Card className="border-border/40 bg-card/30 glass-dark rounded-[2.5rem] shadow-2xl overflow-hidden border-t-4 border-t-primary/20">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <CardTitle className="text-2xl font-display font-bold leading-tight">{t('settings.profile.title')}</CardTitle>
              </div>
              <CardDescription className="text-base opacity-70">
                {t('settings.profile.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-bold uppercase tracking-widest opacity-60 ml-1">{t('settings.profile.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="h-14 bg-muted/40 border-border/40 rounded-2xl text-lg font-medium opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground/60 italic ml-1">
                    {t('settings.profile.emailDisabled')}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-sm font-bold uppercase tracking-widest opacity-60 ml-1">{t('settings.profile.fullName')}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t('settings.profile.fullNamePlaceholder')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoadingProfile || isSavingProfile}
                    className="h-14 bg-background/50 border-border/40 focus:border-primary/50 rounded-2xl text-lg transition-all"
                  />
                </div>

                <Button type="submit" disabled={isSavingProfile} className="h-14 px-10 rounded-2xl text-lg font-bold gradient-primary border-none shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {t('settings.profile.saving')}
                    </>
                  ) : (
                    t('settings.profile.save')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30 glass-dark rounded-[2.5rem] shadow-2xl overflow-hidden border-t-4 border-t-primary/20">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Lock className="w-5 h-5" />
                </div>
                <CardTitle className="text-2xl font-display font-bold leading-tight">{t('settings.password.title')}</CardTitle>
              </div>
              <CardDescription className="text-base opacity-70">
                {t('settings.password.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <form onSubmit={handleChangePassword} className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="newPassword" title={t('settings.password.newPassword')} className="text-sm font-bold uppercase tracking-widest opacity-60 ml-1">
                    {t('settings.password.newPassword')}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder={t('settings.password.confirmPlaceholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isChangingPassword}
                    className="h-14 bg-background/50 border-border/40 focus:border-primary/50 rounded-2xl text-lg transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmNewPassword" title={t('settings.password.confirmPassword')} className="text-sm font-bold uppercase tracking-widest opacity-60 ml-1">
                    {t('settings.password.confirmPassword')}
                  </Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder={t('settings.password.confirmPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isChangingPassword}
                    className="h-14 bg-background/50 border-border/40 focus:border-primary/50 rounded-2xl text-lg transition-all"
                  />
                </div>

                <Button type="submit" disabled={isChangingPassword} className="h-14 px-10 rounded-2xl text-lg font-bold gradient-primary border-none shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {t('settings.password.updating')}
                    </>
                  ) : (
                    t('settings.password.update')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Settings;
