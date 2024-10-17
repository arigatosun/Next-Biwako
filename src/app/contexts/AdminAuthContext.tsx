// src/app/contexts/AdminAuthContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation'; // 追加

interface AdminAuthContextType {
  adminUser: any;
  adminLoading: boolean;
  logout: () => Promise<void>; // 追加
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);
  const router = useRouter(); // 追加

  useEffect(() => {
    // セッションの取得
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('セッションの取得に失敗しました:', error.message);
        setAdminUser(null);
      } else {
        setAdminUser(session?.user ?? null);
      }
      setAdminLoading(false);
    };

    getSession();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setAdminUser(session?.user ?? null);
      setAdminLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ログアウト関数の定義
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('ログアウトに失敗しました:', error.message);
    } else {
      setAdminUser(null);
      router.push("/auth/login"); // ログイン画面にリダイレクト
    }
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminLoading, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
