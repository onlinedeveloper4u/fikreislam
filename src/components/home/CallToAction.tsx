import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Upload, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import { useContentStats } from "@/hooks/useContentStats";
import { Skeleton } from "@/components/ui/skeleton";

const CallToAction = () => {
  const { data: stats, isLoading } = useContentStats();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 islamic-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Users */}
            <div className="relative group">
              <div className="absolute inset-0 gradient-primary rounded-3xl opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl" />
              <div className="relative p-10 text-primary-foreground">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  Begin Your Journey
                </h3>
                <p className="opacity-90 mb-8 leading-relaxed text-lg">
                  Create a free account to access thousands of authentic Islamic resources, 
                  save your favorites, and build personalized playlists for your learning.
                </p>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="group/btn bg-white text-primary hover:bg-white/90 shadow-lg"
                  asChild
                >
                  <Link to="/register">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* For Contributors */}
            <div className="relative group">
              <div className="absolute inset-0 bg-card rounded-3xl border-2 border-border group-hover:border-accent/50 transition-colors duration-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-10">
                <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mb-6 shadow-lg">
                  <Upload className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Become a Contributor
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                  Share your knowledge with the Ummah. Upload books, lectures, and educational 
                  content to benefit Muslims worldwide.
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-accent/50 hover:bg-accent/10 hover:border-accent"
                  asChild
                >
                  <Link to="/register">
                    <Upload className="w-5 h-5 mr-2" />
                    Start Contributing
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-3 mb-8">
              <img src={logo} alt="Fikr-e-Islam" className="w-10 h-10" />
              <span className="font-display text-xl font-semibold text-foreground">Fikr-e-Islam</span>
            </div>
            <p className="text-muted-foreground max-w-xl mx-auto mb-10">
              Join thousands of Muslims worldwide in their pursuit of Islamic knowledge
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                {isLoading ? (
                  <Skeleton className="h-12 w-20 mx-auto mb-2" />
                ) : (
                  <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stats?.books || 0}
                  </div>
                )}
                <div className="text-muted-foreground text-sm">Islamic Books</div>
              </div>
              <div className="text-center">
                {isLoading ? (
                  <Skeleton className="h-12 w-20 mx-auto mb-2" />
                ) : (
                  <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stats?.audio || 0}
                  </div>
                )}
                <div className="text-muted-foreground text-sm">Audio Lectures</div>
              </div>
              <div className="text-center">
                {isLoading ? (
                  <Skeleton className="h-12 w-20 mx-auto mb-2" />
                ) : (
                  <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stats?.video || 0}
                  </div>
                )}
                <div className="text-muted-foreground text-sm">Video Content</div>
              </div>
              <div className="text-center">
                {isLoading ? (
                  <Skeleton className="h-12 w-20 mx-auto mb-2" />
                ) : (
                  <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stats?.contributors || 0}
                  </div>
                )}
                <div className="text-muted-foreground text-sm">Contributors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
