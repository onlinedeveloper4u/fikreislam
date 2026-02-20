import { Search, Download, Heart, Users, Shield, Globe, BookOpen, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t("home.features.authentic.title"),
      description: t("home.features.authentic.desc"),
    },
    {
      icon: Search,
      title: t("home.features.smartSearch.title"),
      description: t("home.features.smartSearch.desc"),
    },
    {
      icon: Heart,
      title: t("home.features.library.title"),
      description: t("home.features.library.desc"),
    },
    {
      icon: Users,
      title: t("home.features.community.title"),
      description: t("home.features.community.desc"),
    },
    {
      icon: Shield,
      title: t("home.features.quality.title"),
      description: t("home.features.quality.desc"),
    },
    {
      icon: Globe,
      title: t("home.features.multilingual.title"),
      description: t("home.features.multilingual.desc"),
    },
    {
      icon: Download,
      title: t("home.features.offline.title"),
      description: t("home.features.offline.desc"),
    },
    {
      icon: MessageCircle,
      title: t("home.features.qa.title"),
      description: t("home.features.qa.desc"),
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration with premium feel */}
      <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full glass border border-primary/20 text-primary text-sm font-medium mb-4"
          >
            {t("home.featuresBadge")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            {t("home.featuresTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
          >
            {t("home.featuresSubtitle")}
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group p-8 rounded-2xl glass-dark hover-lift border border-border/50 hover:border-primary/40 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
