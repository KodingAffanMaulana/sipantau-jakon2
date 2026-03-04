'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Login</h1>

      <form onSubmit={handleLogin} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            borderRadius: 8,
            border: '1px solid #000',
            cursor: 'pointer',
          }}>
          {loading ? 'Loading...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
