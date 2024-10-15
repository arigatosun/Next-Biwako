'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestData() {
      try {
        const response = await fetch('/api/test');
        const result = await response.json();
        
        if (result.success) {
          setTestData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch test data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchTestData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Supabase Connection Test</h1>
      {testData ? (
        <pre>{JSON.stringify(testData, null, 2)}</pre>
      ) : (
        <p>No test data found.</p>
      )}
    </div>
  );
}