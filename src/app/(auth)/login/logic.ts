'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useLoginLogic = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "خالی خانے",
        description: "براہ کرم تمام خانے پُر کریں",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      let description = error.message;
      if (error.message === "Invalid login credentials") {
        description = "غلط ای میل یا پاس ورڈ";
      } else if (error.message.includes("Email not confirmed")) {
        description = "ای میل کی تصدیق ابھی تک نہیں ہوئی ہے";
      }

      toast({
        title: "ناکامی",
        description,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "خوش آمدید!",
      description: "کامیابی سے داخل ہو گئے",
    });

    const redirectedFrom = searchParams.get('redirectedFrom');
    router.push(redirectedFrom || "/");
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleSubmit,
  };
};
