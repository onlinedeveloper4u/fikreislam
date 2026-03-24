import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Book, Headphones, Video, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
const logo = "/logo.png";

const Hero = () => {
const { dir, language } = useLanguage();

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
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background with dynamic aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/30 to-background" />
      <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />

      {/* Modern Decorative elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-[10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-[5%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center"
        >
          {/* Logo with entrance effect */}
          <motion.div
            variants={itemVariants}
            className="mb-8"
          >
            <motion.div
              className="w-40 h-40 md:w-56 md:h-56 mx-auto relative drop-shadow-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={logo}
                alt={"فکر اسلام"}
                fill
                priority
                sizes="(max-width: 768px) 160px, 224px"
                className="object-contain"
              />
            </motion.div>
          </motion.div>

          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4 animate-glow" />
            {"مستند اسلامی علم"}
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className={`font-display font-bold text-foreground mb-6 ${language === 'ur'
              ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[2.5] py-4'
              : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight'
              }`}
          >
            {"فکر"}{" "}
            <span className="text-gradient drop-shadow-sm">{"اسلام"}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {"مستند اسلامی کتب، خطبات اور ویڈیوز کا ایک جامع ذخیرہ — قابل اعتماد علماء سے"}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Button variant="hero" size="lg" className="w-full sm:w-auto text-base px-8 shadow-glow" asChild>
              <Link href="/register" className="flex items-center gap-2">
                {"سفر شروع کریں"}
                <ArrowRight className={`w-5 h-5 transition-transform ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 glass hover:bg-primary/5 border-primary/20" asChild>
              <Link href="/books">{"کتب دیکھیں"}</Link>
            </Button>
          </motion.div>

          {/* Feature Cards with Staggered Entrance */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { to: "/books", icon: Book, title: "اسلامی کتب", desc: "مستند اسلامی کتب اور علمی متون کا ہمارا مجموعہ دیکھیں۔" },
              { to: "/audio", icon: Headphones, title: "آڈیو خطبات", desc: "مختلف علماء کے بصیرت افروز خطبات، سلسلے اور قرآنی تلاوت سنیں۔" },
              { to: "/video", icon: Video, title: "ویڈیو ذخیرہ", desc: "اسلامی تعلیمات پر مبنی تعلیمی ویڈیوز، دستاویزی فلمیں اور لائیو نشستیں دیکھیں۔" },
            ].map((card, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Link
                  href={card.to}
                  className="group relative block p-8 rounded-2xl glass-dark hover-lift shadow-card border border-border/50 hover:border-primary/40 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
                      <card.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">{card.title}</h3>
                    <p className="text-muted-foreground/70 text-sm leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
