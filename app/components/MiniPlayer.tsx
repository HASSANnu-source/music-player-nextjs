"use client";
import { useEffect, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, ChevronDown, Repeat } from "lucide-react";

interface MiniPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: string;
  selectedPlaylist: string;
  allMetadata: Record<string, { title: string; artist: string; picture?: string }>;
  isPlaying: boolean;
  togglePlayPause: () => void;
  toggleLoop: () => void;
  isLooped: boolean;
  handleNext: () => void;
  handlePrev: () => void;
  progress: number;
  buffered: number;
  duration: number;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatTime: (sec?: number) => string;
}

export default function MiniPlayer({
  isOpen,
  onClose,
  currentTrack,
  selectedPlaylist,
  allMetadata,
  isPlaying,
  togglePlayPause,
  toggleLoop,
  isLooped,
  handleNext,
  handlePrev,
  progress,
  buffered,
  duration,
  handleSeek,
  formatTime,
}: MiniPlayerProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // فعال کردن انیمیشن بعد از رندر اولیه
  useEffect(() => {
    if (shouldRender) {
      const frame = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setAnimate(false);
    }
  }, [shouldRender]);

  if (!shouldRender) return null;

  const metadata = allMetadata[currentTrack] ?? {
    title: "Unknown Track",
    artist: "Unknown Artist",
    picture: "/default-cover.png",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col gap-8 items-center justify-center 
      bg-black/70 backdrop-blur-lg transform transition-all duration-300
      ${isOpen && animate ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
    >
      <div
        className="absolute inset-0 -z-10 bg-center bg-cover brightness-50 blur-2xl"
        style={{ backgroundImage: `url(${metadata.picture})` }}
      />

      <button
        onClick={onClose}
        className="absolute top-5 left-5 bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
      >
        <ChevronDown size={22} />
      </button>

      <div className="text-center">
        <p className="font-semibold text-sm text-gray-300">
          PLAYING FROM
        </p>
        <p>
          {selectedPlaylist}
        </p>
      </div>
      
      <img
        src={metadata.picture}
        alt="cover"
        className="w-60 h-60 rounded-2xl object-cover transition-transform duration-500"
      />

      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold truncate max-w-[90vw]">
          {metadata.title}
        </h2>
        <p className="text-gray-300 text-sm sm:text-base  truncate max-w-[80vw]">
          {metadata.artist}
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="relative w-full h-1.5 rounded-lg bg-gray-700">
          <div
            className="absolute top-0 left-0 h-full rounded-lg bg-gray-500"
            style={{ width: `${buffered}%` }}
          />
          <div
            className="absolute top-0 left-0 h-full rounded-lg bg-green-500"
            style={{ width: `${(progress / duration) * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            className="slider absolute top-0 left-0 w-full h-full cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          className="bg-gray-700 hover:bg-gray-600 transition rounded-full w-14 h-14 flex items-center justify-center"
          onClick={handlePrev}
        >
          <SkipBack size={24} />
        </button>
        <button
          className="bg-green-500 hover:bg-green-400 transition rounded-full w-16 h-16 flex items-center justify-center"
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button
          className="bg-gray-700 hover:bg-gray-600 transition rounded-full w-14 h-14 flex items-center justify-center"
          onClick={handleNext}
        >
          <SkipForward size={24} />
        </button>
        <button
          className={`transition rounded-full w-14 h-14 flex items-center justify-center ${isLooped ? "bg-green-500 hover:bg-green-400" : "bg-gray-700 hover:bg-gray-600"}`}
          onClick={toggleLoop}
        >
          <Repeat size={24} />
        </button>
      </div>
    </div>
  );
}
