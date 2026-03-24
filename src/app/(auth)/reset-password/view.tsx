'use client';

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useResetPasswordLogic } from "./logic";

export const ResetPasswordView = () => {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    isSuccess,
    handleSubmit
  } = useResetPasswordLogic();
  const router = useRouter();

  return (
    <div className="bg-card/40 glass-dark border border-border/50 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
      <div className="text-center mb-10 relative">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          className="mb-8"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 relative mx-auto">
            <Image
              src="/logo.png"
              alt={"فکر اسلام"}
              fill
              priority
              sizes="(max-width: 768px) 128px, 160px"
              className="object-contain drop-shadow-2xl opacity-90"
            />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-4xl font-bold text-foreground mb-4 tracking-tight"
        >
          {isSuccess ? "پاس ورڈ تبدیل ہو گیا" : "نیا پاس ورڈ مقرر کریں"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-lg opacity-80"
        >
          {isSuccess
            ? "آپ کا پاس ورڈ کامیابی سے تبدیل ہو گیا ہے"
            : "نیچے اپنا نیا پاس ورڈ درج کریں"
          }
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto shadow-inner"
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
            <p className="text-lg text-muted-foreground px-4 leading-relaxed">
              {"چند لمحوں میں ہوم پیج پر منتقل ہو رہے ہیں..."}
            </p>
            <Button
              onClick={() => router.push("/")}
              className="w-full h-14 rounded-2xl gradient-primary border-none shadow-xl shadow-primary/20 text-lg font-bold"
            >
              {"ابھی ہوم پیج پر جائیں"}
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="password" title={"نیا پاس ورڈ"} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">{"نیا پاس ورڈ"}</Label>
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
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" title={"نئے پاس ورڈ کی تصدیق"} className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 ml-1">{"نئے پاس ورڈ کی تصدیق"}</Label>
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
              </div>
            </div>

            <Button
              className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30 gradient-primary border-none hover:scale-[1.02] active:scale-[0.98] transition-all group"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>{"تبدیل ہو رہا ہے..."}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>{"پاس ورڈ تبدیل کریں"}</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform rotate-180" />
                </div>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
