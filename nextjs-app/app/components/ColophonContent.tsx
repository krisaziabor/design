import React from 'react';

export default function ColophonContent() {
  return (
    <div className="w-full max-w-xl text-sm text-black font-normal space-y-2 font-[family-name:var(--font-albragrotesk)]">
      <div>
        Typography &rarr; Albra Grotesk by{' '}
        <a
          href="https://ultra-kuhl.com/en/albra"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black text-gray-700"
        >
          Ultra Kuhl Type Foundry
        </a>
      </div>
      <div>
        CMS &rarr;{' '}
        <a
          href="https://www.sanity.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black text-gray-700"
        >
          Sanity
        </a>
      </div>
      <div>
        Local software &rarr;{' '}
        <a
          href="https://eagle.cool/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black text-gray-700"
        >
          Eagle
        </a>
      </div>
      <div>
        Inspiration &rarr;{' '}
        <a
          href="https://archive.saman.design/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black text-gray-700"
        >
          Saman Archive
        </a>
        ,{' '}
        <a
          href="https://www.chris-wang.com/collection"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black text-gray-700"
        >
          Chris Wang Collection
        </a>
      </div>
      <div>
        <a href="https://github.com/krisaziabor/design" className="underline hover:text-black text-gray-700 pt-2"> View source code</a>
      </div>
    </div>
  );
} 