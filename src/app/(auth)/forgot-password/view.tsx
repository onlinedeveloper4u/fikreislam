'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForgotPasswordLogic } from "./logic";

export const ForgotPasswordView = () => {
  const { email, setEmail, isLoading, isEmailSent, setIsEmailSent, handleSubmit } = useForgotPasswordLogic();

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
              alt="فکر اسلام"
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
          {"پاس ورڈ بھول گئے؟"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-lg opacity-80"
        >
          {isEmailSent
            ? "ای میل چیک کریں"
            : "اپنا ای میل درج کریں اور ہم آپ کو پاس ورڈ تبدیل کرنے کا لنک بھیجیں گے"
          }
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {isEmailSent ? (
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
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto shadow-inner"
            >
              <Mail className="w-12 h-12 text-primary" />
            </motion.div>
            <p className="text-lg text-muted-foreground px-4 leading-relaxed">
              {`ہم نے پاس ورڈ تبدیل کرنے کا لنک ${email} پر بھیج دیا ہے۔ براہ کرم اپنا ای میل چیک کریں اور ہدایات پر عمل کریں۔`}
            </p>
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all text-lg font-bold"
              onClick={() => setIsEmailSent(false)}
            >
              {"دوسرا ای میل آزمائیں"}
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
            <div className="space-y-3">
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
            </div>

            <Button
              className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30 gradient-primary border-none hover:scale-[1.02] active:scale-[0.98] transition-all group"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>{"بھیجا جا رہا ہے..."}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>{"پاس ورڈ تبدیلی کا لنک بھیجیں"}</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform rotate-180" />
                </div>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 pt-8 border-t border-border/20"
      >
        <Link
          href="/login"
          className="group flex items-center justify-center gap-3 text-lg text-muted-foreground hover:text-primary transition-all font-bold"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {"واپس داخل ہونے کے صفحے پر"}
        </Link>
      </motion.div>
    </div>
  );
};
