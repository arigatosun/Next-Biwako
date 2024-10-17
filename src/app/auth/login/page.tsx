// src/app/auth/login/page.tsx

'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import Image from "next/image";
import { useAdminAuth } from '@/app/contexts/AdminAuthContext'; // 追加

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LoginPage = () => {
  const [email, setEmail] = useState("info.nest.biwako@gmail.com"); // 初期値として管理者メールを設定
  const [password, setPassword] = useState("yasashiku1"); // 初期値として管理者パスワードを設定
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { adminUser, adminLoading } = useAdminAuth(); // 変更

  useEffect(() => {
    if (adminUser && !adminLoading) {
      router.push("/admin/admin-dashboard");
    }
  }, [adminUser, adminLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("ログイン成功:", data);
      router.push("/admin/admin-dashboard");
    } catch (error: unknown) {
      console.error("ログインエラー:", error);
      if (error instanceof Error) {
        setError("ログインに失敗しました: " + error.message);
      } else {
        setError(
          "ログインに失敗しました。メールアドレスとパスワードを確認してください。"
        );
      }
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition duration-300"
          >
            ログイン
          </button>
        </form>
        {error && (
          <div className="mt-4 text-center text-orange-600">{error}</div>
        )}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-orange-600 hover:text-orange-800"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
