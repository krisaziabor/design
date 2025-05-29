'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen">
      {/* Sidebar for 404 */}
      <div className="w-64 min-h-screen bg-white dark:bg-black flex flex-col pt-8 pb-8 pl-8 pr-4 justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-[family-name:var(--font-albragrotesk)]">
            404 error
          </div>
        </div>
        <div className="w-full flex flex-col items-start">
          <button
            className="text-sm font-semibold text-blue-600 hover:underline focus:outline-none font-[family-name:var(--font-albragrotesk)]"
            onClick={() => router.push('/')}
          >
            Home
          </button>
        </div>
      </div>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-2xl text-black dark:text-white font-[family-name:var(--font-albragrotesk)] text-center max-w-lg">
          I think you may be lost – your search result was invalid.
        </div>
      </main>
    </div>
  );
} 