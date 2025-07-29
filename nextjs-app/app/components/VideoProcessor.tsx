'use client';

import { useEffect, useRef } from 'react';
import { useVideoProcessing } from './VideoProcessingProvider';

interface VideoProcessorProps {
  videoUrl: string;
  elementId: string;
  thumbnailUrl?: string;
  inView: boolean;
  index: number;
  onVideoReady: (elementId: string) => void;
}

export function VideoProcessor({
  videoUrl,
  elementId,
  thumbnailUrl,
  inView,
  index,
  onVideoReady,
}: VideoProcessorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    addToQueue,
    updatePriority,
    markAsProcessed,
    markAsProcessing,
    isProcessed,
    isProcessing,
  } = useVideoProcessing();

  // Determine priority based on scroll position and index
  const getPriority = (inView: boolean, index: number): 'high' | 'medium' | 'low' => {
    if (inView) {
      return 'high';
    }
    
    // Medium priority for elements just below the viewport (within next 10 items)
    if (index < 20) {
      return 'medium';
    }
    
    return 'low';
  };

  // Add video to queue when component mounts
  useEffect(() => {
    const priority = getPriority(inView, index);
    
    addToQueue({
      id: elementId,
      videoUrl,
      thumbnailUrl,
      priority,
      inView,
      index,
    });
  }, [elementId, videoUrl, thumbnailUrl, inView, index, addToQueue]);

  // Update priority when visibility changes
  useEffect(() => {
    const priority = getPriority(inView, index);
    updatePriority(elementId, priority, inView);
  }, [inView, index, elementId, updatePriority]);

  // Process video when it's ready
  useEffect(() => {
    if (!videoRef.current || isProcessed(elementId)) {
      return;
    }

    const video = videoRef.current;
    
    const handleCanPlay = () => {
      if (!isProcessing(elementId)) {
        markAsProcessing(elementId);
      }
    };

    const handleLoadedData = () => {
      markAsProcessed(elementId);
      onVideoReady(elementId);
    };

    const handleError = () => {
      // If video fails to load, still mark as processed to avoid infinite retries
      markAsProcessed(elementId);
      onVideoReady(elementId);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [elementId, isProcessed, isProcessing, markAsProcessed, markAsProcessing, onVideoReady]);

  // Load video when in view and not yet processed
  useEffect(() => {
    if (videoRef.current && inView && !isProcessed(elementId) && !isProcessing(elementId)) {
      videoRef.current.load();
    }
  }, [inView, elementId, isProcessed, isProcessing]);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      muted
      loop
      playsInline
      preload="none"
      style={{ 
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none'
      }}
    />
  );
} 