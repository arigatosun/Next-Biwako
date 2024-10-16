// src/hooks/useAuth.ts

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
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationNumber, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // ログイン成功時の処理
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userName', data.userName);
      router.push('/booking-confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid reservation number or email');
    } finally {
      setIsLoading(false);
    }
  };

  // アフィリエイト用ログイン
  const affiliateLogin = async (affiliateCode: string, email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/affiliate', { // APIエンドポイントを変更
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ affiliateCode, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Affiliate Login failed');
      }

      // ログイン成功時の処理
      localStorage.setItem('affiliateAuthToken', data.token);
      localStorage.setItem('affiliateCode', affiliateCode);
      router.push('/affiliate/affiliate-dashboard'); // ログイン後の遷移先を設定
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid affiliate code or email');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('affiliateAuthToken');
    localStorage.removeItem('affiliateCode');
    router.push('/login');
  }, [router]);

  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    const affiliateToken = localStorage.getItem('affiliateAuthToken');
    if (!token && !affiliateToken) {
      throw new Error('No token found');
    }

    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(affiliateToken ? { 'Authorization': `Bearer ${affiliateToken}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      if (data.token) {
        if (token) {
          localStorage.setItem('authToken', data.token);
        }
        if (affiliateToken) {
          localStorage.setItem('affiliateAuthToken', data.token);
        }
      }

      return data.token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      throw err;
    }
  }, [logout]);

  return { login, affiliateLogin, logout, refreshToken, isLoading, error };
}
