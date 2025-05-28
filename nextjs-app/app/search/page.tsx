'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import ElementThumbnail from '@/app/components/ElementThumbnail';
import handleSidebarSelect, { SidebarFilter } from '@/app/components/HandleSidebarSelect';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Define selectedFilter (default to 'all', or enhance as needed)
  const selectedFilter: SidebarFilter = { type: 'all' };

  // Wrapper for Sidebar
  function onSidebarSelect(filter: SidebarFilter) {
    handleSidebarSelect(filter, router);
  }

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => setResults(data.results || []))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="min-h-screen flex flex-row bg-white dark:bg-black">
      {/* Sidebar */}
      <div className="sticky top-0 h-screen z-10">
        <Sidebar onSelect={onSidebarSelect} selected={selectedFilter} initialView="tags" />
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
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
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
} 