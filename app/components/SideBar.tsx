"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const allMetadata = useLocalStorage(STORAGE_KEY);

  const getFirstTrack = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.tracks?.[0];
      }
    } catch (e) {
      console.warn("Failed to get first track:", e);
    }
    return null;
  };

  const firstTrack = getFirstTrack();

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
              key="Custom"
              onClick={() => onSelect("Custom")}
              className={`flex items-center gap-3 w-full p-2 rounded-lg transition ${
                selected === "Custom" ? "bg-green-700" : "hover:bg-gray-800"
              }`}
            >
              <img
                src={
                  (firstTrack && allMetadata?.[firstTrack]?.picture) ??
                  "/default-cover.png"
                }
                alt="Custom"
                className="w-10 h-10 rounded-md object-cover"
              />
              <span className="truncate text-left">Custom</span>
            </button>

            {playlists.map((pl) => (
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
          </div>
        )}
      </div>
    </div>
  );
};
