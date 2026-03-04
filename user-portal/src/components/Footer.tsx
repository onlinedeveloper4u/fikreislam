import { Headphones, Heart } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative border-t border-slate-900/5 bg-white/80 backdrop-blur-xl pb-24">
            <div className="container-app py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 flex items-center justify-center">
                                <img src="/logo.png" alt="Fikre Islam" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">فکر اسلام</span>
                        </div>
                        <p className="text-slate-900/30 text-sm leading-relaxed max-w-xs">
                            مختلف علماء کے بصیرت افروز خطبات اور قرآنی تلاوت — قابل اعتماد علماء سے۔
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-slate-900/60 font-bold text-xs uppercase tracking-widest mb-4">مواد</h4>
                        <ul className="space-y-3">
                            {[
                                { name: 'آڈیو', href: '/audio', icon: Headphones },
                            ].map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="group flex items-center gap-2 text-slate-900/30 hover:text-emerald-700 text-sm transition-colors"
                                    >
                                        <link.icon className="w-3.5 h-3.5 group-hover:text-emerald-600 transition-colors" />
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-slate-900/60 font-bold text-xs uppercase tracking-widest mb-4">لنکس</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="/" className="text-slate-900/30 hover:text-emerald-700 text-sm transition-colors">
                                    ہوم
                                </a>
                            </li>
                            <li>
                                <a href="/audio" className="text-slate-900/30 hover:text-emerald-700 text-sm transition-colors">
                                    آڈیو لائبریری
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Status */}
                    <div>
                        <h4 className="text-slate-900/60 font-bold text-xs uppercase tracking-widest mb-4">اسٹیٹس</h4>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-glow animate-pulse" />
                                <span className="text-emerald-700 text-xs font-bold">آن لائن</span>
                            </div>
                            <p className="text-slate-900/20 text-[11px]">تمام خدمات چل رہی ہیں</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-900/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-slate-900/20 text-xs flex items-center gap-1">
                        © {currentYear} فکر اسلام — بنایا گیا <Heart className="w-3 h-3 text-red-500/40" /> سے
                    </p>
                    <p className="text-slate-900/10 text-[10px] font-mono uppercase tracking-widest">
                        User Portal v1.0
                    </p>
                </div>
            </div>
        </footer>
    );
}
