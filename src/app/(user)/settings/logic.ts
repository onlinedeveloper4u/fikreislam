'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSettingsLogic = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setIsLoadingProfile(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setFullName((data as any).full_name || "");
      }
      setIsLoadingProfile(false);
    };

    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "غلطی",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "کامیاب!",
        description: "پروفائل کامیابی سے تبدیل ہو گیا ہے",
      });
    }

    setIsSavingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: "خالی خانے",
        description: "براہ کرم تمام خانے پُر کریں",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "پاس ورڈ مختلف ہیں",
        description: "براہ کرم یقینی بنائیں کہ دونوں پاس ورڈ ایک جیسے ہیں",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "پاس ورڈ بہت چھوٹا ہے",
        description: "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: "غلطی",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "کامیاب!",
        description: "پاس ورڈ کامیابی سے تبدیل ہو گیا ہے",
      });
      setNewPassword("");
      setConfirmPassword("");
    }

    setIsChangingPassword(false);
  };

  return {
    user,
    authLoading,
    fullName,
    setFullName,
    isLoadingProfile,
    isSavingProfile,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isChangingPassword,
    handleUpdateProfile,
    handleChangePassword,
  };
};
