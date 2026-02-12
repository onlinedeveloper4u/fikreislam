import { Search, Download, Heart, Users, Shield, Globe, BookOpen, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 islamic-pattern opacity-30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t("home.featuresBadge")}
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5">
            {t("home.featuresTitle")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            {t("home.featuresSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
