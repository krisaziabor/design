'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AlternateSidebar() {
  const pathname = usePathname();
  const getClass = (href: string) =>
    `text-sm cursor-pointer transition-colors font-[family-name:var(--font-albragrotesk)] ` +
    (pathname === href ? 'text-selected-light dark:text-selected-dark ' : 'text-default-light dark:text-default-dark ') +
    'hover:text-selected-light dark:hover:text-selected-dark';

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-black flex flex-col pt-8 pb-8 pl-8 pr-4">
      <div className="flex flex-col w-full h-full flex-1 justify-between">
        <div className="w-full flex flex-col gap-2 mb-6">
          <Link href="/info" className={getClass('/info')}>
            Information
          </Link>
          <Link href="/colophon" className={getClass('/colophon')}>
            Colophon
          </Link>
          <Link href="/signin" className={getClass('/signin')}>
            Sign in
          </Link>
        </div>
        <div className="w-full mt-6 mb-4 flex-shrink-0 flex items-center">
          <Link
            href="/"
            className="text-sm cursor-pointer transition-colors text-default-light dark:text-default-dark hover:text-selected-light dark:hover:text-selected-dark font-[family-name:var(--font-albragrotesk)]"
            tabIndex={0}
            role="button"
          >
            Return
          </Link>
        </div>
      </div>
    </aside>
  );
} 