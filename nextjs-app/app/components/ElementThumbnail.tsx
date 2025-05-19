"use client";
import React, { useEffect, useState } from "react";
import cleanUrl from "@/app/components/cleanUrl";

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

function ElementThumbnail({ element }: { element: any }) {
  const videoTypes = ['mov', 'mp4', 'gif'];
  const imageTypes = ['jpg', 'jpeg', 'avif', 'heic', 'png', 'webp', 'svg'];
  let imgUrl = undefined;
  let videoUrl = undefined;

  // If fileType is 'url' or 'youtube' or 'pdf' and thumbnail exists, use thumbnail as image
  if ((element.fileType === 'url' || element.fileType === 'youtube' || element.fileType === 'pdf') && element.thumbnail && element.thumbnail.asset?._ref) {
    const assetId = element.thumbnail.asset._ref.replace("image-", "").replace(/-jpg/, "");
    imgUrl = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.jpg`;
  } else if (
    element.file &&
    element.file.asset?._ref &&
    (imageTypes.includes((element.fileType || '').toLowerCase()) || (element.fileType || '').toLowerCase() === 'svg')
  ) {
    const assetId = element.file.asset._ref.replace("file-", "").replace(/-.*/, "");
    const ext = (element.fileType || '').toLowerCase() === 'svg' ? 'svg' : 'jpg';
    imgUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;
  } else if (
    element.file &&
    element.file.asset?._ref &&
    videoTypes.includes((element.fileType || '').toLowerCase())
  ) {
    const assetId = element.file.asset._ref.replace("file-", "").replace(/-.*/, "");
    const ext = element.fileType ? element.fileType.toLowerCase() : 'mp4';
    videoUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.${ext}`;
  } else if (element.file && element.file.asset?._ref) {
    // fallback to .png for non-image fileTypes (legacy logic)
    const assetId = element.file.asset._ref.replace("file-", "").replace(/-.*/, "");
    imgUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${assetId}.png`;
  }
  if (!imgUrl && !videoUrl) {
    imgUrl = "/favicon.ico";
  }
  const urlLabel = element.fileType === 'url' ? cleanUrl(element.url) : '';

  // Video in-view logic
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

  // Set a container with no fixed height, but constrain the media to a max height and maintain aspect ratio
  return (
    <div className="relative flex flex-col items-end justify-end group w-full" style={{ minHeight: '0' }}>
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-[420px] object-contain rounded-none border-none shadow-none bg-transparent"
          muted
          loop
          playsInline
          style={{ display: 'block', width: '100%' }}
        />
      ) : (
        <img
          src={imgUrl}
          alt={element.fileName || element.eagleId}
          className="w-full max-h-[420px] object-contain rounded-none border-none shadow-none bg-transparent"
          style={{ display: 'block', width: '100%' }}
        />
      )}
      {urlLabel && element.url && (
        <a
          href={element.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-0 bottom-0 m-0 px-2 py-0.5 text-[10px] font-normal bg-black text-white rounded-tr opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer flex items-center gap-1"
          style={{ borderTopRightRadius: 4, fontFamily: 'var(--font-albragrotesk), sans-serif', letterSpacing: '0.01em' }}
          tabIndex={-1}
        >
          {urlLabel}
        </a>
      )}
    </div>
  );
}

export default ElementThumbnail; 