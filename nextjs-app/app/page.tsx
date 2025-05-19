"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { clientPublic } from "@/sanity/lib/client-public";
import ElementThumbnail from "@/app/components/ElementThumbnail";

export default function Page() {
  const [elements, setElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<{ type: 'all' | 'category' | 'subcategory', id?: string }>({ type: 'all' });

  useEffect(() => {
    async function fetchElements() {
      setLoading(true);
      const data = await clientPublic.fetch(
        '*[_type == "elements"]{_id, eagleId, fileType, fileName, file, url, mainCategory, subCategories, thumbnail, dateAdded}'
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
            <div className="text-center text-gray-400"></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-stretch">
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
