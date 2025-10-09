"use client";

import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { SideBar } from "./SideBar";
import MusicPlayer from "./MusicPlayer";

interface Playlist {
  name: string;
  tracks: string[];
}

export default function PlayerLayout({ playlists }: { playlists: Playlist[] }) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("Pop");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex w-full min-h-screen relative overflow-hidden">
      <button
        className="fixed top-3 right-4 p-3 bg-gray-800 z-40 rounded-2xl transition hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical />
      </button>

      <div
        className={`fixed right-0 top-0 h-full bg-gray-900 z-30 border-l border-gray-700 transform transition-all duration-500 ease-in-out
          ${isOpen ? "translate-x-0 opacity-100 w-2/3 sm:w-1/3" : "translate-x-full opacity-0 w-2/3 sm:w-1/3"}
        `}
      >
        <SideBar
          playlists={playlists}
          selected={selectedPlaylist}
          onSelect={(name) => {
            setSelectedPlaylist(name);
            setIsOpen(false);
          }}
        />
      </div>

      <div className="flex-1 transition-all duration-500 ease-in-out">
        <MusicPlayer playlists={playlists} selectedPlaylist={selectedPlaylist} />
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
