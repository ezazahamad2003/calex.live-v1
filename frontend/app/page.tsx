import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            NDA Document Generator
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Automated NDA generation with lawyer review and approval
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-16">
            {/* Client Portal */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Start NDA</h2>
              <p className="text-gray-600 mb-6">
                Fill out a simple form to generate your NDA. A lawyer will review and approve it
                before you can download.
              </p>
              <p className="text-sm text-blue-600 font-medium mb-4">
                🎁 First NDA is free! Additional NDAs require payment.
              </p>
              <div className="space-y-3">
                <Link
                  href="/client/login"
                  className="block text-center bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign In / Sign Up
                </Link>
                <Link
                  href="/fill/nda"
                  className="block text-center border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Create NDA →
                </Link>
              </div>
            </div>

            {/* Lawyer Portal */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lawyer Portal</h2>
              <p className="text-gray-600 mb-6">
                Review submitted NDAs, preview documents with highlighted changes, and approve for
                client download.
              </p>
              <Link
                href="/lawyer"
                className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Lawyer Login
              </Link>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
                <p>Fill out the NDA form with party details and purpose</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
                <p>A lawyer reviews the generated document</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
                <p>Once approved, download your finalized NDA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
