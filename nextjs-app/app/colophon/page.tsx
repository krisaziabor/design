'use client';
import React from 'react';
import AlternateSidebar from '../components/AlternateSidebar';
import ColophonContent from '../components/ColophonContent';

export default function ColophonPage() {
  return (
    <div className="min-h-screen flex flex-row bg-white dark:bg-black">
      <div className="sticky top-0 h-screen z-10">
        <AlternateSidebar />
      </div>
      <main className="flex-1 flex flex-col items-start px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
        <ColophonContent />
      </main>
    </div>
  );
} 