'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { REGISTER_MUTATION } from '@/graphql/authMutations';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [registerUser, { loading, error: apiError }] = useMutation(REGISTER_MUTATION, {
    onCompleted: () => {
      router.push('/');
      router.refresh();
    },
  });

  const validate = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password strength check (min 8 chars, at least 1 letter and 1 number)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!\%*#?&]{8,}$/;
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        'Password must be at least 8 characters long and contain at least one letter and one number.';
    }

    // Confirm Password check
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    registerUser({
      variables: { email, password },
    });
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Get started with AI Marketing Analytics</p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-xs">
            {apiError.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
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

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 letter & 1 number"
              className={`w-full px-4 py-3 bg-gray-900 border ${
                errors.password ? 'border-red-500' : 'border-gray-700'
              } rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition`}
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className={`w-full px-4 py-3 bg-gray-900 border ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
              } rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition`}
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 font-semibold rounded-lg shadow-md transition duration-150"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}