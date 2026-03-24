'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useResetPasswordLogic = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // Small delay to ensure Supabase handles the recovery token
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "غلط یا ختم شدہ لنک",
          description: "براہ کرم نیا پاس ورڈ تبدیلی کا لنک حاصل کریں۔",
          variant: "destructive",
        });
        router.push("/forgot-password");
      }
    };
    checkSession();
  }, [router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "غلطی",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setIsSuccess(true);
    setIsLoading(false);

    setTimeout(() => {
      router.push("/");
    }, 3000);
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    isSuccess,
    handleSubmit,
  };
};
