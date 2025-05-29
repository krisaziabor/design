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
  const [infoMode, setInfoMode] = useState(false);
  const [infoTab, setInfoTab] = useState<'information' | 'colophon' | 'login'>('information');

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
        {infoMode ? (
          infoTab === 'information' ? (
            <div className="w-2/5 text-sm text-black font-normal whitespace-pre-line font-[family-name:var(--font-albragrotesk)]">
              {`The Design Library is the first of several library projects I intend on creating this summer.\n\nScouring the internet for the best websites, brand guidelines, and graphics is my favorite form of procrastination, and I wanted to share this tradition with the web. \n\nThe KAKA Literary Library & Photographers Library are both on the way.\n\nSummer 2025`}
            </div>
          ) : infoTab === 'colophon' ? (
            <div className="w-2/5 text-sm text-black font-normal space-y-2 font-[family-name:var(--font-albragrotesk)]">
              <div>
                Typography &rarr; Albra Grotesk by{' '}
                <a
                  href="https://ultra-kuhl.com/en/albra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black text-gray-700"
                >
                  Ultra Kuhl Type Foundry
                </a>
              </div>
              <div>
                CMS &rarr;{' '}
                <a
                  href="https://www.sanity.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black text-gray-700"
                >
                  Sanity
                </a>
              </div>
              <div>
                Local software &rarr;{' '}
                <a
                  href="https://eagle.cool/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black text-gray-700"
                >
                  Eagle
                </a>
              </div>
              <div>
                Inspiration &rarr;{' '}
                <a
                  href="https://archive.saman.design/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black text-gray-700"
                >
                  Saman Archive
                </a>
                ,{' '}
                <a
                  href="https://www.chris-wang.com/collection"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black text-gray-700"
                >
                  Chris Wang Collection
                </a>
              </div>
            </div>
          ) : infoTab === 'login' ? (
            <div className="w-2/5 text-sm text-black font-normal font-[family-name:var(--font-albragrotesk)]">
              {/* You can add your sign in component here if needed */}
            </div>
          ) : null
        ) : (
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
        )}
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