'use client';

import React, { useEffect, useState, Suspense } from 'react';

import Sidebar from '@/app/components/Sidebar';
import { CustomSignIn } from './components/Sidebar';

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

function PageContent() {
  const searchParams = useSearchParams();

  const [elements, setElements] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

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

  const [infoMode, setInfoMode] = useState(false);

  const [infoTab, setInfoTab] = useState<'information' | 'colophon' | 'login'>('information');

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
        '*[_type == "elements"]{_id, eagleId, fileType, fileName, file, url, mainCategory, subCategories, thumbnail, dateAdded, connectedProjects[]->}'
      );

      // Sort by most recent dateAdded to earliest

      const sorted = (data || []).sort((a: any, b: any) => {
        const dateA = new Date(a.dateAdded).getTime();

        const dateB = new Date(b.dateAdded).getTime();

        return dateB - dateA;
      });

      setElements(sorted);

      setLoading(false);
    }

    fetchElements();
  }, []);

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

  return (
    <div className="min-h-screen flex flex-row bg-white dark:bg-black">
      {/* Main Sidebar */}

      <div className="sticky top-0 h-screen z-10">
        <Sidebar
          onSelect={setSelectedFilter}
          selected={selectedFilter}
          infoMode={infoMode}
          setInfoMode={setInfoMode}
          infoTab={infoTab}
          setInfoTab={setInfoTab}
        />
      </div>

      {/* Main Content */}

      <main className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
        <div className="w-full max-w-6xl flex flex-col gap-8">
          {infoMode ? (
            infoTab === 'information' ? (
              <div
                className="w-2/5 text-sm text-black font-normal whitespace-pre-line font-[family-name:var(--font-albragrotesk)]"
              >
                {`The Design Library is the first of several library projects I intend on creating this summer.\n\nScouring the internet for the best websites, brand guidelines, and graphics is my favorite form of procrastination, and I wanted to share this tradition with the web. \n\nThe KAKA Literary Library & Photographers Library are both on the way.\n\nSummer 2025`}
              </div>
            ) : infoTab === 'colophon' ? (
              <div
                className="w-2/5 text-sm text-black font-normal space-y-2 font-[family-name:var(--font-albragrotesk)]"
              >
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

                <div>
                  Contact &rarr;{' '}
                  <a
                    href="mailto:kris@krisaziabor.com"
                    className="underline hover:text-black text-gray-700"
                  >
                    kris@krisaziabor.com
                  </a>
                </div>
              </div>
            ) : (
              <CustomSignIn />
            )
          ) : loading ? (
            <div className="text-center text-gray-400"></div>
          ) : (
            filteredElements.length === 0 && selectedFilter.type !== 'all' ? (
              <div className="text-center text-gray-400 font-[family-name:var(--font-albragrotesk)]">
                No elements found for this {selectedFilter.type}.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-stretch">
                {filteredElements.map((el: any) => (
                  <ElementThumbnail key={el._id} element={el} selectedFilter={selectedFilter} />
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400 font-[family-name:var(--font-albragrotesk)]">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
