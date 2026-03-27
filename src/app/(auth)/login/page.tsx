'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/actions/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError("غلط ای میل یا پاس ورڈ درج کیا گیا ہے۔");
        toast.error("لاگ ان ناکام ہو گیا");
      } else {
        toast.success("خوش آمدید! آپ کامیابی سے لاگ ان ہو گئے ہیں۔");
        router.push('/admin/analytics');
        router.refresh();
      }
    } catch (err) {
      setError("کچھ غلط ہو گیا۔ براہ کرم بعد میں دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-amber-100/50 rounded-full blur-[80px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-10 flex flex-col items-center border border-gray-50">
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="mb-6 relative w-32 h-32"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent rounded-full -m-4 blur-xl opacity-50" />
            <Image
              src="/logo.png"
              alt="فکر اسلام"
              fill
              className="object-contain relative z-10 drop-shadow-md"
              sizes="128px"
              priority
            />
          </motion.div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-urdu">ایڈمن لاگ ان</h1>
            <p className="text-gray-400 text-sm font-urdu">
              اپنے اکاؤنٹ میں داخل ہونے کے لیے معلومات درج کریں
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-urdu leading-relaxed"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-right text-sm font-urdu text-gray-600 mr-1">
                ای میل
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="اپنی ای میل درج کریں"
                  required
                  className="w-full bg-[#f8fafc] border border-gray-100 h-14 px-12 rounded-xl text-right outline-none transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-emerald-600/5 focus:border-emerald-600/20 text-gray-800 font-urdu"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-700 transition-colors" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-right text-sm font-urdu text-gray-600 mr-1">
                پاس ورڈ
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="اپنا پاس ورڈ درج کریں"
                  required
                  className="w-full bg-[#f8fafc] border border-gray-100 h-14 px-12 rounded-xl text-right outline-none transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-emerald-600/5 focus:border-emerald-600/20 text-gray-800 font-urdu"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-700 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-emerald-700 hover:text-emerald-800 text-sm font-medium transition-colors font-urdu"
              >
                پاس ورڈ بھول گئے؟
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed text-lg font-urdu"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>داخل ہوں</span>
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Copyright section in a white box at the bottom */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-gray-50 flex items-center justify-center">
            <p className="text-gray-400 text-xs font-urdu">
              © فکرِ اسلام - تمام حقوق محفوظ ہیں
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
