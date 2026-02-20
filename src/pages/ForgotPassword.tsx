import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Mail, ShieldQuestion } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: t("auth.missingFields"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setIsEmailSent(true);
    setIsLoading(false);
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
              x: [0, 40, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"
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
                {t("auth.forgotPassword")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-lg opacity-80"
              >
                {isEmailSent
                  ? t("auth.checkEmail")
                  : t("auth.signInToContinue") // Generic for now, ideally reset link text
                }
              </motion.p>
            </div>

            <AnimatePresence mode="wait">
              {isEmailSent ? (
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
                    className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto shadow-inner"
                  >
                    <Mail className="w-12 h-12 text-primary" />
                  </motion.div>
                  <p className="text-lg text-muted-foreground px-4 leading-relaxed">
                    We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
                    Please check your inbox and follow the instructions.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all text-lg font-bold"
                    onClick={() => setIsEmailSent(false)}
                  >
                    Try a different email
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
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">{t("auth.email")}</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        className="h-14 pl-12 bg-background/50 border-border/40 focus:border-primary/50 text-lg rounded-2xl transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
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
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <span>Send Reset Link</span>
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 pt-8 border-t border-border/20"
            >
              <Link
                to="/login"
                className="group flex items-center justify-center gap-3 text-lg text-muted-foreground hover:text-primary transition-all font-bold"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Sign In
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
