import Link from "next/link";
import { Book, Headphones, Video, Heart, HelpCircle, Library } from "lucide-react";
const logo = "/logo.png";

const Footer = () => {
return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt={"فکر اسلام"} className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-semibold text-foreground">
                {"فکر اسلام"}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {"مستند اسلامی علم کے لیے ایک وقف پلیٹ فارم، جو مسلمانوں کو قابل اعتماد علماء اور وسائل سے جوڑتا ہے۔"}
            </p>

          </div>

          {/* Content */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">{"مواد"}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/books" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Book className="w-4 h-4" />
                  {"کتب"}
                </Link>
              </li>
              <li>
                <Link href="/audio" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Headphones className="w-4 h-4" />
                  {"آڈیو"}
                </Link>
              </li>
              <li>
                <Link href="/video" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Video className="w-4 h-4" />
                  {"ویڈیو"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">{"فوری روابط"}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/library" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <Library className="w-4 h-4" />
                  {"میرا کتب خانہ"}
                </Link>
              </li>
              <li>
                <Link href="/qa" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                  <HelpCircle className="w-4 h-4" />
                  {"سوال و جواب"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">{"اکاؤنٹ"}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {"داخل ہوں"}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {"شروع کریں"}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {"ڈیش بورڈ"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {"فکر اسلام"}. {"جملہ حقوق محفوظ ہیں۔"}
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            {"محبت کے ساتھ بنایا گیا"} <Heart className="w-4 h-4 text-destructive" /> {"امت کے لیے"}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
