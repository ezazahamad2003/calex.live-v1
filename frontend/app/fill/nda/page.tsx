'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SmartForm from '@/components/SmartForm';
import { getTemplates, getTemplateQuestions, submitCase, type Question } from '@/lib/api';
import { supabase, isAuthenticated } from '@/lib/supabase';

export default function FillNDAPage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    async function init() {
      // 🔒 REQUIRE AUTHENTICATION
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        // Redirect to login with return URL
        router.push('/client/login?redirect=/fill/nda');
        return;
      }

      // Load user profile to pre-fill name/email
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setClientEmail(user.email || '');
          // You can fetch user metadata for name if stored during signup
          setClientName(user.user_metadata?.full_name || '');
        }
      } catch (err) {
        console.warn('Could not load user profile:', err);
      }

      // Load template
      try {
        const templates = await getTemplates();
        if (templates.length === 0) {
          setError('No templates available');
          return;
        }
        const template = templates[0]; // Use first template
        setTemplateId(template.id);

        const qs = await getTemplateQuestions(template.id);
        setQuestions(qs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Please provide your name and email');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Get session token (required now)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/client/login?redirect=/fill/nda');
        return;
      }
      
      const result = await submitCase({
        template_id: templateId,
        client_name: clientName,
        client_email: clientEmail,
        answers,
      }, session.access_token);

      // Redirect to dashboard after successful submission
      router.push('/client/dashboard');
    } catch (err: any) {
      // Handle quota exceeded error (402)
      if (err.message?.includes('402') || err.message?.includes('quota')) {
        setQuotaExceeded(true);
        setError('You\'ve used your free NDA. Additional NDAs require payment.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to submit case');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-center mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create NDA Request</h1>
            <p className="text-gray-600 mb-8">
              Fill out the form below. A lawyer will review your request before you can download
              the finalized document.
            </p>

            {error && (
              <div className={`border rounded-lg p-4 mb-6 ${
                quotaExceeded 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {quotaExceeded ? (
                    <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <p className={quotaExceeded ? 'text-amber-800' : 'text-red-800'}>{error}</p>
                    {quotaExceeded && (
                      <div className="mt-4">
                        <Link
                          href="/client/dashboard"
                          className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          View Your NDAs
                        </Link>
                        <p className="text-sm text-amber-700 mt-2">
                          💡 Payment integration coming soon!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Client Information */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="clientEmail"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* NDA Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">NDA Details</h2>
              <SmartForm questions={questions} onSubmit={handleSubmit} isLoading={submitting} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

