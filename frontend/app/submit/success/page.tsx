import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export const dynamic = 'force-dynamic'; // Opt-out of static prerender

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
