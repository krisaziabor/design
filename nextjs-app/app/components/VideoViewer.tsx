import React, { useRef, useState, useEffect } from "react";

// Format seconds to HH:MM:SS
const formatTime = (secs: number) => {
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  const m = Math.floor((secs / 60) % 60).toString().padStart(2, '0');
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  return h !== '00' ? `${h}:${m}:${s}` : `${m}:${s}`;
};

export default function VideoViewer({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoWidth, setVideoWidth] = useState<number | undefined>(undefined);

  // Set duration and video width when metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoWidth(videoRef.current.clientWidth);
    }
  };

  // Update videoWidth on window resize
  useEffect(() => {
    function updateWidth() {
      if (videoRef.current) {
        setVideoWidth(videoRef.current.clientWidth);
      }
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const handleMuteUnmute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full max-h-[70vh] object-contain rounded transition-opacity duration-300${playing ? '' : ' opacity-50'}`}
        style={{ display: 'block', margin: '0 auto' }}
        muted={muted}
        controls={false}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handlePlayPause}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        autoPlay
        loop
      />
      <div
        className="flex flex-row justify-between items-center mt-2"
        style={{ width: videoWidth ? videoWidth : undefined, margin: '0 auto' }}
      >
        {/* Timestamp on the left */}
        <span className="text-xs text-gray-700">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        {/* Controls on the right */}
        <div className="flex flex-row gap-4 items-center">
          <button
            className="text-sm text-black px-2 py-1 bg-transparent border-none shadow-none hover:bg-transparent focus:outline-none"
            onClick={handleRestart}
            type="button"
          >
            Restart
          </button>
          <button
            className="text-sm text-black px-2 py-1 bg-transparent border-none shadow-none hover:bg-transparent focus:outline-none"
            onClick={handleMuteUnmute}
            type="button"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>
    </div>
  );
} 