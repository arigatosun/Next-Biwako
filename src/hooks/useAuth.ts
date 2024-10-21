import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 予約用ログイン
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

  // アフィリエイト用ログイン
  const affiliateLogin = async (affiliateCode: string, email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // トークンを生成（"affiliateCode:email" を base64 エンコード）
      const token = btoa(`${affiliateCode}:${email}`);

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

  // ログアウト関数を更新
  const logout = useCallback((redirectPath: string = '/login') => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('reservationNumber');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('affiliateAuthToken');
    localStorage.removeItem('affiliateCode');
    router.push(redirectPath);
  }, [router]);

  // refreshToken 関数を削除または簡略化
  // クライアント側でトークンを生成しているため、リフレッシュは不要です
  const refreshToken = useCallback(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('affiliateAuthToken');
    if (!token) {
      throw new Error('No token found');
    }
    return token;
  }, []);

  return { login, affiliateLogin, logout, refreshToken, isLoading, error };
}
