// src/app/contexts/AdminAuthContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from '@/lib/supabaseClient';

interface AdminAuthContextType {
  adminUser: any;
  adminLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);

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

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminLoading }}>
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
