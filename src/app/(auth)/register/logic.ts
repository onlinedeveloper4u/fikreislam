'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useRegisterLogic = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      toast({
        title: "خالی خانے",
        description: "براہ کرم تمام خانے پُر کریں",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "پاس ورڈ مختلف ہیں",
        description: "براہ کرم یقینی بنائیں کہ دونوں پاس ورڈ ایک جیسے ہیں",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "پاس ورڈ بہت چھوٹا ہے",
        description: "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { session, error } = await signUp(email, password, fullName);

    if (error) {
      let message = error.message;
      let title = "ناکامی";

      if (error.message.includes("already registered")) {
        message = "یہ ای میل پہلے سے اندراج شدہ ہے";
      } else if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("too many requests")) {
        title = "بہت زیادہ کوششیں";
        message = "براہ کرم تھوڑی دیر بعد دوبارہ کوشش کریں";
      }

      toast({
        title: title,
        description: message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!session) {
      toast({
        title: "ای میل چیک کریں",
        description: "تصدیقی لنک آپ کے ای میل پر بھیج دیا گیا ہے",
      });
      router.push("/login");
    } else {
      toast({
        title: "اکاؤنٹ بن گیا!",
        description: "خوش آمدید! آپ کا اکاؤنٹ کامیابی سے بن گیا ہے",
      });
      router.push("/");
    }
  };

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    handleSubmit,
  };
};
