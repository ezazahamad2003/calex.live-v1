'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCaseStatus } from '@/lib/api';

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');

  const [status, setStatus] = useState<'submitted' | 'approved'>('submitted');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setError('No case ID provided');
      setPolling(false);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const result = await getCaseStatus(caseId);
        setStatus(result.status);

        if (result.status === 'approved' && result.approved_download_url) {
          setDownloadUrl(result.approved_download_url);
          setPolling(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check status');
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 5 seconds if still submitted
    if (polling && status === 'submitted') {
      intervalId = setInterval(checkStatus, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [caseId, polling, status]);

  if (error) {
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
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Link
            href="/"
            className="block text-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {status === 'submitted' ? (
              <>
                {/* Pending Review */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-yellow-600 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    NDA Submitted for Review
                  </h1>
                  <p className="text-lg text-gray-600 mb-6">
                    Your NDA request has been submitted successfully! A lawyer is reviewing your
                    document.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Case ID:</strong> <code className="text-blue-600">{caseId}</code>
                    </p>
                    <p className="text-sm text-gray-600">
                      Save this ID to check your status later. We&apos;ll notify you when the review
                      is complete.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                    <span>Checking for approval...</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Approved */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">NDA Approved! 🎉</h1>
                  <p className="text-lg text-gray-600 mb-8">
                    Your NDA has been reviewed and approved. You can now download your document.
                  </p>
                  {downloadUrl && (
                    <div className="space-y-4">
                      <a
                        href={downloadUrl}
                        className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        download
                      >
                        Download NDA Document
                      </a>
                      <p className="text-sm text-gray-500">
                        This download link will expire in 1 hour
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

