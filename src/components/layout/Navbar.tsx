import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Book, Headphones, Video, Menu, X, LogOut, User, Heart, LayoutDashboard, HelpCircle, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role, signOut, loading } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = [
    { name: t("nav.books"), href: "/books", icon: Book },
    { name: t("nav.audio"), href: "/audio", icon: Headphones },
    { name: t("nav.video"), href: "/video", icon: Video },
    { name: t("nav.qa"), href: "/qa", icon: HelpCircle },
  ];

  const getRoleBadge = () => {
    if (!role) return null;
    const colors = {
      admin: "bg-destructive/10 text-destructive",
      contributor: "bg-accent/20 text-accent-foreground",
      user: "bg-muted text-muted-foreground",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colors[role]}`}>
        {t(`dashboard.${role}`)}
      </span>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt={t("common.brand")} className="w-16 h-16 object-contain" />
          <span className="font-display text-2xl font-bold text-foreground">
            {t("common.brand")}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks
            .filter((link) => role === "admin" || link.href === "/audio")
            .map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                <link.icon className="w-4 h-4" />
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
        </div>

        {/* Language & Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 font-medium"
          >
            <Languages className="w-4 h-4" />
            <span>{language === 'en' ? t("common.languages.ur") : t("common.languages.en")}</span>
          </Button>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  {getRoleBadge()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/library">
                    <Heart className="w-4 h-4 mr-2" />
                    {t("nav.library")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                {(role === 'contributor' || role === 'admin') && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">{t("nav.signIn")}</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/register">{t("nav.getStarted")}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks
              .filter((link) => role === "admin" || link.href === "/audio")
              .map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors p-2"
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-1">
                    <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                    {getRoleBadge()}
                  </div>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.signOut")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={toggleLanguage}
                    className="flex items-center justify-center gap-2 font-medium"
                  >
                    <Languages className="w-5 h-5" />
                    <span>{language === 'en' ? t("common.languages.ur") : t("common.languages.en")}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/login">{t("nav.signIn")}</Link>
                  </Button>
                  <Button variant="hero" asChild>
                    <Link to="/register">{t("nav.getStarted")}</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={toggleLanguage}
                    className="flex items-center justify-center gap-2 font-medium"
                  >
                    <Languages className="w-5 h-5" />
                    <span>{language === 'en' ? t("common.languages.ur") : t("common.languages.en")}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
