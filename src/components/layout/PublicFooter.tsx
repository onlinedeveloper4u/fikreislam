'use client';

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";

export const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    content: [
      { name: "کتب", href: "/books" },
      { name: "آڈیو", href: "/audio" },
      { name: "ویڈیو", href: "/video" },
      { name: "سوال و جواب", href: "/qa" },
    ],
    support: [
      { name: "ہمارے بارے میں", href: "/about" },
      { name: "رابطہ کریں", href: "/contact" },
      { name: "رازداری کی پالیسی", href: "/privacy" },
      { name: "شرائط و ضوابط", href: "/terms" },
    ],
    social: [
      { name: "Facebook", href: "#", icon: Facebook },
      { name: "Twitter", href: "#", icon: Twitter },
      { name: "Instagram", href: "#", icon: Instagram },
      { name: "Youtube", href: "#", icon: Youtube },
    ]
  };

  return (
    <footer className="relative bg-card pt-24 pb-12 overflow-hidden border-t border-border/50">
      <div className="absolute inset-0 islamic-pattern opacity-[0.02] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12">
                <Image src="/logo.png" alt="فکر اسلام" fill className="object-contain" />
              </div>
              <span className="font-display text-2xl font-bold text-foreground tracking-tight">
                {"فکر اسلام"}
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              {"مستند اسلامی کتب، خطبات اور ویڈیوز کا ایک جامع ذخیرہ — قابل اعتماد علماء سے لئی گئی معلومات۔"}
            </p>
            <div className="flex items-center gap-4">
              {footerLinks.social.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-bold mb-8 text-foreground">{"مواد"}</h4>
            <ul className="space-y-4">
              {footerLinks.content.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-display text-lg font-bold mb-8 text-foreground">{"مدد اور معلومات"}</h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <h4 className="font-display text-lg font-bold text-foreground">{"رابطہ کریں"}</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{"پتہ"}</p>
                  <p className="text-sm text-muted-foreground">{"اسلام آباد، پاکستان"}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{"ای میل"}</p>
                  <p className="text-sm text-muted-foreground">{"info@fikreislam.com"}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground font-medium">
            © {currentYear} {"فکر اسلام۔ تمام حقوق محفوظ ہیں۔"}
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {"سسٹم آن لائن ہے"}
          </div>
        </div>
      </div>
    </footer>
  );
};
