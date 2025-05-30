'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import ElementThumbnail from '@/app/components/ElementThumbnail';
import MobileDrawerMenu from '@/app/components/MobileDrawerMenu';

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  // Sidebar always defaults to 'all'
  const selectedFilter: { type: 'all' } = { type: 'all' };
  function onSidebarSelect() {}

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => setResults(data.results || []))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <>
      <div className="min-h-screen flex flex-row bg-white dark:bg-black">
        {/* Sidebar */}
        {!isMobile && (
          <div className="sticky top-0 h-screen z-10">
            <Sidebar onSelect={onSidebarSelect} selected={selectedFilter} initialView="tags" />
          </div>
        )}
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto max-h-screen text-selected-light dark:text-selected-dark">
          <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
            <div className="font-[family-name:var(--font-albragrotesk)] text-sm mb-2">
              {q ? (
                loading ? (
                  <>Searching for <span className="font-semibold">&quot;{q}&quot;</span>...</>
                ) : (
                  <>
                    {results.length} result{results.length === 1 ? '' : 's'} for <span className="font-semibold">&apos;{q}&apos;</span>
                  </>
                )
              ) : (
                <>Enter a search term.</>
              )}
            </div>
            {loading ? (
              <div className="text-sm text-gray-400 font-[family-name:var(--font-albragrotesk)]">Loading...</div>
            ) : results.length === 0 && q ? (
              <div className="text-sm text-gray-400 font-[family-name:var(--font-albragrotesk)]">No results found.</div>
            ) : (
              <div className="w-full max-w-6xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-stretch">
                  {results.map((el: any) => (
                    <ElementThumbnail key={el._id} element={el} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Mobile Drawer Menu (mobile only, overlays content) */}
      {isMobile && (
        <MobileDrawerMenu selected={{ type: 'all' }} onSelect={() => {}} />
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
} 