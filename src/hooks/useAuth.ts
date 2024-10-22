// useAuth.ts

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 非アフィリエイトユーザー用ログイン
  const login = async (reservationNumber: string, email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // トークンを生成（"reservationNumber:email" を base64 エンコード）
      const token = btoa(`${reservationNumber}:${email}`);

      // ログイン成功時の処理
      localStorage.setItem('authToken', token);
      localStorage.setItem('reservationNumber', reservationNumber);
      localStorage.setItem('userEmail', email);
      router.push('/booking-confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // アフィリエイトユーザー用ログイン
  const affiliateLogin = async (affiliateCode: string, email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // サーバーのログインAPIにリクエストを送信
      const response = await fetch('/api/auth/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateCode, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ログインに失敗しました。');
      }

      const data = await response.json();
      const token = data.token;

      // ログイン成功時の処理
      localStorage.setItem('affiliateAuthToken', token);
      localStorage.setItem('affiliateCode', affiliateCode);
      router.push('/affiliate/affiliate-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト関数
  const logout = useCallback(
    (redirectPath: string = '/login') => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('reservationNumber');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('affiliateAuthToken');
      localStorage.removeItem('affiliateCode');
      router.push(redirectPath);
    },
    [router]
  );

  // トークンのリフレッシュ（必要に応じて実装）
  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('affiliateAuthToken');

    if (!token) {
      throw new Error('No token found');
    }

    // 必要であれば、トークンの有効期限を確認し、新しいトークンを取得する処理を追加します。

    return token;
  }, []);

  return { login, affiliateLogin, logout, refreshToken, isLoading, error };
}
