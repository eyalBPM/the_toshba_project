'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        const msg = data.error?.details?.fields
          ? Object.values(data.error.details.fields as Record<string, string[]>).flat().join(', ')
          : data.error?.message ?? 'שגיאה בהרשמה';
        setError(msg);
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/articles',
      });

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setError('שגיאה בהרשמה, נסה שוב');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-bold">הרשמה</h1>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            שם
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            אימייל
          </label>
          <input
            id="email"
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            סיסמה
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">לפחות 8 תווים</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'נרשם...' : 'הרשמה'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">או</span>
        </div>
      </div>

      <button
        onClick={() => signIn('google', { callbackUrl: '/articles' })}
        className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        הרשמה עם Google
      </button>

      <p className="text-center text-sm text-gray-500">
        כבר יש לך חשבון?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-800">
          התחברות
        </Link>
      </p>
    </div>
  );
}
