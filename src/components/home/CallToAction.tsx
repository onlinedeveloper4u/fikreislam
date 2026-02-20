import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Upload, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import { useContentStats } from "@/hooks/useContentStats";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const CallToAction = () => {
  const { data: stats, isLoading } = useContentStats();
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.section className="py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]"
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Users */}
            <motion.div variants={itemVariants} className="relative group overflow-hidden rounded-3xl md:col-span-2 max-w-2xl mx-auto w-full">
              <div className="absolute inset-0 gradient-primary opacity-95 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="relative p-12 text-primary-foreground text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500 mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-bold mb-6">
                  {t("home.cta.userTitle")}
                </h3>
                <p className="opacity-90 mb-10 leading-relaxed text-lg lg:text-xl">
                  {t("home.cta.userDesc")}
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="group/btn bg-white text-primary hover:bg-white/90 shadow-xl px-12 h-14 text-lg"
                  asChild
                >
                  <Link to="/register">
                    {t("home.cta.getStarted")}
                    <ArrowRight className="w-6 h-6 ml-2 group-hover/btn:translate-x-2 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Stats Section */}
          <motion.div
            variants={containerVariants}
            className="mt-24 text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-6 mb-10">
              <motion.img
                src={logo}
                alt={t("common.brand")}
                className="w-24 h-24 drop-shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <span className="font-display text-4xl font-bold text-foreground tracking-tight">{t("common.brand")}</span>
            </motion.div>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              {t("home.cta.joinThousands")}
            </motion.p>
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
            >
              {[
                { label: t("home.cta.islamicBooks"), key: "books" },
                { label: t("home.cta.audioLectures"), key: "audio" },
                { label: t("home.cta.videoContent"), key: "video" },
              ].map((stat, idx) => (
                <motion.div key={idx} variants={itemVariants} className="text-center group">
                  <div className="bg-card/50 glass border border-border/50 rounded-2xl p-6 transition-transform group-hover:-translate-y-2 duration-300">
                    {isLoading ? (
                      <Skeleton className="h-10 w-24 mx-auto mb-3" />
                    ) : (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        className="font-display text-4xl md:text-5xl font-bold text-primary mb-3"
                      >
                        {stats?.[stat.key as keyof typeof stats] || 0}
                      </motion.div>
                    )}
                    <div className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CallToAction;
