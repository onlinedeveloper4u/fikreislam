'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, User, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useRegisterLogic } from "./logic";

export const RegisterView = () => {
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    handleSubmit
  } = useRegisterLogic();

  return (
    <div className="bg-card/40 glass-dark border border-border/50 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-full -ml-16 -mt-16 blur-xl" />

      <div className="text-center mb-10 relative">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 relative mx-auto">
            <Image
              src="/logo.png"
              alt="Fikr-e-Islam"
              fill
              priority
              sizes="(max-width: 768px) 128px, 160px"
              className="object-contain drop-shadow-2xl"
            />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-display text-4xl font-bold text-foreground mb-4 tracking-tight"
        >
          {"اکاؤنٹ بنائیں"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground text-lg opacity-80"
        >
          {"مستند اسلامی علم کی کمیونٹی میں شامل ہوں"}
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
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">{"پورا نام"}</Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="name"
                type="text"
                placeholder={"اپنا پورا نام درج کریں"}
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
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">{"ای میل"}</Label>
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
            <Label htmlFor="password" title={"پاس ورڈ"} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">
              {"پاس ورڈ"}
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
            <Label htmlFor="confirmPassword" title={"پاس ورڈ کی تصدیق"} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">
              {"پاس ورڈ کی تصدیق"}
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
                <span>{"اکاؤنٹ بنایا جا رہا ہے..."}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span>{"اکاؤنٹ بنائیں"}</span>
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
          {"پہلے سے اکاؤنٹ ہے؟"}{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
            {"داخل ہوں"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
