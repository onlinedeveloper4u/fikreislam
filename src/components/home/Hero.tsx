import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Book, Headphones, Video, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      <div className="absolute inset-0 islamic-pattern opacity-50" />
      
      {/* Decorative orbs */}
      <div className="absolute top-20 right-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-[5%] w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <img 
              src={logo} 
              alt="Fikr-e-Islam" 
              className="w-32 h-32 md:w-40 md:h-40 mx-auto drop-shadow-lg"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Sparkles className="w-4 h-4" />
            Your Gateway to Islamic Knowledge
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up leading-tight" style={{ animationDelay: "0.2s" }}>
            Discover the Beauty of{" "}
            <span className="text-gradient">Islamic Wisdom</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: "0.3s" }}>
            Explore a curated collection of authentic Islamic books, Qur'an recitations, 
            scholarly lectures, and educational videos to enrich your spiritual journey.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Button variant="hero" size="lg" className="w-full sm:w-auto text-base px-8" asChild>
              <Link to="/register">
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 border-primary/30 hover:bg-primary/5" asChild>
              <Link to="/books">Explore Library</Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <Link 
              to="/books" 
              className="group relative p-8 rounded-2xl bg-card/80 backdrop-blur-sm shadow-card border border-border hover:border-primary/40 transition-all duration-500 hover:shadow-glow hover:-translate-y-1"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <Book className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">Islamic Books</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Access thousands of authentic Islamic books, PDFs, and scholarly works
                </p>
              </div>
            </Link>

            <Link 
              to="/audio" 
              className="group relative p-8 rounded-2xl bg-card/80 backdrop-blur-sm shadow-card border border-border hover:border-primary/40 transition-all duration-500 hover:shadow-glow hover:-translate-y-1"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <Headphones className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">Audio Library</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Listen to beautiful Qur'an recitations, lectures, and nasheeds
                </p>
              </div>
            </Link>

            <Link 
              to="/video" 
              className="group relative p-8 rounded-2xl bg-card/80 backdrop-blur-sm shadow-card border border-border hover:border-primary/40 transition-all duration-500 hover:shadow-glow hover:-translate-y-1"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <Video className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">Video Content</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Watch educational lectures and inspiring documentaries
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
