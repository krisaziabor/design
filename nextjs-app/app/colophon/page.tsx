'use client';
import React from 'react';
import AlternateSidebar from '../components/AlternateSidebar';
import ColophonContent from '../components/ColophonContent';
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

export default function ColophonPage() {
  const isMobile = useIsMobile();
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
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
          <ColophonContent />
        </main>
      </div>
      {hasMounted && isMobile && (
        <MobileDrawerMenu selected={{ type: 'all' }} onSelect={() => {}} />
      )}
    </>
  );
} 