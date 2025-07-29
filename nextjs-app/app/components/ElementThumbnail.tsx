'use client';

import React, { useEffect, useState } from 'react';
import cleanUrl from '@/app/components/cleanUrl';
import Link from 'next/link';
import { VideoProcessor } from './VideoProcessor';
import { useVideoProcessing } from './VideoProcessingProvider';

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
  shouldAnimate = false,
  animationIndex = 0,
}: {
  element: any;
  selectedFilter?: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string };
  shouldAnimate?: boolean;
  animationIndex?: number;
}) {
  const videoTypes = ['mov', 'mp4', 'gif'];
  const imageTypes = ['jpg', 'jpeg', 'avif', 'heic', 'png', 'webp', 'svg'];

  let imgUrl = undefined;
  let videoUrl = undefined;
  let thumbnailUrl = undefined;

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
      
      // Use thumbnail if available, otherwise fallback to a placeholder
      if (element.thumbnail && element.thumbnail.asset?._ref) {
        const thumbnailAssetId = element.thumbnail.asset._ref.replace('image-', '').replace(/-jpg/, '');
        thumbnailUrl = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${thumbnailAssetId}.jpg`;
        imgUrl = thumbnailUrl; // Use thumbnail as the initial image
      } else {
        // Fallback to a video placeholder
        imgUrl = '/video-placeholder.svg';
      }
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

  // Video processing and hover logic
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldShowAnimation, setShouldShowAnimation] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const inView = useInView(containerRef);

  const { isProcessed } = useVideoProcessing();

  // Handle video ready callback
  const handleVideoReady = (elementId: string) => {
    if (elementId === element._id) {
      setVideoReady(true);
    }
  };

  // Handle hover play/pause for processed videos
  useEffect(() => {
    if (videoRef.current && videoReady && isProcessed(element._id)) {
      if (isHovered) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, videoReady, element._id, isProcessed]);

  // Handle animation trigger when media is loaded with staggered delay
  useEffect(() => {
    if (mediaLoaded && shouldAnimate) {
      const delay = animationIndex * 50; // 50ms delay between each thumbnail
      const timer = setTimeout(() => {
        setShouldShowAnimation(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [mediaLoaded, shouldAnimate, animationIndex]);

  let href = `/elements/${element._id}`;

  if (selectedFilter && selectedFilter.type !== 'all' && selectedFilter.id) {
    let param = '';
    if (selectedFilter.type === 'category') param = 'category';
    else if (selectedFilter.type === 'subcategory') param = 'subcategory';
    else if (selectedFilter.type === 'project') param = 'project';
    if (param) href += `?${param}=${selectedFilter.id}`;
  }

  const isVideoElement = videoUrl && !element.fileType?.toLowerCase().includes('gif');
  const shouldShowVideo = isVideoElement && videoReady && isProcessed(element._id);

  return (
    <Link href={href} className="block w-full h-full">
      <div
        ref={containerRef}
        className={`relative flex flex-col items-end justify-end group w-full opacity-85 hover:opacity-100 transition-opacity duration-150 ${
          shouldAnimate && !shouldShowAnimation ? '!opacity-0' : ''
        } ${shouldShowAnimation ? 'animate-fade-in' : ''}`}
        style={{ minHeight: '0' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Always show thumbnail image first */}
        <img
          src={imgUrl}
          alt={element.fileName || element.eagleId}
          className={`w-full max-h-[420px] object-contain rounded-none border-none shadow-none bg-transparent transition-opacity duration-300 ${
            shouldShowVideo && isHovered ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ display: 'block', width: '100%' }}
          onLoad={() => setMediaLoaded(true)}
        />

        {/* Show video when processed and hovered */}
        {shouldShowVideo && (
          <video
            ref={videoRef}
            src={videoUrl}
            className={`absolute inset-0 w-full max-h-[420px] object-contain rounded-none border-none shadow-none bg-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            loop
            playsInline
            preload="metadata"
            style={{ display: 'block', width: '100%' }}
          />
        )}

        {/* Video processor for background processing */}
        {isVideoElement && videoUrl && (
          <VideoProcessor
            videoUrl={videoUrl}
            elementId={element._id}
            thumbnailUrl={thumbnailUrl}
            inView={inView}
            index={animationIndex}
            onVideoReady={handleVideoReady}
          />
        )}

        {/* Video icon for video elements */}
        {mediaLoaded && isVideoElement && (
          <div className="absolute left-0 bottom-0 m-2 flex items-center">
            <img 
              src="/video-white.svg" 
              alt="Video" 
              width="33" 
              height="33" 
              className="opacity-100"
            />
          </div>
        )}

        {/* Link icon for URL elements */}
        {mediaLoaded && urlLabel && element.url && !isVideoElement && (
          <a
            href={element.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute left-0 bottom-0 m-2 cursor-pointer flex items-center group/arrow"
            tabIndex={-1}
            aria-label="Go to source"
          >
            <img 
              src="/link-white.svg" 
              alt="Link" 
              width="33" 
              height="33" 
              className="transition-all duration-150"
              onMouseEnter={(e) => {
                e.currentTarget.src = '/link-white-hovered.svg';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.src = '/link-white.svg';
              }}
            />
          </a>
        )}
      </div>
    </Link>
  );
}

export default ElementThumbnail;
