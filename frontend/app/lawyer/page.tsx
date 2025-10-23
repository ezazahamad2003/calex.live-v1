'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LawyerLoginPage() {
  const router = useRouter();
  const [lawyerKey, setLawyerKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!lawyerKey.trim()) {
      setError('Please enter your lawyer key');
      return;
    }

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('lawyerKey', lawyerKey.trim());
    }

    // Redirect to cases list
    router.push('/lawyer/cases');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lawyer Portal</h1>
            <p className="text-gray-600">Enter your access key to review cases</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="lawyerKey" className="block text-sm font-medium text-gray-700 mb-2">
                Lawyer Access Key
              </label>
              <input
                type="password"
                id="lawyerKey"
                value={lawyerKey}
                onChange={(e) => setLawyerKey(e.target.value)}
                placeholder="Enter your access key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                This key authenticates you to view and approve cases
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Access Portal
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              For testing, use key: <code className="bg-gray-100 px-2 py-1 rounded text-xs">7f8e9a2b4c6d1e3f5a7b9c0d2e4f6a8b</code>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

