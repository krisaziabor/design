import React from 'react';

export default function InfoContent({ lastUpdated }: { lastUpdated?: string }) {
  return (
    <div className="w-full max-w-xl text-sm text-selected-light dark:text-selected-dark font-normal space-y-4 font-[family-name:var(--font-albragrotesk)]">
      {lastUpdated && (
        <p className="text-default-light dark:text-default-dark">
          Elements last added {new Date(lastUpdated).toLocaleDateString()}
        </p>
      )}
      <p>
        Constellating Library is the first of several archival web projects I intend on creating this
        summer for my personal practices.
      </p>

      <p>
        Scouring the internet for the best websites, brand guidelines, and graphics is my favorite
        form of procrastination, and I wanted to share this tradition with the web.
      </p>

      <p>The Literary Library & Photographers Library are both on the way.</p>

      <p>May 2025 – ongoing</p>

      <div className="h-px w-full bg-gray-200" />

      <p>
        All rights belong to the respective owners of the content. Every element on this site has
        its own source accessible at the bottom of the second sidebar (marked by a url with an
        arrow). If you have any questions or concerns, please reach out to me at{' '}
        <a href="mailto:studio@krisaziabor.com" className="underline hover:text-selected-light dark:hover:text-selected-dark text-default-light dark:text-default-dark">studio@krisaziabor.com</a>.
      </p>
    </div>
  );
}
