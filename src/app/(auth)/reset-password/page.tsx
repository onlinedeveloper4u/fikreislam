'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { resetPassword } from '@/actions/auth';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("پاس ورڈ یکساں نہیں ہیں۔");
      return;
    }
    
    setLoading(true);
    
    if (!token) {
      toast.error("آئی ڈی غائب ہے یا لنک غلط ہے۔");
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(token, password);
      if (result.error) {
        toast.error("پاس ورڈ تبدیل کرنے میں مسئلہ پیش آ گیا۔ شاید لنک کی مدت ختم ہو چکی ہو۔");
      } else {
        setCompleted(true);
        toast.success("پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔");
      }
    } catch (err) {
      toast.error("ایک غیر متوقع غلطی پیش آ گئی ہے۔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full islamic-pattern opacity-[0.03] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-10 flex flex-col items-center border border-gray-50">
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="mb-6 relative w-32 h-32 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent rounded-full -m-4 blur-xl opacity-50" />
            <Image 
              src="/logo.png" 
              alt="Logo" 
              fill 
              className="object-contain p-2 relative z-10" 
              sizes="128px"
              priority
            />
          </motion.div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-urdu">پاس ورڈ ری سیٹ کریں</h1>
            {!completed && <p className="text-gray-400 text-sm font-urdu">براہ کرم اپنا نیا پاس ورڈ درج کریں</p>}
          </div>

          {!completed ? (
            <form onSubmit={handleReset} className="w-full space-y-6">
              <div className="space-y-2">
                <label className="block text-right text-sm font-urdu text-gray-600 mr-1">نیا پاس ورڈ</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="اپنا نیا پاس ورڈ لکھیں"
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

              <div className="space-y-2">
                <label className="block text-right text-sm font-urdu text-gray-600 mr-1">پاس ورڈ کی تصدیق</label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="دوبارہ پاس ورڈ لکھیں"
                    className="w-full bg-[#f8fafc] border border-gray-100 h-14 px-12 rounded-xl text-right outline-none transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-emerald-600/5 focus:border-emerald-600/20 text-gray-800 font-urdu"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-700 transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed font-urdu text-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>پاس ورڈ ری سیٹ کریں</span>
                  </>
                )}
              </motion.button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-gray-500 hover:text-emerald-800 text-sm font-medium transition-colors font-urdu flex items-center justify-center gap-2 mx-auto"
                >
                  لاگ ان پر واپس جائیں
                  <ArrowRight className="w-4 h-4 translate-y-[1px]" />
                </button>
              </div>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 w-full"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100/50 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-800" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-urdu">پاس ورڈ تبدیل ہو گیا!</h2>
              <p className="text-gray-500 mb-8 font-urdu leading-relaxed">
                آپ کا پاس ورڈ کامیابی سے ری سیٹ کر دیا گیا ہے۔ اب آپ نئے پاس ورڈ کے ساتھ لاگ ان کر سکتے ہیں۔
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-emerald-800 text-white h-14 rounded-xl font-bold font-urdu transition-all shadow-lg hover:bg-emerald-900 text-lg shadow-emerald-950/20"
              >
                لاگ ان کریں
              </button>
            </motion.div>
          )}
        </div>
        
        {/* Copyright Section in a white box at the bottom */}
        <div className="mt-8 flex justify-center">
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
