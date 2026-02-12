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
import { Loader2, Languages } from "lucide-react";
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
                {t("auth.welcomeBack")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("auth.signInToContinue")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
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

              <Button variant="hero" className="w-full h-11" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.signingIn")}
                  </>
                ) : (
                  t("auth.signIn")
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t("auth.createOne")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
