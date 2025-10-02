"use client"

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

const STORAGE_KEY = "customPlaylist_v2";
const METADATA_SAVE_DEBOUNCE_MS = 800;

declare global {
  interface Window {
    jsmediatags?: {
      read: (file: Blob, opts: { onSuccess: (tag: any) => void; onError: (err: any) => void }) => void;
    };
  }
}

interface MusicPlayerProps {
  playlists: Playlist[];
}

export default function MusicPlayer({ playlists }: MusicPlayerProps) {
  const proxy = "/api/proxy";

  const [currentPlaylistName, setCurrentPlaylistName] = useState<string>(
    playlists[0]?.name ?? "Custom"
  );
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
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = currentTrack ?? "";
    audio.load();
    if (isPlaying && currentTrack) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else setIsPlaying(false);
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [currentTrack]);

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
    if (!audio.loop) {
      audio.loop = true;
      setIsLooped(true);
    } else {
      audio.loop = false;
      setIsLooped(false);
    }
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
          onError: (err: any) => {
            console.error("[metadata] error:", url, err);
            if (mounted.current) setAllMetadata((prev) => ({ ...prev, [url]: { title: getFileName(url), artist: "Unknown Artist" } }));
            pendingRequests.current.delete(url);
          },
        });
      } catch (e) {
        console.error("[metadata] exception:", url, e);
        if (mounted.current) setAllMetadata((prev) => ({ ...prev, [url]: { title: getFileName(url), artist: "Unknown Artist" } }));
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
    }, METADATA_SAVE_DEBOUNCE_MS);
  };

  const handleRemoveTrack = (idx: number) => {
    if (!isCustom) return;
    const updated = customPlaylist.filter((_, i) => i !== idx);
    setCustomPlaylist(updated);
    setCurrentPlaylist(updated);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ tracks: updated, metadata: allMetadata })
        );
      } catch {
        saveTimer.current = null;
      }
    }, METADATA_SAVE_DEBOUNCE_MS);
  };

  const handleCopy = async(text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  useEffect(() => {
    if (!isCustom) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tracks: customPlaylist, metadata: allMetadata }));
      } catch { }
      saveTimer.current = null;
    }, METADATA_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = null;
    };
  }, [customPlaylist, allMetadata, isCustom]);

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div className="relative bg-gray-800 pb-6 px-6 rounded-3xl overflow-hidden flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* background blur */}
      <div
        className="absolute -inset-5 z-10 brightness-50 blur bg-center bg-cover"
        style={{
          backgroundImage: allMetadata[currentTrack]?.picture
            ? `url(${allMetadata[currentTrack]?.picture})`
            : "none",
        }}
      />
      <div className="flex gap-2 w-full items-center justify-center p-4 text-sm font-semibold z-20">
        <span className="mr-2">Playlists:</span>
        <button
          className={`px-3 py-1 rounded-lg ${isCustom
            ? "bg-green-500"
            : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          onClick={() => setCurrentPlaylistName("Custom")}
        >
          Custom
        </button>
        {playlists.map((pl) => (
          <button
            key={pl.name}
            className={`px-3 py-1 rounded-lg ${pl.name === currentPlaylistName
              ? "bg-green-500"
              : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            onClick={() => setCurrentPlaylistName(pl.name)}
          >
            {pl.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center sm:items-start md:flex-row w-full gap-7 z-20">
        <div className="w-full md:w-2/3 space-y-5">
          {currentTrack ? (
            <div className="flex flex-col items-center space-y-2">
              <img
                src={allMetadata[currentTrack]?.picture ?? "/default-cover.png"}
                alt="cover"
                className="w-35 h-35 rounded-lg object-cover"
              />
              <p className="text-lg font-semibold text-center">
                {allMetadata[currentTrack]?.title ?? getFileName(currentTrack)}
              </p>
              <p className="text-sm text-gray-300">
                {allMetadata[currentTrack]?.artist ?? "Unknown Artist"}
              </p>
            </div>
          ) : (
            <div className="text-gray-400">No track</div>
          )}

          <audio ref={audioRef} onEnded={handleNext} />

          <div className="w-full flex flex-col items-center">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="slider w-full h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${pct}%, #374151 ${pct}%, #374151 100%)`,
              }}
            />
            <div className="w-full flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              className="bg-gray-700 hover:bg-gray-600 transition rounded-full w-12 h-12 flex items-center justify-center"
              onClick={handlePrev}
            >
              <SkipBack size={20} />
            </button>
            <button
              className="bg-green-500 hover:bg-green-400 transition rounded-full w-16 h-16 flex items-center justify-center"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-600 transition rounded-full w-12 h-12 flex items-center justify-center"
              onClick={handleNext}
            >
              <SkipForward size={20} />
            </button>
            <button
              className={`transition rounded-full w-12 h-12 flex items-center justify-center ${isLooped ? "bg-green-500 hover:bg-green-400" : "bg-gray-700 hover:bg-gray-600"}`}
              onClick={toggleLoop}
            >
              <Repeat size={20} />
            </button>
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="w-full rounded-xl p-1 space-y-1 max-h-80 overflow-y-auto">
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
    </div>
  );
}
