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
import { Loader2, Languages, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { language, toggleLanguage, dir } = useLanguage();
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
      <div className="min-h-[80vh] flex items-center justify-center py-12 relative font-urdu-aware">
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 font-medium"
          >
            <Languages className="w-4 h-4" />
            <span>{language === 'en' ? 'اردو' : 'English'}</span>
          </Button>
        </div>

        <div className="w-full max-w-md mx-4">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            <div className="text-center mb-8">
              <img src={logo} alt="Fikr-e-Islam" className="w-48 h-48 object-contain mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                {t("auth.createAccount")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("auth.joinCommunity")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("auth.fullNamePlaceholder")}
                  className="h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button variant="hero" className="w-full h-11" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.creatingAccount")}
                  </>
                ) : (
                  t("auth.createAccount")
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("auth.alreadyAccount")}{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t("auth.signIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
