import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-primary/30 blur-[100px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.15, 0.05],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full"
        />
      </div>

      <div className="text-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="mb-8"
        >
          <h1 className="text-[12rem] md:text-[16rem] font-display font-black text-primary/10 leading-none select-none">
            404
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                Page Not Found
              </h2>
              <p className="text-xl text-muted-foreground max-w-md mx-auto opacity-80 leading-relaxed font-medium">
                The content you are looking for has either moved or doesn't exist. Let's get you back on track.
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16"
        >
          <Link to="/">
            <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold gradient-primary shadow-xl shadow-primary/20 hover:scale-105 transition-all group">
              <Home className="mr-3 h-5 w-5" />
              Return Home
              <ArrowLeft className="ml-3 h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => window.history.back()}
            className="h-14 px-8 rounded-2xl text-lg font-bold hover:bg-primary/5 hover:text-primary transition-all"
          >
            Go Back
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 opacity-30 select-none"
        >
          <p className="font-display font-black uppercase tracking-[1em] text-sm">Fikr-e-Islam</p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
