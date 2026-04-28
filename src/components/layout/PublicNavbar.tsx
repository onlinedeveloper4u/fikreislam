'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Book, Headphones, Video, Menu, X, LogOut, User, Heart, LayoutDashboard, HelpCircle, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

export const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, role, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navLinks = [
    { name: "کتب", href: "/books", icon: Book },
    { name: "آڈیو", href: "/audio", icon: Headphones },
    { name: "ویڈیو", href: "/video", icon: Video },
    { name: "سوال و جواب", href: "/qa", icon: HelpCircle },
  ];

  const getRoleBadge = () => {
    if (!role) return null;
    const colors = {
      owner: "bg-destructive/10 text-destructive",
      admin: "bg-primary/10 text-primary",
      user: "bg-muted text-muted-foreground",
    };
    const labels = {
      owner: "مالک",
      admin: "منتظم",
      user: "صارف",
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${colors[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass h-16 shadow-lg" : "bg-transparent h-24"
      }`}
    >
      <nav className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 md:w-14 md:h-14 transition-transform group-hover:scale-110">
            <Image src="/logo.png" alt="فکر اسلام" fill className="object-contain" />
          </div>
          <span className="font-display text-xl md:text-2xl font-bold text-foreground">
            {"فکر اسلام"}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group relative flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <link.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">{link.name}</span>
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
              />
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-1 rounded-full hover:bg-muted/50 transition-all">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start pr-1">
                    <span className="text-sm font-bold text-foreground leading-tight">{user.fullName || 'User'}</span>
                    {getRoleBadge()}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-dark rounded-2xl border-white/10 shadow-2xl p-2">
                <div className="px-3 py-3 border-b border-white/5 mb-1">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-black">{"اکاؤنٹ"}</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {user.email}
                  </p>
                </div>
                
                <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer p-3">
                  <Link href="/library" className="flex items-center gap-3">
                    <Heart className="w-4 h-4" />
                    <span className="font-medium">{"میری لائبریری"}</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer p-3">
                  <Link href="/settings" className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">{"ترتیبات"}</span>
                  </Link>
                </DropdownMenuItem>

                {(role === 'admin' || role === 'owner') && (
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer p-3">
                    <Link href="/admin" className="flex items-center gap-3">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="font-medium">{"ڈیش بورڈ"}</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-white/5 my-1" />
                
                <DropdownMenuItem onClick={handleSignOut} className="rounded-xl focus:bg-destructive/10 text-destructive cursor-pointer p-3">
                  <LogOut className="w-4 h-4 mr-3" />
                  <span className="font-medium">{"باہر نکلیں"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="rounded-xl hover:bg-primary/5 text-foreground px-6 font-bold">
                <Link href="/login">{"داخل ہوں"}</Link>
              </Button>
              <Button className="rounded-xl gradient-primary border-none shadow-lg shadow-primary/20 px-8 font-bold" asChild>
                <Link href="/login">{"شروع کریں"}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-3 rounded-xl bg-muted/50 text-foreground transition-all hover:bg-muted"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-b border-white/5 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-4 text-lg font-bold text-muted-foreground hover:text-primary transition-colors p-4 rounded-2xl hover:bg-primary/5"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <link.icon className="w-5 h-5 text-primary" />
                    </div>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 px-4">
                      <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full rounded-2xl h-14 border-white/10" onClick={handleSignOut}>
                      <LogOut className="w-5 h-5 ml-3" />
                      {"باہر نکلیں"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="rounded-2xl h-14 border-white/10 font-bold" asChild onClick={() => setIsOpen(false)}>
                      <Link href="/login">{"داخل ہوں"}</Link>
                    </Button>
                    <Button className="rounded-2xl h-14 gradient-primary border-none font-bold shadow-lg" asChild onClick={() => setIsOpen(false)}>
                      <Link href="/login">{"شروع کریں"}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
