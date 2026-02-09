import { Link } from "react-router-dom";
import { Book, Headphones, Video, Heart, HelpCircle, Library } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Fikr-e-Islam" className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-semibold text-foreground">
                Fikr-e-Islam
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Discover authentic Islamic content including books, audio, and video resources for your spiritual journey.
            </p>
          </div>

          {/* Content */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Content</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/books" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Book className="w-4 h-4" />
                  Books & eBooks
                </Link>
              </li>
              <li>
                <Link to="/audio" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Headphones className="w-4 h-4" />
                  Audio & Recitations
                </Link>
              </li>
              <li>
                <Link to="/video" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Video className="w-4 h-4" />
                  Video Lectures
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/library" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Library className="w-4 h-4" />
                  My Library
                </Link>
              </li>
              <li>
                <Link to="/qa" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <HelpCircle className="w-4 h-4" />
                  Q&A Forum
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Become a Contributor
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Account</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Fikr-e-Islam. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-destructive" /> for the Ummah
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
