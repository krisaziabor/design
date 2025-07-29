import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoElement {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  priority: 'high' | 'medium' | 'low';
  inView: boolean;
  index: number;
}

interface VideoProcessingQueue {
  highPriority: VideoElement[];
  mediumPriority: VideoElement[];
  lowPriority: VideoElement[];
}

export function useVideoProcessingQueue() {
  const [queue, setQueue] = useState<VideoProcessingQueue>({
    highPriority: [],
    mediumPriority: [],
    lowPriority: [],
  });
  
  const [processedVideos, setProcessedVideos] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const processingRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<VideoProcessingQueue>({
    highPriority: [],
    mediumPriority: [],
    lowPriority: [],
  });

  // Update refs when state changes
  useEffect(() => {
    processingRef.current = processing;
    queueRef.current = queue;
  }, [processing, queue]);

  const addToQueue = useCallback((videoElement: VideoElement) => {
    if (processedVideos.has(videoElement.id) || processing.has(videoElement.id)) {
      return;
    }

    setQueue(prevQueue => {
      const newQueue = { ...prevQueue };
      
      // Remove from any existing queue
      newQueue.highPriority = newQueue.highPriority.filter(v => v.id !== videoElement.id);
      newQueue.mediumPriority = newQueue.mediumPriority.filter(v => v.id !== videoElement.id);
      newQueue.lowPriority = newQueue.lowPriority.filter(v => v.id !== videoElement.id);
      
      // Add to appropriate priority queue
      if (videoElement.priority === 'high') {
        newQueue.highPriority.push(videoElement);
      } else if (videoElement.priority === 'medium') {
        newQueue.mediumPriority.push(videoElement);
      } else {
        newQueue.lowPriority.push(videoElement);
      }
      
      return newQueue;
    });
  }, [processedVideos, processing]);

  const updatePriority = useCallback((id: string, newPriority: 'high' | 'medium' | 'low', inView: boolean) => {
    setQueue(prevQueue => {
      const newQueue = { ...prevQueue };
      
      // Find the video in any queue
      let videoElement: VideoElement | undefined;
      
      videoElement = newQueue.highPriority.find(v => v.id === id);
      if (videoElement) {
        newQueue.highPriority = newQueue.highPriority.filter(v => v.id !== id);
      } else {
        videoElement = newQueue.mediumPriority.find(v => v.id === id);
        if (videoElement) {
          newQueue.mediumPriority = newQueue.mediumPriority.filter(v => v.id !== id);
        } else {
          videoElement = newQueue.lowPriority.find(v => v.id === id);
          if (videoElement) {
            newQueue.lowPriority = newQueue.lowPriority.filter(v => v.id !== id);
          }
        }
      }
      
      if (videoElement) {
        videoElement.priority = newPriority;
        videoElement.inView = inView;
        
        if (newPriority === 'high') {
          newQueue.highPriority.unshift(videoElement); // Add to front for immediate processing
        } else if (newPriority === 'medium') {
          newQueue.mediumPriority.push(videoElement);
        } else {
          newQueue.lowPriority.push(videoElement);
        }
      }
      
      return newQueue;
    });
  }, []);

  const markAsProcessed = useCallback((id: string) => {
    setProcessedVideos(prev => new Set([...prev, id]));
    setProcessing(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const markAsProcessing = useCallback((id: string) => {
    setProcessing(prev => new Set([...prev, id]));
  }, []);

  const getNextVideoToProcess = useCallback(() => {
    const { highPriority, mediumPriority, lowPriority } = queueRef.current;
    
    // Process high priority first
    if (highPriority.length > 0) {
      return highPriority[0];
    }
    
    // Then medium priority
    if (mediumPriority.length > 0) {
      return mediumPriority[0];
    }
    
    // Finally low priority
    if (lowPriority.length > 0) {
      return lowPriority[0];
    }
    
    return null;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prevQueue => ({
      highPriority: prevQueue.highPriority.filter(v => v.id !== id),
      mediumPriority: prevQueue.mediumPriority.filter(v => v.id !== id),
      lowPriority: prevQueue.lowPriority.filter(v => v.id !== id),
    }));
  }, []);

  const isProcessed = useCallback((id: string) => {
    return processedVideos.has(id);
  }, [processedVideos]);

  const isProcessing = useCallback((id: string) => {
    return processing.has(id);
  }, [processing]);

  return {
    addToQueue,
    updatePriority,
    markAsProcessed,
    markAsProcessing,
    getNextVideoToProcess,
    removeFromQueue,
    isProcessed,
    isProcessing,
    queue,
    processedVideos,
    processing,
  };
} 