'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getLawyerCaseDetail, approveCase, type CaseDetail } from '@/lib/api';

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lawyerKey, setLawyerKey] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('lawyerKey');
      if (!key) {
        router.push('/lawyer');
        return;
      }
      setLawyerKey(key);
      loadCaseDetail(key);
    }
  }, [router, caseId]);

  const loadCaseDetail = async (key: string) => {
    try {
      const data = await getLawyerCaseDetail(caseId, key);
      setCaseDetail(data);
      
      // Fetch the HTML content for preview
      const htmlResponse = await fetch(data.preview_html_url);
      const html = await htmlResponse.text();
      setHtmlContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!lawyerKey || !caseDetail) return;

    const confirmed = window.confirm(
      'Are you sure you want to approve this NDA? The client will be notified and can download the document.'
    );

    if (!confirmed) return;

    setApproving(true);
    setError(null);

    try {
      await approveCase(caseId, lawyerKey);
      // Reload case detail to show updated status
      await loadCaseDetail(lawyerKey);
      alert('Case approved successfully! Client can now download the document.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve case');
    } finally {
      setApproving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading case...</p>
        </div>
      </div>
    );
  }

  if (error && !caseDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-center mb-4">
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Link
            href="/lawyer/cases"
            className="block text-center bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  if (!caseDetail) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/lawyer/cases" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Case Review</h1>
            </div>
            <span
              className={`px-4 py-2 text-sm font-semibold rounded-full ${
                caseDetail.case.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {caseDetail.case.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Case Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caseDetail.case.client_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caseDetail.case.client_email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(caseDetail.case.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Case ID</dt>
                  <dd className="mt-1 text-xs text-gray-600 font-mono break-all">
                    {caseDetail.case.id}
                  </dd>
                </div>
              </dl>
            </div>

            {/* NDA Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">NDA Details</h2>
              <dl className="space-y-3">
                {caseDetail.answers.map((answer) => (
                  <div key={answer.key}>
                    <dt className="text-sm font-medium text-gray-500">
                      {answer.key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{answer.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              <div className="space-y-3">
                <a
                  href={caseDetail.docx_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Download DOCX
                </a>
                {caseDetail.case.status === 'submitted' && (
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {approving ? 'Approving...' : 'Approve NDA'}
                  </button>
                )}
                {caseDetail.case.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-green-800 text-sm font-medium">✓ Already Approved</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main - Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Document Preview</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Highlighted sections show filled values
                </p>
              </div>
              <div className="relative bg-gray-50 p-8 overflow-auto" style={{ height: 'calc(100vh - 250px)' }}>
                {htmlContent ? (
                  <div className="bg-white shadow-lg rounded-lg p-12 mx-auto" style={{ maxWidth: '850px' }}>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading preview...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

