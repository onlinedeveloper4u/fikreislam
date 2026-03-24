'use client';

import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { QASection } from "@/components/qa/QASection";

export const QAView = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-12 text-center md:text-left"
      >
        <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/20"
          >
            <HelpCircle className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-3">
              {"سوال و جواب"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl opacity-80">
              {"علماء اور ماہرین کی ہماری کمیونٹی سے اپنے سوالات کے مستند جوابات حاصل کریں۔"}
            </p>
          </div>
        </div>
        <div className="h-1 w-20 bg-primary/20 rounded-full mt-6 hidden md:block" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <QASection />
      </motion.div>
    </div>
  );
};
