import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    router.push('/login');
  }, [router]);

  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No token found');
    }


    try {
        const response = await fetch('/api/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Token refresh failed');
          }
    
          localStorage.setItem('authToken', data.token);
          return data.token;
        } catch (err) {
          console.error('Token refresh failed:', err);
          logout();
          throw err;
        }
      }, [logout]);
    
      return { login, logout, refreshToken, isLoading, error };
    }