
import React, { useRef, useState, useEffect } from 'react';
import { Rotate3D, Pause, Play, Download } from 'lucide-react';

interface VideoViewerProps {
  videoUrl: string;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-play on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Scrubbing Logic for "360 Rotation" effect
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsScrubbing(true);
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    // Capture pointer to handle dragging outside container
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isScrubbing || !videoRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Calculate percentage 0 to 1
    let pct = x / rect.width;
    // Clamp
    pct = Math.max(0, Math.min(1, pct));
    
    // Map to video duration
    const duration = videoRef.current.duration || 1;
    videoRef.current.currentTime = pct * duration;
    setProgress(pct * 100);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsScrubbing(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
    // Optional: Auto resume play? Let's keep it paused so they can inspect.
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
       const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
       setProgress(pct);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center group">
       <div 
         ref={containerRef}
         className="relative max-w-full max-h-[600px] overflow-hidden rounded-sm cursor-ew-resize touch-none shadow-2xl border border-white/10 bg-black"
         onPointerDown={handlePointerDown}
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
       >
          <video 
            ref={videoRef}
            src={videoUrl}
            loop
            muted
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="max-h-[600px] w-auto object-contain pointer-events-none"
          />
          
          {/* Overlay Instructions */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-2 text-white/80 pointer-events-none border border-white/10">
             <Rotate3D className="w-4 h-4 text-luxe-gold" />
             <span className="text-[10px] uppercase tracking-wider font-medium">Drag to Rotate 360°</span>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button 
               onClick={togglePlay}
               className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-luxe-gold hover:text-white transition-colors shadow-lg"
             >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
             </button>
          </div>
       </div>

       {/* Progress Bar */}
       <div className="w-full max-w-xs mt-6 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-luxe-gold transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
       </div>

       {/* Download */}
       <div className="mt-6">
          <a 
             href={videoUrl} 
             download="outfit-ai-360-view.mp4"
             className="flex items-center space-x-2 text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
          >
             <Download className="w-4 h-4" />
             <span>Download 360° Video</span>
          </a>
       </div>
    </div>
  );
};
