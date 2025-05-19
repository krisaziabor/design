"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { clientPublic } from "@/sanity/lib/client-public";

// Minimalistic thumbnail grid item component
function cleanUrl(url: string) {
  if (!url) return '';
  // Remove protocol, www, trailing slash, and query/hash
  let cleaned = url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/[\/?#].*$/, '');
  if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
  return cleaned;
}

function ElementThumbnail({ element }: { element: any }) {
  let imgUrl = undefined;
  // List of image file types
  const imageTypes = ['jpg', 'jpeg', 'avif', 'heic', 'png', 'webp'];
  // If fileType is 'url' and thumbnail exists, use thumbnail as image
  if (element.fileType === 'url' && element.thumbnail && element.thumbnail.asset?._ref) {
    const assetId = element.thumbnail.asset._ref.replace("image-", "").replace(/-jpg/, "");
    imgUrl = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.jpg`;
  } else if (
    element.file &&
    element.file.asset?._ref &&
    imageTypes.includes((element.fileType || '').toLowerCase())
  ) {
    const assetId = element.file.asset._ref.replace("file-", "").replace(/-.*/, "");
    // Use the correct extension for the fileType
    const ext = element.fileType ? element.fileType.toLowerCase() : 'jpg';
    imgUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;
  } else if (element.file && element.file.asset?._ref) {
    // fallback to .png for non-image fileTypes (legacy logic)
    const assetId = element.file.asset._ref.replace("file-", "").replace(/-.*/, "");
    imgUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.png`;
  }
  if (!imgUrl) {
    imgUrl = "/favicon.ico";
  }
  const urlLabel = element.fileType === 'url' ? cleanUrl(element.url) : '';
  return (
    <div className="relative flex flex-col items-center group">
      <img
        src={imgUrl}
        alt={element.fileName || element.eagleId}
        className="w-full h-32 object-cover rounded-none border-none shadow-none bg-transparent"
        style={{ display: 'block' }}
      />
      {urlLabel && element.url && (
        <a
          href={element.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-0 bottom-0 m-0 px-2 py-0.5 text-[10px] font-normal bg-black text-white rounded-tr opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer flex items-center gap-1"
          style={{ borderTopRightRadius: 4, fontFamily: 'var(--font-albragrotesk), sans-serif', letterSpacing: '0.01em' }}
          tabIndex={-1}
        >
          {urlLabel}
        </a>
      )}
    </div>
  );
}

export default function Page() {
  const [elements, setElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<{ type: 'all' | 'category' | 'subcategory', id?: string }>({ type: 'all' });

  useEffect(() => {
    async function fetchElements() {
      setLoading(true);
      const data = await clientPublic.fetch(
        '*[_type == "elements"]{_id, eagleId, fileType, fileName, file, url, mainCategory, subCategories, thumbnail}'
      );
      setElements(data || []);
      setLoading(false);
    }
    fetchElements();
  }, []);

  // Filtering logic
  let filteredElements = elements;
  if (selectedFilter.type === 'category' && selectedFilter.id) {
    filteredElements = elements.filter((el: any) => el.mainCategory?._ref === selectedFilter.id);
  } else if (selectedFilter.type === 'subcategory' && selectedFilter.id) {
    filteredElements = elements.filter((el: any) => Array.isArray(el.subCategories) && el.subCategories.some((sub: any) => sub?._ref === selectedFilter.id));
  }

  return (
    <div className="min-h-screen flex flex-row bg-white">
      <div className="sticky top-0 h-screen z-10">
        <Sidebar onSelect={setSelectedFilter} />
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 overflow-y-auto max-h-screen">
        <div className="w-full max-w-6xl flex flex-col gap-8">
          {loading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredElements.map((el: any) => (
                <ElementThumbnail key={el._id} element={el} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
