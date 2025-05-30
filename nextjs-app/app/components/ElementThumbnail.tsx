'use client';

import React, { useEffect, useState } from 'react';

import cleanUrl from '@/app/components/cleanUrl';

import Link from 'next/link';

// Custom hook to detect if an element is in view

function useInView(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new window.IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),

      options
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return inView;
}

function ElementThumbnail({
  element,
  selectedFilter,
}: {
  element: any;
  selectedFilter?: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string };
}) {
  const videoTypes = ['mov', 'mp4', 'gif'];

  const imageTypes = ['jpg', 'jpeg', 'avif', 'heic', 'png', 'webp', 'svg'];

  let imgUrl = undefined;

  let videoUrl = undefined;

  // If fileType is 'url' or 'youtube' or 'pdf' and thumbnail exists, use thumbnail as image

  if (
    (element.fileType === 'url' || element.fileType === 'youtube' || element.fileType === 'pdf') &&
    element.thumbnail &&
    element.thumbnail.asset?._ref
  ) {
    const assetId = element.thumbnail.asset._ref.replace('image-', '').replace(/-jpg/, '');

    imgUrl = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.jpg`;
  } else if (
    element.file &&
    element.file.asset?._ref &&
    (element.fileType || '').toLowerCase() === 'gif'
  ) {
    // GIFs: always use image, not video

    const assetId = element.file.asset._ref.replace('file-', '').replace(/-.*/, '');

    imgUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.gif`;
  } else if (
    element.file &&
    element.file.asset?._ref &&
    imageTypes.includes((element.fileType || '').toLowerCase())
  ) {
    const assetId = element.file.asset._ref.replace('file-', '').replace(/-.*/, '');

    const ext = (element.fileType || '').toLowerCase() === 'svg' ? 'svg' : 'jpg';

    imgUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;
  } else if (
    element.file &&
    element.file.asset?._ref &&
    videoTypes.includes((element.fileType || '').toLowerCase())
  ) {
    // Only mov/mp4/gif (but gif is handled above)

    const fileTypeLower = (element.fileType || '').toLowerCase();

    if (fileTypeLower !== 'gif') {
      const assetId = element.file.asset._ref.replace('file-', '').replace(/-.*/, '');

      const ext = element.fileType ? element.fileType.toLowerCase() : 'mp4';

      videoUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;
    }
  } else if (element.file && element.file.asset?._ref) {
    // fallback to .png for non-image fileTypes (legacy logic)

    const assetId = element.file.asset._ref.replace('file-', '').replace(/-.*/, '');

    imgUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.png`;
  }

  if (!imgUrl && !videoUrl) {
    imgUrl = '/favicon.ico';
  }

  const urlLabel = element.fileType === 'url' ? cleanUrl(element.url) : '';

  // Video in-view logic

  const [mediaLoaded, setMediaLoaded] = useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const inView = useInView(videoRef);

  useEffect(() => {
    if (videoRef.current) {
      if (inView) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [inView]);

  let href = `/elements/${element._id}`;

  if (selectedFilter && selectedFilter.type !== 'all' && selectedFilter.id) {
    let param = '';
    if (selectedFilter.type === 'category') param = 'category';
    else if (selectedFilter.type === 'subcategory') param = 'subcategory';
    else if (selectedFilter.type === 'project') param = 'project';
    if (param) href += `?${param}=${selectedFilter.id}`;
  }

  // Set a container with no fixed height, but constrain the media to a max height and maintain aspect ratio

  return (
    <Link href={href} className="block w-full h-full">
      <div
        className="relative flex flex-col items-end justify-end group w-full"
        style={{ minHeight: '0' }}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full max-h-[420px] object-contain rounded-none border-none shadow-none bg-transparent"
            muted
            loop
            playsInline
            poster={imgUrl}
            style={{ display: 'block', width: '100%' }}
            autoPlay={inView}
            onLoadedData={() => setMediaLoaded(true)}
          />
        ) : (
          <img
            src={imgUrl}
            alt={element.fileName || element.eagleId}
            className="w-full max-h-[420px] object-contain rounded-none border-none shadow-none bg-transparent"
            style={{ display: 'block', width: '100%' }}
            onLoad={() => setMediaLoaded(true)}
          />
        )}

        {mediaLoaded && urlLabel && element.url && (
          <a
            href={element.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute left-0 bottom-0 m-2 cursor-pointer flex items-center"
            tabIndex={-1}
            aria-label="Go to source"
          >
            {/* Sideways up arrow icon (rotated arrow) */}
            <svg width="22" height="22" viewBox="0 0 20 20" fill="black" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(-45deg)' }} className="opacity-20 group-hover:opacity-100 transition-opacity duration-150">
              <path d="M5 10H15M15 10L11 6M15 10L11 14" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>
    </Link>
  );
}

export default ElementThumbnail;
