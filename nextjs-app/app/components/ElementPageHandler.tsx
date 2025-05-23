"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { clientPublic } from "@/sanity/lib/client-public";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ActionSidebar from "@/app/components/ActionSidebar";
import VideoViewer from "@/app/components/VideoViewer";
import { urlForImage } from "@/sanity/lib/utils";
import CommentSection from "@/app/components/CommentSection";
import ElementThumbnail from "@/app/components/ElementThumbnail";
import cleanUrl from "@/app/components/cleanUrl";

export default function ElementPageHandler() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [element, setElement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [similarElements, setSimilarElements] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Determine selected filter from URL
  let selectedFilter: { type: 'all' | 'category' | 'subcategory', id?: string } = { type: 'all' };
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  if (subcategory) {
    selectedFilter = { type: 'subcategory', id: subcategory };
  } else if (category) {
    selectedFilter = { type: 'category', id: category };
  }

  useEffect(() => {
    async function fetchElement() {
      setLoading(true);
      const data = await clientPublic.fetch(
        '*[_type == "elements" && _id == $id]{_id, eagleId, fileType, fileName, file{..., asset, "assetOriginalFilename": asset->originalFilename}, url, mainCategory, subCategories, thumbnail, dateAdded, colors, comments[]{_key, _type, text, dateAdded, dateEdited, parentElement}}[0]',
        { id }
      );
      setElement(data);
      setLoading(false);
    }
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
      const similar = (all || []).filter((el: any) =>
        el._id !== element._id && el.url && cleanUrl(el.url) === domain
      );
      setSimilarElements(similar);
      setSimilarLoading(false);
    }
    fetchSimilar();
  }, [element]);

  // Handler for sidebar navigation
  function handleSidebarSelect(filter: { type: 'all' | 'category' | 'subcategory', id?: string }) {
    if (filter.type === 'all') {
      router.push('/');
    } else if (filter.type === 'category' && filter.id) {
      router.push(`/?category=${filter.id}`);
    } else if (filter.type === 'subcategory' && filter.id) {
      router.push(`/?subcategory=${filter.id}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-row bg-white">
      {/* Main Sidebar */}
      <div className="sticky top-0 h-screen z-10">
        <Sidebar onSelect={handleSidebarSelect} selected={selectedFilter} />
      </div>
      {/* Action Sidebar */}
      <ActionSidebar element={element} loading={loading} />
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto max-h-screen">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : element ? (
          <div className="w-full max-w-4xl flex flex-col items-center">
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
                const assetId = element.file.asset._ref.replace("file-", "").replace(/-.*/, "");
                const ext = fileType;
                fileUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;
              }
              // --- YOUTUBE EMBED LOGIC ---
              if (fileType === 'youtube' && element.url) {
                // Extract YouTube video ID from URL
                const match = element.url.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
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
                  <img src={fileUrl} alt={element.fileName || 'GIF'} className="max-w-full max-h-[70vh] rounded" style={{ display: 'block', margin: '0 auto' }} />
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
                    Debug: File URL = <code className="break-all">{fileUrl ?? "undefined"}</code>
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
                        <img
                          src={fileUrl}
                          alt={element.fileName || 'URL File'}
                          className="mb-4"
                        />
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
                      <img
                        src={fileUrl}
                        alt={element.fileName || 'SVG File'}
                        className="mb-4"
                      />
                    </div>
                  );
                }
              }
              // --- END SVG FILE LOGIC ---
              // --- GENERIC IMAGE FILE LOGIC ---
              const genericImageTypes = ["jpg", "jpeg", "png", "webp", "avif", "heic", "svg"];
              if (genericImageTypes.includes(fileType) && element.file && element.file.asset?._ref) {
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
                  {JSON.stringify({
                    file: element.file,
                    assetRef: element.file?.asset?._ref,
                    fileType,
                    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
                    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
                  }, null, 2)}
                </pre>
              );
            })()}
          </div>
        ) : (
          <div className="text-center text-red-400">Element not found.</div>
        )}
        {/* Comment Section */}
        {element && (
          <CommentSection comments={Array.isArray(element.comments) ? element.comments : []} id="comment-section" />
        )}
        {/* Similar Elements Section */}
        {element && (
          <div className="w-full max-w-4xl mx-auto mt-8">
            <div className="mb-2 font-semibold text-sm">Similar elements</div>
            {similarLoading ? (
              <div className="text-gray-400">Loading...</div>
            ) : similarElements.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {similarElements.map((el) => (
                  <ElementThumbnail key={el._id} element={el} />
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">This element does not share a source with any others.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 