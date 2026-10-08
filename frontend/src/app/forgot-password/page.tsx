'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RESET_PASSWORD_MUTATION } from '@/graphql/authMutations';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [resetPasswordMutation, { loading, error: apiError }] = useMutation(RESET_PASSWORD_MUTATION, {
    onCompleted: () => {
      setIsSuccess(true);
    },
  });

  const validate = () => {
    const newErrors: { email?: string; newPassword?: string; confirmPassword?: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password strength check (min 8 chars, at least 1 letter and 1 number)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (!passwordRegex.test(newPassword)) {
      newErrors.newPassword =
        'Password must be at least 8 characters long and contain at least one letter and one number.';
    }

    // Confirm password check
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    resetPasswordMutation({
      variables: {
        email,
        newPassword,
      },
    });
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🔑
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
          <p className="text-gray-400 text-sm mt-1">Set a new password for your account</p>
        </div>

        {isSuccess ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-sm space-y-2">
              <span className="text-2xl block">✅</span>
              <p className="font-bold text-white">Password Updated Successfully!</p>
              <p className="text-xs text-emerald-300">
                Your password for <strong>{email}</strong> has been updated. You can now log in with your new credentials.
              </p>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg shadow-md transition duration-150"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            {apiError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-xs">
                {apiError.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Account Email Address
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

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 letter & 1 number"
                  className={`w-full px-4 py-3 bg-gray-900 border ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition`}
                />
                {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
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
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400 mt-6">
              Remembered your password?{' '}
              <Link href="/login" className="text-blue-400 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
