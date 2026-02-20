import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      // Small delay to allow Supabase client to process the URL fragment/tokens
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
          variant: "destructive",
        });
        navigate("/forgot-password");
      }
    };
    checkSession();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setIsSuccess(true);
    setIsLoading(false);

    // Redirect after 3 seconds
    setTimeout(() => {
      navigate("/");
    }, 3000);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-20 relative overflow-hidden font-urdu-aware">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.3, 0.15],
              x: [0, -40, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg mx-4"
        >
          <div className="bg-card/40 glass-dark border border-border/50 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-10 relative">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                className="mb-8"
              >
                <img
                  src={logo}
                  alt="Fikr-e-Islam"
                  className="w-32 h-32 md:w-40 md:h-40 object-contain mx-auto drop-shadow-2xl opacity-90"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-4xl font-bold text-foreground mb-4 tracking-tight"
              >
                {isSuccess ? "Password Updated" : "Set New Password"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-lg opacity-80"
              >
                {isSuccess
                  ? "Your password has been successfully updated"
                  : "Enter your new password below"
                }
              </motion.p>
            </div>

            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto shadow-inner"
                  >
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </motion.div>
                  <p className="text-lg text-muted-foreground px-4 leading-relaxed">
                    Redirecting you to the homepage in a few seconds...
                  </p>
                  <Button
                    onClick={() => navigate("/")}
                    className="w-full h-14 rounded-2xl gradient-primary border-none shadow-xl shadow-primary/20 text-lg font-bold"
                  >
                    Go to Homepage Now
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="password" title={t("auth.password")} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">New Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="h-14 pl-12 bg-background/50 border-border/40 focus:border-primary/50 text-lg rounded-2xl transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="confirmPassword" title={t("auth.confirmPassword")} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">Confirm New Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="h-14 pl-12 bg-background/50 border-border/40 focus:border-primary/50 text-lg rounded-2xl transition-all"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30 gradient-primary border-none hover:scale-[1.02] active:scale-[0.98] transition-all group"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <span>Update Password</span>
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
