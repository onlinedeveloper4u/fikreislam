import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Languages, ArrowRight, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: t("auth.missingFields"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      let description = error.message;
      if (error.message === "Invalid login credentials") {
        description = t("auth.invalidCredentials");
      } else if (error.message.includes("Email not confirmed")) {
        description = t("auth.emailNotConfirmed");
      }

      toast({
        title: t("auth.loginFailed"),
        description,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: t("auth.welcomeBackToast"),
      description: t("auth.signedInSuccess"),
    });

    navigate("/");
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-20 relative overflow-hidden font-urdu-aware">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -40, 0],
              y: [0, 60, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"
          />
        </div>

        <div className="absolute top-8 right-8 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleLanguage}
              className="glass border border-white/20 text-foreground hover:bg-white/10 rounded-2xl h-12 px-6 shadow-xl backdrop-blur-xl transition-all"
            >
              <Languages className="w-5 h-5 mr-3 text-primary" />
              <span className="font-bold">{language === 'en' ? 'اردو' : 'English'}</span>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg mx-4"
        >
          <div className="bg-card/40 glass-dark border border-border/50 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 blur-xl" />

            <div className="text-center mb-12 relative">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                className="mb-8"
              >
                <img
                  src={logo}
                  alt="Fikr-e-Islam"
                  className="w-40 h-40 md:w-52 md:h-52 object-contain mx-auto drop-shadow-2xl"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-display text-4xl font-bold text-foreground mb-4 tracking-tight"
              >
                {t("auth.welcomeBack")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground text-lg opacity-80"
              >
                {t("auth.signInToContinue")}
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
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

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="password" title={t("auth.password")} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">
                    {t("auth.password")}
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-primary/70 hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="pt-4"
              >
                <Button
                  className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30 gradient-primary border-none hover:scale-[1.02] active:scale-[0.98] transition-all group"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>{t("auth.signingIn")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span>{t("auth.signIn")}</span>
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
                {t("auth.noAccount")}{" "}
                <Link to="/register" className="text-primary hover:text-primary/80 font-bold transition-colors">
                  {t("auth.createOne")}
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;
