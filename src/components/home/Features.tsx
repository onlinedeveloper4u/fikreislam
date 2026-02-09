import { Search, Download, Heart, Users, Shield, Globe, BookOpen, MessageCircle } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Authentic Content",
    description: "Carefully curated Islamic books, lectures, and resources from trusted scholars and institutions",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find exactly what you need with powerful search and intelligent filtering options",
  },
  {
    icon: Heart,
    title: "Personal Library",
    description: "Save favorites and create custom playlists to organize your learning journey",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Scholars and contributors worldwide share authentic Islamic knowledge",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "Every piece of content is reviewed and approved by our editorial team",
  },
  {
    icon: Globe,
    title: "Multilingual",
    description: "Content available in Arabic, English, Urdu, and many more languages",
  },
  {
    icon: Download,
    title: "Offline Access",
    description: "Download content for offline reading and listening anywhere, anytime",
  },
  {
    icon: MessageCircle,
    title: "Q&A Forum",
    description: "Ask questions and get answers from knowledgeable community members",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 islamic-pattern opacity-30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Platform Features
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5">
            Everything for Your <span className="text-gradient">Spiritual Growth</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            A comprehensive platform designed to make authentic Islamic knowledge 
            accessible to Muslims around the world
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
