'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useVideoProcessingQueue } from './useVideoProcessingQueue';

interface VideoProcessingContextType {
  addToQueue: (videoElement: {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    priority: 'high' | 'medium' | 'low';
    inView: boolean;
    index: number;
  }) => void;
  updatePriority: (id: string, newPriority: 'high' | 'medium' | 'low', inView: boolean) => void;
  markAsProcessed: (id: string) => void;
  markAsProcessing: (id: string) => void;
  getNextVideoToProcess: () => any;
  removeFromQueue: (id: string) => void;
  isProcessed: (id: string) => boolean;
  isProcessing: (id: string) => boolean;
  queue: {
    highPriority: any[];
    mediumPriority: any[];
    lowPriority: any[];
  };
  processedVideos: Set<string>;
  processing: Set<string>;
}

const VideoProcessingContext = createContext<VideoProcessingContextType | undefined>(undefined);

export function VideoProcessingProvider({ children }: { children: ReactNode }) {
  const videoQueue = useVideoProcessingQueue();

  return (
    <VideoProcessingContext.Provider value={videoQueue}>
      {children}
    </VideoProcessingContext.Provider>
  );
}

export function useVideoProcessing() {
  const context = useContext(VideoProcessingContext);
  if (context === undefined) {
    throw new Error('useVideoProcessing must be used within a VideoProcessingProvider');
  }
  return context;
} 