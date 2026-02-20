import { Link } from "react-router-dom";
import { Book, Headphones, Video, Heart, HelpCircle, Library, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Footer = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt={t("common.brand")} className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-semibold text-foreground">
                {t("common.brand")}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("footer.desc")}
            </p>
            <div className="mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-xs"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{language === 'en' ? t("common.languages.ur") : t("common.languages.en")}</span>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">{t("footer.content")}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/books" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Book className="w-4 h-4" />
                  {t("footer.books")}
                </Link>
              </li>
              <li>
                <Link to="/audio" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Headphones className="w-4 h-4" />
                  {t("footer.audio")}
                </Link>
              </li>
              <li>
                <Link to="/video" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Video className="w-4 h-4" />
                  {t("footer.video")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/library" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Library className="w-4 h-4" />
                  {t("footer.library")}
                </Link>
              </li>
              <li>
                <Link to="/qa" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <HelpCircle className="w-4 h-4" />
                  {t("footer.qa")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">{t("footer.account")}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {t("nav.signIn")}
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {t("nav.getStarted")}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {t("nav.dashboard")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {t("common.brand")}. {t("footer.rights")}
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            {t("footer.madeFor")} <Heart className="w-4 h-4 text-destructive" /> {t("footer.forUmmah")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
