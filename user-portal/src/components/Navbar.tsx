import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Headphones, Home } from 'lucide-react';

const navLinks = [
    { name: 'ہوم', href: '/', icon: Home },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                ? 'glass-heavy shadow-2xl shadow-slate-300/40'
                : 'bg-transparent'
                }`}
        >
            <nav className="container-app flex items-center justify-between h-16 md:h-20">
                {/* Logo */}
                <a href="/" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 flex items-center justify-center">
                        <img src="/logo.png" alt="Fikre Islam" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
                        فکر اسلام
                    </span>
                </a>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-900/60 hover:text-slate-900 hover:bg-slate-900/5 transition-all duration-300"
                        >
                            <link.icon className="w-4 h-4 group-hover:text-emerald-600 transition-colors" />
                            <span>{link.name}</span>
                        </a>
                    ))}
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 rounded-xl text-slate-900/70 hover:text-slate-900 hover:bg-slate-900/5 transition-all"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="md:hidden glass-heavy border-t border-slate-900/5 overflow-hidden"
                    >
                        <div className="container-app py-4 flex flex-col gap-1">
                            {navLinks.map((link, i) => (
                                <motion.a
                                    key={link.name}
                                    href={link.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-900/70 hover:text-slate-900 hover:bg-slate-900/5 transition-all"
                                >
                                    <link.icon className="w-5 h-5 text-emerald-600/70" />
                                    <span className="font-medium">{link.name}</span>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
