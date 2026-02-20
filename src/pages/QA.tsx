import Layout from "@/components/layout/Layout";
import { QASection } from "@/components/qa/QASection";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const QA = () => {
  const { t } = useTranslation();

  return (
    <Layout>
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
                {t('qa.title')}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl opacity-80">
                {t('qa.subtitle')}
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
    </Layout>
  );
};

export default QA;