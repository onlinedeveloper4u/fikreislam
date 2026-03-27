'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from '@/actions/auth';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleResetRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const result = await sendPasswordResetEmail(email);
      if (result.error) {
        toast.error("کچھ غلط ہو گیا۔ براہ کرم بعد میں دوبارہ کوشش کریں۔");
      } else {
        setSubmitted(true);
        toast.success("پاس ورڈ کی تبدیلی کا لنک بھیج دیا گیا ہے۔");
      }
    } catch (err) {
      toast.error("نیٹ ورک میں مسئلہ پیش آ گیا ہے۔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-100/40 rounded-full blur-[80px]" />
      
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
            className="mb-6 relative w-32 h-32"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent rounded-full -m-4 blur-xl opacity-50" />
            <Image 
              src="/logo.png" 
              alt="Logo" 
              fill 
              className="object-contain relative z-10" 
              sizes="128px"
            />
          </motion.div>

          {!submitted ? (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1 font-urdu">پاس ورڈ ری سیٹ کریں</h1>
              <p className="text-gray-400 text-sm font-urdu">اپنے اکاؤنٹ کی ای میل درج کریں تاکہ ہم آپ کو لنک بھیج سکیں</p>
            </div>
          ) : (
            <div className="text-center mb-8 space-y-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100/50 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-800" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 font-urdu">ری سیٹ لنک بھیج دیا گیا ہے</h2>
              <p className="text-gray-500 font-urdu leading-relaxed">
                ہم نے آپ کا پاس ورڈ تبدیل کرنے کے لیے آپ کے ای میل پر ایک لنک بھیج دیا ہے۔ براہ کرم اپنا ان باکس چیک کریں۔
              </p>
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleResetRequest} className="w-full space-y-6">
              <div className="space-y-2">
                <label className="block text-right text-sm font-urdu text-gray-600 mr-1">ای میل</label>
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

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 font-urdu shadow-lg shadow-emerald-950/20 text-lg"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <span>ای میل بھیجیں</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-gray-500 hover:text-emerald-800 text-sm font-medium transition-all font-urdu flex items-center justify-center gap-2 mx-auto"
                >
                  لاگ ان پر واپس جائیں
                  <ArrowRight className="w-4 h-4 translate-y-[1px]" />
                </button>
              </div>
            </form>
          ) : (
            <div className="w-full flex flex-col items-center gap-6">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push('/login')}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white h-14 rounded-xl font-bold flex items-center justify-center font-urdu shadow-lg shadow-emerald-950/20 text-lg"
              >
                لاگ ان پر واپس جائیں
              </motion.button>
              
              <div className="text-center">
                <p className="text-gray-400 text-sm font-urdu mb-2">
                  ای میل نہیں ملی؟{' '}
                  <button
                    onClick={() => handleResetRequest()}
                    disabled={loading}
                    className="text-emerald-700 hover:underline font-bold disabled:opacity-50"
                  >
                    دوبارہ بھیجیں
                  </button>
                </p>
              </div>
            </div>
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
