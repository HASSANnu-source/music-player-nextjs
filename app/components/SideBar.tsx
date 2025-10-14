"use client";
import { useEffect, useState } from "react";
import { ChevronDown, MoreVertical, Plus } from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const STORAGE_KEY = "Playlists";

interface Playlist {
  name: string;
  tracks: string[];
}

interface SideBarProps {
  playlists: Playlist[];
  selected: string;
  onSelect: (name: string) => void;
}

export const SideBar = ({ playlists, selected, onSelect }: SideBarProps) => {
  const [open, setOpen] = useState(true);
  const [newName, setNewName] = useState("");
  const [firstFavoriteTrack, setFirstTrack] = useState<string | null>(null);
  const [firstAllTrack, setFirstAllTrack] = useState<string | null>(null);
  const allMetadata = useLocalStorage(STORAGE_KEY);
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>(playlists);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.playlists) setAllPlaylists([...playlists, ...parsed.playlists]);
    }
  }, [allMetadata]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFirstTrack(parsed?.favoritePlaylist?.[0] ?? null);
        const firstKey = parsed?.metadata ? Object.keys(parsed.metadata)[0] : null;
        setFirstAllTrack(firstKey ?? null);
      }
    } catch (e) {
      console.warn("Failed to get first track:", e);
    }
  }, [allMetadata]);

  const handleAddPlaylist = () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};

      // حفظ سایر داده‌ها مثل favoritePlaylist و متادیتا
      const existingFavorites = parsed.favoritePlaylist ?? [];
      const existingMetadata = parsed.metadata ?? {};

      if (!parsed.playlists) parsed.playlists = [];

      parsed.playlists.push({ name, tracks: [] });

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          favoritePlaylist: existingFavorites,
          metadata: existingMetadata,
        })
      );
      setAllPlaylists((prev) => [...prev, { name, tracks: [] }]);
      setNewName("");
      onSelect(name);
    } catch (e) {
      console.error("Failed to add playlist:", e);
    }
  };

  const handleRemovePlaylist = (playlistName: string) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      parsed.playlists =
        parsed.playlists?.filter((p: Playlist) => p.name !== playlistName) ?? [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setAllPlaylists((prev) => prev.filter((p) => p.name !== playlistName));
      if (selected === playlistName) {
        setTimeout(() => {
          const firstPL = parsed.playlists?.[0]?.name ?? "Pop";
          onSelect(firstPL);
        }, 0);
      }
    } catch (e) {
      console.error("Failed to remove playlist:", e);
    }
  };

  return (
    <div className="bg-gray-900 w-full h-full text-white p-4">
      <div className="flex flex-col gap-4">
        <p className="text-xl font-bold pb-4 border-b-1">
          Music Player
        </p>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-lg font-semibold hover:text-green-400 transition"
        >
          <span>Playlists</span>
          <ChevronDown
            className={`transform transition-transform duration-300 ${open ? "rotate-180" : ""
              }`}
          />
        </button>

        {open && (
          <div className="flex flex-col gap-2">
            <button
              key="All"
              onClick={() => onSelect("All")}
              className={`flex items-center gap-3 w-full p-2 rounded-lg transition ${selected === "All" ? "bg-green-700" : "hover:bg-gray-800"
                }`}
            >
              <img
                src={
                  (firstAllTrack && allMetadata?.[firstAllTrack]?.picture) ??
                  "/default-cover.png"
                }
                alt="All"
                className="w-10 h-10 rounded-md object-cover"
              />
              <span className="truncate text-left">All</span>
            </button>
            <button
              key="Favorite"
              onClick={() => onSelect("Favorite")}
              className={`flex items-center gap-3 w-full p-2 rounded-lg transition ${selected === "Favorite" ? "bg-green-700" : "hover:bg-gray-800"
                }`}
            >
              <img
                src={
                  (firstFavoriteTrack && allMetadata?.[firstFavoriteTrack]?.picture) ??
                  "/default-cover.png"
                }
                alt="Favorite"
                className="w-10 h-10 rounded-md object-cover"
              />
              <span className="truncate text-left">Favorite</span>
            </button>

            {allPlaylists.map((pl) => (
              <button
                key={pl.name}
                onClick={() => onSelect(pl.name)}
                className={`flex items-center justify-between w-full p-2 rounded-lg transition ${selected === pl.name ? "bg-green-700" : "hover:bg-gray-800"
                  }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={allMetadata?.[pl.tracks?.[0]]?.picture ?? "/default-cover.png"}
                    alt={pl.name}
                    className="w-10 h-10 rounded-md object-cover"
                  />
                  <span className="truncate text-left">{pl.name}</span>
                </div>
                {!["Favorite", "Pop", "Peace"].includes(pl.name) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="text-gray-300">
                        <MoreVertical size={18} />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 bg-gray-800 border-0">
                      <DropdownMenuItem
                        className="text-red-400 focus:bg-gray-700 focus:text-red-200"
                        onClick={() => handleRemovePlaylist(pl.name)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </button>
            ))}
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                placeholder="New playlist name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 p-2 bg-gray-800 rounded-lg text-sm placeholder-gray-400 focus:outline-none"
              />
              <button
                className="p-2 bg-green-600 rounded-lg hover:bg-green-500 transition"
                onClick={handleAddPlaylist}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
