"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";

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
  const [newName, setNewName] = useState("")
  const allMetadata = useLocalStorage(STORAGE_KEY);
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>(playlists);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.playlists) setAllPlaylists([...playlists , ...parsed.playlists]);
    }
  }, []);

  const getFirstTrack = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.favoritePlaylist?.[0];
      }
    } catch (e) {
      console.warn("Failed to get first track:", e);
    }
    return null;
  };

  const firstTrack = getFirstTrack();

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


  return (
    <div className="hidden sm:block bg-gray-900 w-1/3 max-w-80 min-h-screen text-white p-4 border-r border-gray-700 overflow-y-auto">
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-lg font-semibold hover:text-green-400 transition"
        >
          <span>Playlists</span>
          <ChevronDown
            className={`transform transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="flex flex-col gap-2 animate-fadeIn">
            <button
              key="Favorite"
              onClick={() => onSelect("Favorite")}
              className={`flex items-center gap-3 w-full p-2 rounded-lg transition ${
                selected === "Favorite" ? "bg-green-700" : "hover:bg-gray-800"
              }`}
            >
              <img
                src={
                  (firstTrack && allMetadata?.[firstTrack]?.picture) ??
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
                className={`flex items-center gap-3 w-full p-2 rounded-lg transition ${
                  selected === pl.name ? "bg-green-700" : "hover:bg-gray-800"
                }`}
              >
                <img
                  src={
                    allMetadata?.[pl.tracks?.[0]]?.picture ?? "/default-cover.png"
                  }
                  alt={pl.name}
                  className="w-10 h-10 rounded-md object-cover"
                />
                <span className="truncate text-left">{pl.name}</span>
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
