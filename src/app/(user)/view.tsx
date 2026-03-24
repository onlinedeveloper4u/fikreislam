'use client';

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Book, Headphones, Video, Sparkles, Search, Download, Heart, Users, Shield, Globe, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeLogic } from "./logic";

interface HomeViewProps {
  stats?: {
    books: number;
    audio: number;
    video: number;
  };
}

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

export const HomeView = ({ stats }: HomeViewProps) => {
  const { dir, language } = useHomeLogic();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/30 to-background" />
        <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="w-40 h-40 md:w-56 md:h-56 mx-auto relative">
                <Image
                  src="/logo.png"
                  alt="فکر اسلام"
                  fill
                  priority
                  sizes="(max-width: 768px) 160px, 224px"
                  className="object-contain drop-shadow-2xl"
                />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4 animate-glow" />
              {"مستند اسلامی علم"}
            </motion.div>

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

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {"مستند اسلامی کتب، خطبات اور ویڈیوز کا ایک جامع ذخیرہ — قابل اعتماد علماء سے"}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
            >
              <Button asChild variant="default" size="lg" className="h-14 px-8 text-lg rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                <Link href="/register" className="flex items-center gap-2">
                  {"سفر شروع کریں"}
                  <ArrowRight className={`w-5 h-5 transition-transform ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-2xl glass hover:bg-primary/5 border-primary/20">
                <Link href="/books">{"کتب دیکھیں"}</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                { href: "/books", icon: Book, title: "اسلامی کتب", desc: "مستند اسلامی کتب اور علمی متون کا ہمارا مجموعہ دیکھیں۔" },
                { href: "/audio", icon: Headphones, title: "آڈیو خطبات", desc: "مختلف علماء کے بصیرت افروز خطبات، سلسلے اور قرآنی تلاوت سنیں۔" },
                { href: "/video", icon: Video, title: "ویڈیو ذخیرہ", desc: "اسلامی تعلیمات پر مبنی تعلیمی ویڈیوز، دستاویزی فلمیں اور لائیو نشستیں دیکھیں۔" },
              ].map((card, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Link
                    href={card.href}
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            >
              {"آپ کی روحانی ترقی کے لیے سب کچھ"}
            </motion.h2>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: BookOpen, title: "مستند مواد", description: "قابل اعتماد علماء اور اداروں سے احتیاط سے منتخب کردہ اسلامی کتب، خطبات اور وسائل" },
              { icon: Search, title: "ذہین تلاش", description: "طاقتور تلاش اور فلٹرنگ کے اختیارات کے ساتھ وہی تلاش کریں جس کی آپ کو ضرورت ہے" },
              { icon: Heart, title: "ذاتی کتب خانہ", description: "اپنے سیکھنے کے سفر کو منظم کرنے کے لیے پسندیدہ کو محفوظ کریں اور مرضی کی فہرستیں بنائیں" },
              { icon: Globe, title: "کثیر لسانی", description: "عربی، اردو اور بہت سی زبانوں میں دستیاب مواد" },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group p-8 rounded-2xl glass-dark hover-lift border border-border/50 hover:border-primary/40 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-sm">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground/70 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-5xl mx-auto text-center"
          >
            <div className="gradient-primary text-primary-foreground p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="relative z-10">
                <h3 className="font-display text-3xl md:text-5xl font-bold mb-6">{"اپنا سفر شروع کریں"}</h3>
                <p className="opacity-90 mb-10 text-lg lg:text-xl">{"ہزاروں مستند اسلامی وسائل تک رسائی حاصل کرنے کے لیے ایک مفت اکاؤنٹ بنائیں۔"}</p>
                <Button asChild variant="secondary" size="lg" className="h-14 px-12 text-lg rounded-2xl bg-white text-primary hover:bg-white/90">
                  <Link href="/register">{"مفت شروع کریں"}</Link>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
              {[
                { label: "اسلامی کتب", key: "books" },
                { label: "آڈیو خطبات", key: "audio" },
                { label: "ویڈیو مواد", key: "video" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-card/50 glass border border-border/50 rounded-2xl p-6">
                  <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-3">
                    {stats?.[stat.key as keyof typeof stats] || 0}
                  </div>
                  <div className="text-muted-foreground text-sm font-medium uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
