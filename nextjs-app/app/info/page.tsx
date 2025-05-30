'use client';
import React, { useEffect, useState } from 'react';
import AlternateSidebar from '../components/AlternateSidebar';
import InfoContent from '../components/InfoContent';
import { clientPublic } from '@/sanity/lib/client-public';
import MobileDrawerMenu from '../components/MobileDrawerMenu';

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

export default function InfoPage() {
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    <>
      <div className="min-h-screen flex flex-row bg-white dark:bg-black">
        {!isMobile && (
          <div className="sticky top-0 h-screen z-10">
            <AlternateSidebar />
          </div>
        )}
        <main className="flex-1 flex flex-col items-start px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
          <InfoContent lastUpdated={lastUpdated} />
        </main>
      </div>
      {/* Always render the mobile drawer menu for navigation on all screens */}
      {hasMounted && isMobile && (
        <MobileDrawerMenu selected={{ type: 'all' }} onSelect={() => {}} />
      )}
    </>
  );
} 