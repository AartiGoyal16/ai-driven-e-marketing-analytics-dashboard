'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LOGIN_MUTATION } from '@/graphql/authMutations';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('reason') === 'expired';

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isExpired) {
      setSessionNotice('Session expired or access denied. Please sign in to continue.');
    }
  }, [isExpired]);

  // Validation error states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const [login, { loading, error: apiError }] = useMutation(LOGIN_MUTATION, {
    onCompleted: () => {
      // Refresh router so Next.js picks up the HttpOnly auth cookie set by server
      router.push('/');
      router.refresh();
    },
  });

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    login({
      variables: { email, password },
    });
  };

  return (
    <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
        <p className="text-gray-400 text-sm mt-1">Sign in to access your AI Marketing Analytics</p>
      </div>

      {sessionNotice && (
        <div className="mb-4 p-3 bg-amber-950/70 border border-amber-500/50 rounded-lg text-amber-200 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{sessionNotice}</span>
        </div>
      )}

      {apiError && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-xs">
          {apiError.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className={`w-full px-4 py-3 bg-gray-900 border ${
              errors.email ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition`}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-3 bg-gray-900 border ${
              errors.password ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition`}
          />
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 font-semibold rounded-lg shadow-md transition duration-150"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <p className="text-xs text-center text-gray-400 mt-6">
        Don't have an account?{' '}
        <Link href="/register" className="text-blue-400 hover:underline font-medium">
          Register here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-gray-400 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}