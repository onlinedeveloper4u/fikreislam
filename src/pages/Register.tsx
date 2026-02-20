import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, User, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      toast({
        title: t("auth.missingFields"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("auth.passwordsNotMatch"),
        description: t("auth.makeSureSame"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t("auth.passwordShort"),
        description: t("auth.passwordMinChar"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { session, error } = await signUp(email, password, fullName);

    if (error) {
      let message = error.message;
      let title = t("auth.loginFailed");

      if (error.message.includes("already registered")) {
        message = t("auth.alreadyRegistered");
      } else if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("too many requests")) {
        title = t("auth.rateLimitExceeded");
        message = t("auth.rateLimitMessage");
      }

      toast({
        title: title,
        description: message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!session) {
      toast({
        title: t("auth.checkEmail"),
        description: t("auth.verificationSent"),
      });
      navigate("/login");
    } else {
      toast({
        title: t("auth.accountCreated"),
        description: t("auth.accountCreatedWelcome"),
      });
      navigate("/");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-20 relative overflow-hidden font-urdu-aware">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -60, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[15%] -right-[10%] w-[60%] h-[60%] bg-primary/20 blur-[130px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.3, 0.15],
              x: [0, 70, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-[15%] -left-[10%] w-[60%] h-[60%] bg-primary/10 blur-[130px] rounded-full"
          />
        </div>



        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl mx-4"
        >
          <div className="bg-card/40 glass-dark border border-border/50 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-full -ml-16 -mt-16 blur-xl" />

            <div className="text-center mb-10 relative">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                className="mb-8"
              >
                <img
                  src={logo}
                  alt="Fikr-e-Islam"
                  className="w-32 h-32 md:w-40 md:h-40 object-contain mx-auto drop-shadow-2xl"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-display text-4xl font-bold text-foreground mb-4 tracking-tight"
              >
                {t("auth.createAccount")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground text-lg opacity-80"
              >
                {t("auth.joinCommunity")}
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">{t("auth.fullName")}</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      type="text"
                      placeholder={t("auth.fullNamePlaceholder")}
                      className="h-14 pl-12 bg-background/50 border-border/40 focus:border-primary/50 text-lg rounded-2xl transition-all"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
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
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-3"
                >
                  <Label htmlFor="password" title={t("auth.password")} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">
                    {t("auth.password")}
                  </Label>
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
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-3"
                >
                  <Label htmlFor="confirmPassword" title={t("auth.confirmPassword")} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">
                    {t("auth.confirmPassword")}
                  </Label>
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
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="pt-6"
              >
                <Button
                  className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30 gradient-primary border-none hover:scale-[1.02] active:scale-[0.98] transition-all group"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>{t("auth.creatingAccount")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span>{t("auth.createAccount")}</span>
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center mt-12 pt-8 border-t border-border/20"
            >
              <p className="text-muted-foreground text-lg">
                {t("auth.alreadyAccount")}{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
                  {t("auth.signIn")}
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Register;
