'use client';

import React, { useEffect, useState, Suspense } from 'react';

import Sidebar from '@/app/components/Sidebar';
import MobileDrawerMenu from '@/app/components/MobileDrawerMenu';

import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/lib/api';

import ElementThumbnail from '@/app/components/ElementThumbnail';

import { useSearchParams } from 'next/navigation';

const clientNoCdn = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
});

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

function PageContent() {
  const searchParams = useSearchParams();

  const [elements, setElements] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<{
    type: 'all' | 'category' | 'subcategory' | 'project';
    id?: string;
  }>(() => {
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const project = searchParams.get('project');

    if (subcategory) {
      return { type: 'subcategory', id: subcategory };
    } else if (category) {
      return { type: 'category', id: category };
    } else if (project) {
      return { type: 'project', id: project };
    } else {
      return { type: 'all' };
    }
  });

  // Keep selectedFilter in sync with URL params

  React.useEffect(() => {
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const project = searchParams.get('project');

    if (subcategory) {
      setSelectedFilter({ type: 'subcategory', id: subcategory });
    } else if (category) {
      setSelectedFilter({ type: 'category', id: category });
    } else if (project) {
      setSelectedFilter({ type: 'project', id: project });
    } else {
      setSelectedFilter({ type: 'all' });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    async function fetchElements() {
      setLoading(true);

      const data = await clientNoCdn.fetch(
        '*[_type == "elements" && fileUploaded == true]{_id, eagleId, fileType, fileName, file, url, mainCategory, subCategories, thumbnail, dateAdded, connectedProjects[]->}'
      );

      // Sort by most recent dateAdded to earliest

      const sorted = (data || []).sort((a: any, b: any) => {
        const dateA = new Date(a.dateAdded).getTime();
        const dateB = new Date(b.dateAdded).getTime();
        return dateB - dateA;
      });

      setElements(sorted);

      setLoading(false);
      
      // Mark as initially loaded only if we're showing the main collection (type 'all')
      if (selectedFilter.type === 'all') {
        setHasInitiallyLoaded(true);
      }
    }

    fetchElements();
  }, [selectedFilter.type]);

  // Filtering logic

  let filteredElements = elements;

  if (selectedFilter.type === 'category' && selectedFilter.id) {
    filteredElements = elements.filter((el: any) => el.mainCategory?._ref === selectedFilter.id);
  } else if (selectedFilter.type === 'subcategory' && selectedFilter.id) {
    filteredElements = elements.filter(
      (el: any) =>
        Array.isArray(el.subCategories) &&
        el.subCategories.some((sub: any) => sub?._ref === selectedFilter.id)
    );
  } else if (selectedFilter.type === 'project' && selectedFilter.id) {
    filteredElements = elements.filter(
      (el: any) =>
        Array.isArray(el.connectedProjects) &&
        el.connectedProjects.some((proj: any) => (proj?._id || proj?._ref) === selectedFilter.id)
    );
  }

  const isMobile = useIsMobile();

  const shouldAnimateThumbnails = selectedFilter.type === 'all' && hasInitiallyLoaded && !loading;

  return (
    <>
    <div className="min-h-screen flex flex-row bg-white dark:bg-black">
        {/* Main Sidebar (desktop only) */}
        {!isMobile && (
      <div className="sticky top-0 h-screen z-10">
        <Sidebar
          onSelect={setSelectedFilter}
          selected={selectedFilter}
        />
      </div>
        )}
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
        <div className="w-full max-w-6xl flex flex-col gap-8">
          {loading ? (
            <div className="text-center text-gray-400"></div>
          ) : (
            filteredElements.length === 0 && selectedFilter.type !== 'all' ? (
              <div className="text-center text-gray-400 font-[family-name:var(--font-albragrotesk)]">
                No elements found for this {selectedFilter.type}.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-stretch">
                {filteredElements.map((el: any, index: number) => (
                  <ElementThumbnail 
                    key={el._id} 
                    element={el} 
                    selectedFilter={selectedFilter}
                    shouldAnimate={shouldAnimateThumbnails}
                    animationIndex={index}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
      {/* Mobile Drawer Menu (mobile only, overlays content) */}
      {isMobile && (
        <MobileDrawerMenu selected={selectedFilter} onSelect={setSelectedFilter} />
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400 font-[family-name:var(--font-albragrotesk)]">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
