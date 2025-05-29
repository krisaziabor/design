'use client';
import React, { useEffect, useState } from 'react';
import AlternateSidebar from '../components/AlternateSidebar';
import InfoContent from '../components/InfoContent';
import { clientPublic } from '@/sanity/lib/client-public';

export default function InfoPage() {
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchLastAdded() {
      const date = await clientPublic.fetch(
        `*[_type == "elements"] | order(dateAdded desc)[0].dateAdded`
      );
      setLastUpdated(date);
    }
    fetchLastAdded();
  }, []);

  return (
    <div className="min-h-screen flex flex-row bg-white dark:bg-black">
      <div className="sticky top-0 h-screen z-10">
        <AlternateSidebar />
      </div>
      <main className="flex-1 flex flex-col items-start px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
        <InfoContent lastUpdated={lastUpdated} />
      </main>
    </div>
  );
} 