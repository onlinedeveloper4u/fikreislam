'use client';

import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-20 relative overflow-hidden font-urdu-aware">
        {/* Animated Background Elements shared by all auth pages */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -40, 0],
              y: [0, 60, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg mx-4"
        >
          {children}
        </motion.div>
      </div>
    </Layout>
  );
}
