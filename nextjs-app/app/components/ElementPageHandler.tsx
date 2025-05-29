'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import Sidebar from '@/app/components/Sidebar';

import { clientPublic } from '@/sanity/lib/client-public';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/lib/api';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import ActionSidebar from '@/app/components/ActionSidebar';

import VideoViewer from '@/app/components/VideoViewer';

import { urlForImage } from '@/sanity/lib/utils';

import CommentSection from '@/app/components/CommentSection';

import ElementThumbnail from '@/app/components/ElementThumbnail';

import cleanUrl from '@/app/components/cleanUrl';

import handleSidebarSelect, { SidebarFilter } from '@/app/components/HandleSidebarSelect';

import MobileDrawerMenu from '@/app/components/MobileDrawerMenu';

// Create a no-CDN client for fresh fetches after mutations
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

export default function ElementPageHandler() {
  const { id } = useParams();

  const router = useRouter();

  const searchParams = useSearchParams();

  const [element, setElement] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [similarElements, setSimilarElements] = useState<any[]>([]);

  const [similarLoading, setSimilarLoading] = useState(false);

  // Determine selected filter from URL

  let selectedFilter: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string } = { type: 'all' };

  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const project = searchParams.get('project');

  if (subcategory) {
    selectedFilter = { type: 'subcategory', id: subcategory };
  } else if (category) {
    selectedFilter = { type: 'category', id: category };
  } else if (project) {
    selectedFilter = { type: 'project', id: project };
  }

  const [filteredElements, setFilteredElements] = useState<any[]>([]);
  const [filteredLoading, setFilteredLoading] = useState(true);

  const fetchElement = async () => {
    setLoading(true);
    const data = await clientNoCdn.fetch(
      '*[_type == "elements" && _id == $id]{_id, eagleId, fileType, fileName, file{..., asset, "assetOriginalFilename": asset->originalFilename}, url, mainCategory, subCategories, thumbnail, dateAdded, colors, comments[]{_key, _type, text, dateAdded, dateEdited, parentElement}, connectedProjects[]->}[0]',
      { id }
    );
    setElement(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchElement();
  }, [id]);

  // Fetch similar elements by domain

  useEffect(() => {
    async function fetchSimilar() {
      if (!element || !element.url) {
        setSimilarElements([]);

        return;
      }

      setSimilarLoading(true);

      const domain = cleanUrl(element.url);

      // Fetch all elements with a url

      const all = await clientPublic.fetch(
        '*[_type == "elements" && defined(url)]{_id, eagleId, fileType, fileName, file, url, mainCategory, subCategories, thumbnail, dateAdded}'
      );

      // Filter by domain, exclude current element

      const similar = (all || []).filter(
        (el: any) => el._id !== element._id && el.url && cleanUrl(el.url) === domain
      );

      setSimilarElements(similar);

      setSimilarLoading(false);
    }

    fetchSimilar();
  }, [element]);

  // Fetch all elements in the current filter for prev/next navigation
  useEffect(() => {
    async function fetchFiltered() {
      setFilteredLoading(true);
      let query = '*[_type == "elements"]{_id, dateAdded, mainCategory, subCategories, connectedProjects}';
      const all = await clientNoCdn.fetch(query);
      let filtered = all;
      if (selectedFilter.type === 'category' && selectedFilter.id) {
        filtered = all.filter((el: any) => el.mainCategory?._ref === selectedFilter.id);
      } else if (selectedFilter.type === 'subcategory' && selectedFilter.id) {
        filtered = all.filter((el: any) =>
          Array.isArray(el.subCategories) &&
          el.subCategories.some((sub: any) => sub?._ref === selectedFilter.id)
        );
      } else if (selectedFilter.type === 'project' && selectedFilter.id) {
        filtered = all.filter((el: any) =>
          Array.isArray(el.connectedProjects) &&
          el.connectedProjects.some((proj: any) => (proj?._id || proj?._ref) === selectedFilter.id)
        );
      }
      // Sort by dateAdded descending (most recent first)
      filtered = filtered.sort((a: any, b: any) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
      setFilteredElements(filtered);
      setFilteredLoading(false);
    }
    fetchFiltered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcategory, project]);

  // Handler for sidebar navigation

  function onSidebarSelect(filter: SidebarFilter) {
    handleSidebarSelect(filter, router);
  }

  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-row bg-white dark:bg-black">
      {/* Main Sidebar (desktop only) */}
      {!isMobile && (
        <div className="sticky top-0 h-screen z-10">
          <Sidebar onSelect={onSidebarSelect} selected={selectedFilter} initialView={selectedFilter.type === 'project' ? 'projects' : 'tags'} />
        </div>
      )}
      {/* Action Sidebar (desktop only) */}
      {!isMobile && (
        <div className="sticky top-0 h-screen z-10">
          <ActionSidebar element={element} loading={loading} />
        </div>
      )}
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
        {/* --- MOBILE LAYOUT --- */}
        {isMobile && (
          <MobileDrawerMenu selected={selectedFilter} onSelect={onSidebarSelect} />
        )}
        {isMobile ? (
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
            {/* 1. Prev/Next Navigation */}
            {!filteredLoading && filteredElements.length > 0 && element && (
              <div className="flex w-full justify-start mb-2 pt-2 pb-2">
                {(() => {
                  const currentIndex = filteredElements.findIndex((el) => el._id === id);
                  const prev = currentIndex > 0 ? filteredElements[currentIndex - 1] : null;
                  const next = currentIndex < filteredElements.length - 1 ? filteredElements[currentIndex + 1] : null;
                  // Build query params for navigation
                  const params = [];
                  if (selectedFilter.type === 'category' && selectedFilter.id) params.push(`category=${selectedFilter.id}`);
                  if (selectedFilter.type === 'subcategory' && selectedFilter.id) params.push(`subcategory=${selectedFilter.id}`);
                  if (selectedFilter.type === 'project' && selectedFilter.id) params.push(`project=${selectedFilter.id}`);
                  const paramStr = params.length ? `?${params.join('&')}` : '';
                  return (
                    <div className="flex gap-6">
                      {prev ? (
                        <Link href={`/elements/${prev._id}${paramStr}`} className="text-sm text-default-light dark:text-default-dark hover:text-selected-light dark:hover:text-selected-dark cursor-pointer select-none">Prev</Link>
                      ) : (
                        <span className="text-sm text-default-light dark:text-default-dark opacity-50 cursor-not-allowed select-none">Prev</span>
                      )}
                      {next ? (
                        <Link href={`/elements/${next._id}${paramStr}`} className="text-sm text-default-light dark:text-default-dark hover:text-selected-light dark:hover:text-selected-dark cursor-pointer select-none transition-colors">Next</Link>
                      ) : (
                        <span className="text-sm text-default-light dark:text-default-dark opacity-50 cursor-not-allowed select-none">Next</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            {/* 2. Element Display */}
            {loading ? (
              <div className="text-center text-gray-700 font-[family-name:var(--font-albragrotesk)]">One moment...</div>
            ) : element ? (
              <div className="w-full flex flex-col items-center text-black dark:text-white">
                {/* Video display logic for mov/mp4/gif */}

                {(() => {
                  const videoTypes = ['mov', 'mp4'];

                  const fileType = (element.fileType || '').toLowerCase();

                  let fileUrl: string | undefined = undefined;

                  if (
                    element.file &&
                    element.file.asset?._ref &&
                    (videoTypes.includes(fileType) || fileType === 'gif')
                  ) {
                    const assetId = element.file.asset._ref.replace('file-', '').replace(/-.*/, '');

                    const ext = fileType;

                    fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;
                  }

                  // --- YOUTUBE EMBED LOGIC ---

                  if (fileType === 'youtube' && element.url) {
                    // Extract YouTube video ID from URL

                    const match = element.url.match(
                      /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
                    );

                    const videoId = match ? match[1] : null;

                    if (videoId) {
                      const embedUrl = `https://www.youtube.com/embed/${videoId}`;

                      return (
                        <div className="w-full flex justify-center">
                          <iframe
                            width="800"
                            height="450"
                            src={embedUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="rounded max-w-full max-h-[70vh]"
                          ></iframe>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
                          Invalid YouTube URL: <code className="break-all">{element.url}</code>
                        </div>
                      );
                    }
                  }

                  // --- END YOUTUBE EMBED LOGIC ---

                  if (fileType === 'gif' && fileUrl) {
                    return (
                      <img
                        src={fileUrl}
                        alt={element.fileName || 'GIF'}
                        className="max-w-full max-h-[70vh] rounded"
                        style={{ display: 'block', margin: '0 auto' }}
                      />
                    );
                  }

                  if (fileUrl && videoTypes.includes(fileType)) {
                    // Minimalist video viewer with play/pause and mute/unmute

                    return <VideoViewer videoUrl={fileUrl} />;
                  }

                  // If fileUrl is set but not rendered, show the URL for debugging

                  if (fileUrl) {
                    return (
                      <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
                        Debug: File URL = <code className="break-all">{fileUrl ?? 'undefined'}</code>
                      </div>
                    );
                  }

                  // --- URL IMAGE LOGIC ---

                  if (fileType === 'url' && element.file && element.file.asset?._ref) {
                    const assetRef = element.file.asset._ref;

                    if (assetRef.startsWith('image-')) {
                      const imageUrl = urlForImage(element.file)?.width(1200).height(800).url();

                      if (imageUrl) {
                        return (
                          <div>
                            <img
                              src={imageUrl}
                              alt={element.fileName || 'URL Image'}
                              className="mb-4"
                            />
                          </div>
                        );
                      }
                    } else if (assetRef.startsWith('file-')) {
                      const assetId = assetRef.replace('file-', '').replace(/-.*/, '');

                      const extMatch = assetRef.match(/-([a-z0-9]+)$/i);

                      const ext = extMatch ? extMatch[1] : 'png';

                      const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'heic'];

                      if (imageExts.includes(ext.toLowerCase())) {
                        const fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;

                        return (
                          <div>
                            <img src={fileUrl} alt={element.fileName || 'URL File'} className="mb-4" />
                          </div>
                        );
                      }
                    }
                  }

                  // --- END URL IMAGE LOGIC ---

                  // --- SVG FILE LOGIC ---

                  if (fileType === 'svg' && element.file && element.file.asset?._ref) {
                    const assetRef = element.file.asset._ref;

                    if (assetRef.startsWith('file-')) {
                      const assetId = assetRef.replace('file-', '').replace(/-.*/, '');

                      const fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.svg`;

                      return (
                        <div className="pt-8">
                          <img src={fileUrl} alt={element.fileName || 'SVG File'} className="mb-4" />
                        </div>
                      );
                    }
                  }

                  // --- END SVG FILE LOGIC ---

                  // --- GENERIC IMAGE FILE LOGIC ---

                  const genericImageTypes = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'svg'];

                  if (
                    genericImageTypes.includes(fileType) &&
                    element.file &&
                    element.file.asset?._ref
                  ) {
                    const assetRef = element.file.asset._ref;

                    if (assetRef.startsWith('file-')) {
                      const assetId = assetRef.replace('file-', '').replace(/-.*/, '');

                      const extMatch = assetRef.match(/-([a-z0-9]+)$/i);

                      const ext = extMatch ? extMatch[1] : fileType;

                      const fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;

                      return (
                        <div>
                          <img
                            src={fileUrl}
                            alt={element.fileName || `${ext.toUpperCase()} File`}
                            className="mb-4"
                          />
                        </div>
                      );
                    }
                  }

                  // --- END GENERIC IMAGE FILE LOGIC ---

                  // --- PDF FILE LOGIC ---

                  if (fileType === 'pdf' && element.file && element.file.asset?._ref) {
                    const assetRef = element.file.asset._ref;

                    if (assetRef.startsWith('file-')) {
                      const assetId = assetRef.replace('file-', '').replace(/-.*/, '');

                      const fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.pdf`;

                      return (
                        <div className="w-full flex justify-center">
                          <iframe
                            src={fileUrl}
                            title={element.fileName || 'PDF File'}
                            width="800"
                            height="1000"
                            style={{ width: '100%', maxWidth: 800, minHeight: 600 }}
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                  }

                  // --- END PDF FILE LOGIC ---

                  return (
                    <pre className="text-xs text-gray-500 bg-gray-100 p-2 rounded mb-2">
                      {JSON.stringify(
                        {
                          file: element.file,

                          assetRef: element.file?.asset?._ref,

                          fileType,

                          projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,

                          dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
                        },
                        null,
                        2
                      )}
                    </pre>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center text-red-400">Element not found.</div>
            )}
            {/* 3. Colors, Link, Time */}
            {element && (
              <div className="w-full flex flex-col gap-2 mt-2">
                {/* Colors */}
                <ColorSwatchRow colors={element.colors} />
                {/* Link */}
                {element.url && (
                  <a
                    href={element.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-black dark:text-white hover:underline-none focus:underline-none text-sm break-all pl-0 font-[family-name:var(--font-albragrotesk)]"
                  >
                    <span>{element.url}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-black dark:text-white"
                    >
                      <path
                        d="M5 10H15M15 10L11 6M15 10L11 14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                )}
                {/* File name */}
                {element.file?.asset?.originalFilename && (
                  <div className="text-sm text-black dark:text-white truncate pl-0 font-[family-name:var(--font-albragrotesk)]">
                    {element.file.asset.originalFilename}
                  </div>
                )}
                {/* Time */}
                {element.dateAdded && (
                  <div className="text-sm text-default-light dark:text-default-dark font-[family-name:var(--font-albragrotesk)]">
                    {new Date(element.dateAdded).toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>
                )}
              </div>
            )}
            {/* 4. Connected Projects (with update button) */}
            {element && (
              <div className="w-full flex flex-col gap-2 mt-2">
                <div className="text-sm font-semibold text-selected-light dark:text-selected-dark mb-2 font-[family-name:var(--font-albragrotesk)]">Connected projects</div>
                {Array.isArray(element.connectedProjects) && element.connectedProjects.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {element.connectedProjects.map((proj: any, idx: number) => (
                      <li key={proj._id || proj._ref || idx} className="text-sm text-selected-light dark:text-selected-dark font-[family-name:var(--font-albragrotesk)]">
                        {proj.name || proj.title || 'Project'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-default-light dark:text-default-dark font-[family-name:var(--font-albragrotesk)]">
                    This element is not connected to any projects.
                  </div>
                )}
              </div>
            )}
            {/* 5. Comments (with add new comment button) */}
            {element && (
              <div className="w-full flex flex-col gap-2">
                <CommentSection
                  comments={Array.isArray(element.comments) ? element.comments : []}
                  id="comment-section"
                  elementId={element._id}
                  onCommentDeleted={fetchElement}
                />
              </div>
            )}
            {/* 6. Similar Elements */}
            {element && (
              <div className="w-full flex flex-col gap-2 mt-2">
                <div className="mb-2 font-semibold text-sm text-selected-light dark:text-selected-dark">Similar elements</div>
                {similarLoading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : similarElements.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {similarElements.map((el) => (
                      <ElementThumbnail key={el._id} element={el} />
                    ))}
                  </div>
                ) : (
                  <div className="text-default-light dark:text-default-dark text-sm">This element does not share a source with any others.</div>
                )}
              </div>
            )}
            {/* 7. Move to Top Button */}
            <button
              className="mt-6 mb-2 text-xs text-blue-600 dark:text-blue-400 underline self-center"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Move to top
            </button>
          </div>
        ) : (
        // --- DESKTOP LAYOUT (unchanged) ---
        <>
          {/* Prev/Next Navigation */}
          {!filteredLoading && filteredElements.length > 0 && element && (
            <div className="w-full max-w-4xl flex justify-end mb-4">
              {(() => {
                const currentIndex = filteredElements.findIndex((el) => el._id === id);
                const prev = currentIndex > 0 ? filteredElements[currentIndex - 1] : null;
                const next = currentIndex < filteredElements.length - 1 ? filteredElements[currentIndex + 1] : null;
                // Build query params for navigation
                const params = [];
                if (selectedFilter.type === 'category' && selectedFilter.id) params.push(`category=${selectedFilter.id}`);
                if (selectedFilter.type === 'subcategory' && selectedFilter.id) params.push(`subcategory=${selectedFilter.id}`);
                if (selectedFilter.type === 'project' && selectedFilter.id) params.push(`project=${selectedFilter.id}`);
                const paramStr = params.length ? `?${params.join('&')}` : '';
                return (
                  <div className="flex gap-6">
                    {prev ? (
                      <Link href={`/elements/${prev._id}${paramStr}`} className="text-sm text-default-light dark:text-default-dark hover:text-selected-light dark:hover:text-selected-dark cursor-pointer select-none">Prev</Link>
                    ) : (
                      <span className="text-sm text-default-light dark:text-default-dark opacity-50 cursor-not-allowed select-none">Prev</span>
                    )}
                    {next ? (
                      <Link href={`/elements/${next._id}${paramStr}`} className="text-sm text-default-light dark:text-default-dark hover:text-selected-light dark:hover:text-selected-dark cursor-pointer select-none transition-colors">Next</Link>
                    ) : (
                      <span className="text-sm text-default-light dark:text-default-dark opacity-50 cursor-not-allowed select-none">Next</span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          {loading ? (
            <div className="text-center text-gray-700 font-[family-name:var(--font-albragrotesk)]">One moment...</div>
          ) : element ? (
            <div className="w-full max-w-4xl flex flex-col items-center text-black dark:text-white">
              {/* Video display logic for mov/mp4/gif */}

              {(() => {
                const videoTypes = ['mov', 'mp4'];

                const fileType = (element.fileType || '').toLowerCase();

                let fileUrl: string | undefined = undefined;

                if (
                  element.file &&
                  element.file.asset?._ref &&
                  (videoTypes.includes(fileType) || fileType === 'gif')
                ) {
                  const assetId = element.file.asset._ref.replace('file-', '').replace(/-.*/, '');

                  const ext = fileType;

                  fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;
                }

                // --- YOUTUBE EMBED LOGIC ---

                if (fileType === 'youtube' && element.url) {
                  // Extract YouTube video ID from URL

                  const match = element.url.match(
                    /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
                  );

                  const videoId = match ? match[1] : null;

                  if (videoId) {
                    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

                    return (
                      <div className="w-full flex justify-center">
                        <iframe
                          width="800"
                          height="450"
                          src={embedUrl}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="rounded max-w-full max-h-[70vh]"
                        ></iframe>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
                        Invalid YouTube URL: <code className="break-all">{element.url}</code>
                      </div>
                    );
                  }
                }

                // --- END YOUTUBE EMBED LOGIC ---

                if (fileType === 'gif' && fileUrl) {
                  return (
                    <img
                      src={fileUrl}
                      alt={element.fileName || 'GIF'}
                      className="max-w-full max-h-[70vh] rounded"
                      style={{ display: 'block', margin: '0 auto' }}
                    />
                  );
                }

                if (fileUrl && videoTypes.includes(fileType)) {
                  // Minimalist video viewer with play/pause and mute/unmute

                  return <VideoViewer videoUrl={fileUrl} />;
                }

                // If fileUrl is set but not rendered, show the URL for debugging

                if (fileUrl) {
                  return (
                    <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
                      Debug: File URL = <code className="break-all">{fileUrl ?? 'undefined'}</code>
                    </div>
                  );
                }

                // --- URL IMAGE LOGIC ---

                if (fileType === 'url' && element.file && element.file.asset?._ref) {
                  const assetRef = element.file.asset._ref;

                  if (assetRef.startsWith('image-')) {
                    const imageUrl = urlForImage(element.file)?.width(1200).height(800).url();

                    if (imageUrl) {
                      return (
                        <div>
                          <img
                            src={imageUrl}
                            alt={element.fileName || 'URL Image'}
                            className="mb-4"
                          />
                        </div>
                      );
                    }
                  } else if (assetRef.startsWith('file-')) {
                    const assetId = assetRef.replace('file-', '').replace(/-.*/, '');

                    const extMatch = assetRef.match(/-([a-z0-9]+)$/i);

                    const ext = extMatch ? extMatch[1] : 'png';

                    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'heic'];

                    if (imageExts.includes(ext.toLowerCase())) {
                      const fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;

                      return (
                        <div>
                          <img src={fileUrl} alt={element.fileName || 'URL File'} className="mb-4" />
                        </div>
                      );
                    }
                  }
                }

                // --- END URL IMAGE LOGIC ---

                // --- SVG FILE LOGIC ---

                if (fileType === 'svg' && element.file && element.file.asset?._ref) {
                  const assetRef = element.file.asset._ref;

                  if (assetRef.startsWith('file-')) {
                    const assetId = assetRef.replace('file-', '').replace(/-.*/, '');

                    const fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.svg`;

                    return (
                      <div className="pt-8">
                        <img src={fileUrl} alt={element.fileName || 'SVG File'} className="mb-4" />
                      </div>
                    );
                  }
                }

                // --- END SVG FILE LOGIC ---

                // --- GENERIC IMAGE FILE LOGIC ---

                const genericImageTypes = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'svg'];

                if (
                  genericImageTypes.includes(fileType) &&
                  element.file &&
                  element.file.asset?._ref
                ) {
                  const assetRef = element.file.asset._ref;

                  if (assetRef.startsWith('file-')) {
                    const assetId = assetRef.replace('file-', '').replace(/-.*/, '');

                    const extMatch = assetRef.match(/-([a-z0-9]+)$/i);

                    const ext = extMatch ? extMatch[1] : fileType;

                    const fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;

                    return (
                      <div>
                        <img
                          src={fileUrl}
                          alt={element.fileName || `${ext.toUpperCase()} File`}
                          className="mb-4"
                        />
                      </div>
                    );
                  }
                }

                // --- END GENERIC IMAGE FILE LOGIC ---

                // --- PDF FILE LOGIC ---

                if (fileType === 'pdf' && element.file && element.file.asset?._ref) {
                  const assetRef = element.file.asset._ref;

                  if (assetRef.startsWith('file-')) {
                    const assetId = assetRef.replace('file-', '').replace(/-.*/, '');

                    const fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.pdf`;

                    return (
                      <div className="w-full flex justify-center">
                        <iframe
                          src={fileUrl}
                          title={element.fileName || 'PDF File'}
                          width="800"
                          height="1000"
                          style={{ width: '100%', maxWidth: 800, minHeight: 600 }}
                          allowFullScreen
                        />
                      </div>
                    );
                  }
                }

                // --- END PDF FILE LOGIC ---

                return (
                  <pre className="text-xs text-gray-500 bg-gray-100 p-2 rounded mb-2">
                    {JSON.stringify(
                      {
                        file: element.file,

                        assetRef: element.file?.asset?._ref,

                        fileType,

                        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,

                        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
                      },
                      null,
                      2
                    )}
                  </pre>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-red-400">Element not found.</div>
          )}
          {/* Comment Section */}
          {element && (
            <CommentSection
              comments={Array.isArray(element.comments) ? element.comments : []}
              id="comment-section"
              elementId={element._id}
              onCommentDeleted={fetchElement}
            />
          )}
          {/* Similar Elements Section */}
          {element && (
            <div className="w-full max-w-4xl mx-auto mt-8">
              <div className="mb-2 font-semibold text-sm text-selected-light dark:text-selected-dark">
                Similar elements
              </div>
              {similarLoading ? (
                <div className="text-gray-400">Loading...</div>
              ) : similarElements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {similarElements.map((el) => (
                    <ElementThumbnail key={el._id} element={el} />
                  ))}
                </div>
              ) : (
                <div className="text-default-light dark:text-default-dark text-sm">
                  This element does not share a source with any others.
                </div>
              )}
            </div>
          )}
        </>
        )}
      </main>
    </div>
  );
}

function ColorSwatchRow({ colors }: { colors: string[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  // Close modal on outside click
  React.useEffect(() => {
    if (openIdx === null) return;
    function handle(e: MouseEvent) {
      setOpenIdx(null);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [openIdx]);

  if (!Array.isArray(colors) || colors.length === 0) {
    return <span className="text-sm text-gray-400 font-[family-name:var(--font-albragrotesk)]">No colors</span>;
  }
  return (
    <div className="flex flex-row gap-2 pl-0">
      {colors.slice(0, 5).map((color, idx) => (
        <div key={color + idx} className="relative flex flex-col items-center">
          <button
            type="button"
            className="w-5 h-5 cursor-pointer border border-gray-300 rounded focus:outline-none"
            style={{ backgroundColor: color }}
            onClick={e => {
              e.stopPropagation();
              setOpenIdx(openIdx === idx ? null : idx);
            }}
            aria-label={`Show hex code for ${color}`}
          />
          {/* Modal for hex code */}
          {openIdx === idx && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded shadow-lg z-20 font-[family-name:var(--font-albragrotesk)] whitespace-nowrap border border-gray-300">
              {color}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
