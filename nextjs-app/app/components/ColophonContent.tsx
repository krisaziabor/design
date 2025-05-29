import React from 'react';

export default function ColophonContent() {
  return (
    <div className="w-full max-w-xl text-sm text-selected-light dark:text-selected-dark font-normal space-y-2 font-[family-name:var(--font-albragrotesk)]">
      <div>
        Typography &rarr; Albra Grotesk by{' '}
        <a
          href="https://ultra-kuhl.com/en/albra"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-selected-light dark:hover:text-selected-dark text-default-light dark:text-default-dark"
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
          className="underline hover:text-selected-light dark:hover:text-selected-dark text-default-light dark:text-default-dark"
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
          className="underline hover:text-selected-light dark:hover:text-selected-dark text-default-light dark:text-default-dark"
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
          className="underline hover:text-selected-light dark:hover:text-selected-dark text-default-light dark:text-default-dark"
        >
          Saman Archive
        </a>
        ,{' '}
        <a
          href="https://www.chris-wang.com/collection"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-selected-light dark:hover:text-selected-dark text-default-light dark:text-default-dark"
        >
          Chris Wang Collection
        </a>
      </div>
      <div>
        <a href="https://github.com/krisaziabor/design" className="underline hover:text-selected-light dark:hover:text-selected-dark text-default-light dark:text-default-dark pt-2"> View source code</a>
      </div>
    </div>
  );
} 