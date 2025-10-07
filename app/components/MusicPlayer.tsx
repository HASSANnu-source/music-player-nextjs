"use client";

import TrackItem from "./TrackItem";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Repeat, SkipForward, SkipBack, Plus } from "lucide-react";

interface TrackMetadata {
  title: string;
  artist: string;
  picture?: string;
}

interface Playlist {
  name: string;
  tracks: string[];
}

const STORAGE_KEY = "Playlists";

declare global {
  interface Window {
    jsmediatags?: {
      read: (file: Blob, opts: { onSuccess: (tag: any) => void; onError: (err: any) => void }) => void;
    };
  }
}

interface MusicPlayerProps {
  playlists: Playlist[];
  selectedPlaylist: string;
}

export default function MusicPlayer({ playlists, selectedPlaylist }: MusicPlayerProps) {
  const proxy = "/api/proxy";

  const [currentPlaylistName, setCurrentPlaylistName] = useState<string>(selectedPlaylist);
  const [customPlaylist, setCustomPlaylist] = useState<string[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<string[]>(
    playlists[0]?.tracks ?? []
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [newTrack, setNewTrack] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooped, setIsLooped] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [allMetadata, setAllMetadata] = useState<Record<string, TrackMetadata>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingRequests = useRef<Set<string>>(new Set());
  const saveTimer = useRef<number | null>(null);
  const mounted = useRef(true);

  const isCustom = currentPlaylistName === "Custom";

  const getFileName = (url: string) => {
    try {
      const parts = url.split("/");
      return decodeURIComponent(parts[parts.length - 1] || "");
    } catch {
      return url;
    }
  };

  useEffect(() => {
    setCurrentPlaylistName(selectedPlaylist);
  }, [selectedPlaylist]);

  // ---------------- load saved playlist ----------------
  useEffect(() => {
    mounted.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.tracks)) setCustomPlaylist(parsed.tracks);
        if (parsed.metadata && typeof parsed.metadata === "object") {
          setAllMetadata(parsed.metadata);
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved playlist:", e);
    }
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isCustom) setCurrentPlaylist(customPlaylist);
    else {
      const pl = playlists.find((p) => p.name === currentPlaylistName);
      setCurrentPlaylist(pl?.tracks ?? []);
    }
    setCurrentIndex(0);
  }, [currentPlaylistName, customPlaylist, playlists, isCustom]);

  const currentTrack = currentPlaylist[currentIndex];

  // ---------------- audio playback ----------------
  useEffect(() => {
    setProgress(0)
    setBuffered(0)
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = currentTrack ?? "";
    audio.load();
    if (currentTrack) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else setIsPlaying(false);
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onProgress = () => {
      if (audio.buffered.length > 0 && duration > 0) {
        const end = audio.buffered.end(audio.buffered.length - 1);
        const pct = Math.min(100, (end / duration) * 100);
        setBuffered(pct);
      }
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("progress", onProgress);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("progress", onProgress);
    };
  }, [duration, currentTrack]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, []);

  const toggleLoop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = !audio.loop;
    setIsLooped(audio.loop);
  }, []);

  const handleNext = useCallback(() => {
    if (!currentPlaylist.length) return;
    setCurrentIndex((p) => (p + 1) % currentPlaylist.length);
  }, [currentPlaylist]);

  const handlePrev = useCallback(() => {
    if (!currentPlaylist.length) return;
    setCurrentIndex((p) => (p - 1 + currentPlaylist.length) % currentPlaylist.length);
  }, [currentPlaylist]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setProgress(val);
    }
  };

  const formatTime = (sec = 0) => {
    if (!isFinite(sec) || sec <= 0) return "00:00";
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlayPause]);

  // ---------------- fetch metadata ----------------
  const fetchMetadata = useCallback(
    async (url: string) => {
      if (!url || allMetadata[url] || pendingRequests.current.has(url)) return;
      pendingRequests.current.add(url);

      if (!window.jsmediatags) {
        setAllMetadata((prev) => ({
          ...prev,
          [url]: { title: getFileName(url), artist: "Unknown Artist" },
        }));
        pendingRequests.current.delete(url);
        return;
      }

      try {
        const res = await fetch(`${proxy}?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`Proxy failed: ${res.status}`);
        const blob = await res.blob();

        window.jsmediatags.read(blob as any, {
          onSuccess: (tag: any) => {
            let picDataUrl: string | undefined;
            try {
              const picture = tag.tags.picture;
              if (picture?.data) {
                const u8 = new Uint8Array(picture.data);
                const CHUNK = 0x8000;
                let index = 0;
                let result = "";
                while (index < u8.length) {
                  const slice = u8.subarray(index, Math.min(index + CHUNK, u8.length));
                  result += String.fromCharCode.apply(null, Array.from(slice));
                  index += CHUNK;
                }
                picDataUrl = `data:${picture.format};base64,${btoa(result)}`;
              }
            } catch { }
            const title = tag.tags.title || getFileName(url);
            const artist = tag.tags.artist || "Unknown Artist";
            if (mounted.current) {
              setAllMetadata((prev) => ({ ...prev, [url]: { title, artist, picture: picDataUrl } }));
            }
            pendingRequests.current.delete(url);
          },
          onError: () => {
            if (mounted.current)
              setAllMetadata((prev) => ({ ...prev, [url]: { title: getFileName(url), artist: "Unknown Artist" } }));
            pendingRequests.current.delete(url);
          },
        });
      } catch {
        if (mounted.current)
          setAllMetadata((prev) => ({ ...prev, [url]: { title: getFileName(url), artist: "Unknown Artist" } }));
        pendingRequests.current.delete(url);
      }
    },
    [allMetadata, proxy]
  );

  useEffect(() => {
    currentPlaylist.forEach((url) => fetchMetadata(url));
  }, [currentPlaylist, fetchMetadata]);

  const handleAddTrack = () => {
    const url = newTrack.trim();
    if (!url || !isCustom) return;
    const updated = [...customPlaylist, url];
    setCustomPlaylist(updated);
    setCurrentPlaylist(updated);
    setNewTrack("");
    fetchMetadata(url);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tracks: updated, metadata: allMetadata }));
      } catch { }
      saveTimer.current = null;
    }, 0);
  };

  const handleRemoveTrack = (idx: number) => {
    if (!isCustom) return;
    const updated = customPlaylist.filter((_, i) => i !== idx);
    setCustomPlaylist(updated);
    setCurrentPlaylist(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tracks: updated, metadata: allMetadata }));
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tracks: customPlaylist, metadata: allMetadata }));
      } catch { }
      saveTimer.current = null;
    }, 0);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = null;
    };
  }, [customPlaylist, allMetadata, isCustom]);

  return (
    <div className="bg-gray-800 h-full flex flex-col w-full">
      <div className="relative w-full h-full overflow-hidden p-6 z-20 mb-20">
      {/* background blur */}
      <div
        className="absolute -inset-5 -z-10 h-90 brightness-50 blur-2xl bg-center bg-cover"
        style={{
          backgroundImage: allMetadata[currentTrack]?.picture
            ? `url(${allMetadata[currentTrack]?.picture})`
            : "none",
        }}
      />
        <div className="mb-5">
          {currentTrack ? (
            <div className="flex items-end gap-5">
              <img
                src={allMetadata[currentTrack]?.picture ?? "/default-cover.png"}
                alt="cover"
                className="w-35 h-35 rounded-lg object-cover"
              />
              <div>
                <p className="text-2xl font-bold">
                  {allMetadata[currentTrack]?.title ?? getFileName(currentTrack)}
                </p>
                <p className="text-gray-300">
                  {allMetadata[currentTrack]?.artist ?? "Unknown Artist"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">No track</div>
          )}
        </div>

        <div className="w-full space-y-3">
          <div className="w-full rounded-xl p-1 space-y-1">
            {currentPlaylist.map((track, idx) => (
              <TrackItem
                key={idx}
                title={allMetadata[track]?.title ?? getFileName(track)}
                artist={allMetadata[track]?.artist ?? "Unknown Artist"}
                picture={allMetadata[track]?.picture}
                isActive={idx === currentIndex}
                onClick={() => setCurrentIndex(idx)}
                isCustom={isCustom}
                onRemove={isCustom ? () => handleRemoveTrack(idx) : undefined}
                onCopy={() => handleCopy(track)}
              />
            ))}
          </div>

          {isCustom && (
            <div className="flex w-full gap-2 px-1">
              <input
                type="text"
                placeholder="Enter MP3 URL"
                value={newTrack}
                onChange={(e) => setNewTrack(e.target.value)}
                className="flex-1 p-2 bg-gray-700 rounded-lg text-sm placeholder-gray-400 focus:outline-none"
                />
              <button
                className="p-3 bg-blue-600 rounded-lg text-2xl hover:bg-blue-500 transition"
                onClick={handleAddTrack}
              >
                <Plus size={23} />
              </button>
            </div>
          )}
        </div>
      </div>
      <audio ref={audioRef} onEnded={handleNext} />
      <div className="sticky bottom-4 mx-4 z-20 rounded-2xl bg-gray-900 flex flex-wrap sm:flex-nowrap justify-between sm:justify-center items-center gap-4 sm:gap-6">
        <div className="flex items-center pl-2.5 py-2 gap-3 flex-1 min-w-0 sm:min-w-1/4 overflow-hidden hover:bg-gray-700 rounded-l-xl transition">
          <img
            src={allMetadata[currentTrack]?.picture ?? "/default-cover.png"}
            alt="cover"
            className="w-12 h-12 sm:w-15 sm:h-15 rounded-lg object-cover flex-shrink-0"
          />

          <div className="flex flex-col min-w-0">
            <p className="font-bold text-sm sm:text-base text-white truncate">
              {allMetadata[currentTrack]?.title ?? getFileName(currentTrack)}
            </p>
            <p className="text-xs sm:text-sm text-gray-300 truncate">
              {allMetadata[currentTrack]?.artist ?? "Unknown Artist"}
            </p>
          </div>
        </div>

        <div className="flex items-center pr-2.5 xl:pr-0 justify-center gap-2 flex-shrink-0">
          <button
            className="bg-gray-700 hover:bg-gray-600 transition rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center"
            onClick={handlePrev}
          >
            <SkipBack size={18} />
          </button>
          <button
            className="bg-green-500 hover:bg-green-400 transition rounded-full w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause /> : <Play />}
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-600 transition rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center"
            onClick={handleNext}
          >
            <SkipForward size={18} />
          </button>
        </div>
        <div className="w-full hidden sm:flex flex-col pr-5 xl:pr-0 items-center translate-y-2">
          <div className="relative w-full h-1.5 rounded-lg bg-gray-700">
            {/* بخش دانلود شده */}
            <div
              className="absolute top-0 left-0 h-full rounded-lg bg-gray-500"
              style={{ width: `${buffered}%` }}
              />
            {/* بخش پخش‌شده */}
            <div
              className="absolute top-0 left-0 h-full rounded-lg bg-green-500"
              style={{ width: `${(progress / duration) * 100}%` }}
              />
            {/* اسلایدر */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="slider absolute top-0 left-0 w-full h-full cursor-pointer"
            />
          </div>

          <div className="w-full flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="hidden xl:flex pr-2.5 items-center justify-center">
          <button
            className={`transition rounded-full w-10 h-10 flex items-center justify-center ${isLooped ? "bg-green-500 hover:bg-green-400" : "bg-gray-700 hover:bg-gray-600"}`}
            onClick={toggleLoop}
          >
            <Repeat size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
