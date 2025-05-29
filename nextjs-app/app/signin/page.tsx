'use client';
import React from 'react';
import AlternateSidebar from '../components/AlternateSidebar';
import CustomSignIn from '../components/CustomSignIn';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-row bg-white dark:bg-black">
      <div className="sticky top-0 h-screen z-10">
        <AlternateSidebar />
      </div>
      <main className="flex-1 flex flex-col items-start px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
        <div className="w-full max-w-xl text-sm text-black font-normal font-[family-name:var(--font-albragrotesk)]">
          <CustomSignIn />
        </div>
      </main>
    </div>
  );
} 