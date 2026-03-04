import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Headphones } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.3 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
    },
};

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-12">
            {/* Background */}
            <div className="absolute inset-0 bg-slate-50" />

            {/* Animated Gradient Orbs */}
            <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-10 left-[5%] w-[600px] h-[600px] bg-emerald-accent/15 rounded-full blur-[150px] pointer-events-none"
            />
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.18, 0.08] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"
            />

            <div className="container-app relative z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-5xl mx-auto text-center"
                >
                    {/* Logo Mark */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-32 h-32 sm:w-40 sm:h-40 mx-auto flex items-center justify-center animate-pulse-glow"
                        >
                            <img src="/logo.png" alt="Fikre Islam" className="w-full h-full object-contain" />
                        </motion.div>
                    </motion.div>

                    {/* Badge */}
                    <motion.div variants={itemVariants} className="mb-6">
                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-emerald-700 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            مستند اسلامی علم
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]"
                    >
                        فکر{' '}
                        <span className="text-gradient-emerald">اسلام</span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        variants={itemVariants}
                        className="text-lg md:text-xl text-slate-900/40 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        مختلف علماء کے بصیرت افروز خطبات، سلسلے اور قرآنی تلاوت سنیں — قابل اعتماد علماء سے
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <a
                            href="/audio"
                            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-emerald-glow text-slate-900 font-bold text-base shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:scale-105 active:scale-95 transition-all"
                        >
                            آڈیو سنیں
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </motion.div>

                    {/* Single Audio Feature Card */}
                    <motion.div
                        variants={containerVariants}
                        className="max-w-md mx-auto"
                    >
                        <motion.a
                            href="/audio"
                            variants={itemVariants}
                            whileHover={{ y: -6, scale: 1.02 }}
                            className="group glass-card p-8 text-center relative overflow-hidden block"
                        >
                            {/* Gradient on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/20">
                                    <Headphones className="w-8 h-8 text-slate-900" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">آڈیو خطبات</h3>
                                <p className="text-slate-900/30 text-sm leading-relaxed">
                                    مختلف علماء کے بصیرت افروز خطبات اور قرآنی تلاوت سنیں۔
                                </p>
                            </div>
                        </motion.a>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
        </section>
    );
}
