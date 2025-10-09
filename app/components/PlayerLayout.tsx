"use client";

import { MoreVertical, X } from "lucide-react";
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
    <div className="flex w-full min-h-screen">
      {/* دکمه باز/بستن فقط در موبایل */}
      <button
        className="fixed top-3 right-4 p-3 z-40 rounded-2xl transition hover:bg-gray-700 sm:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="relative w-6 h-6">
  <MoreVertical
    className={`absolute transition-all duration-300 transform ${
      isOpen ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100 rotate-0"
    }`}
  />
  <X
    className={`absolute transition-all duration-300 transform ${
      isOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-90"
    }`}
  />
</div>

      </button>

      {/* سایدبار دسکتاپ */}
      <div className="hidden border-r border-gray-700 sm:block sm:w-1/3 sm:max-w-80 ">
        <SideBar
          playlists={playlists}
          selected={selectedPlaylist}
          onSelect={setSelectedPlaylist}
        />
      </div>

      {/* سایدبار موبایل با انیمیشن نرم */}
      <div
        className={`fixed right-0 top-0 pt-2 w-3/4 h-full bg-gray-900 z-30 border-l border-gray-700 transform transition-all duration-500 ease-in-out sm:hidden
          ${isOpen ? "translate-x-0 opacity-100 w-2/3" : "translate-x-full opacity-0 w-2/3"}
        `}
      >
        <SideBar
          playlists={playlists}
          selected={selectedPlaylist}
          onSelect={(name) => {
            setSelectedPlaylist(name);
            setIsOpen(false); // بسته شدن خودکار بعد از انتخاب
          }}
        />
      </div>

      {/* محتوای اصلی */}
      <div className="flex-1">
        <MusicPlayer playlists={playlists} selectedPlaylist={selectedPlaylist} />
      </div>

      {/* پس‌زمینه تار فقط در موبایل وقتی بازه */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 backdrop-blur-sm sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
