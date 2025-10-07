"use client";

import { useState } from "react";
import { SideBar } from "./SideBar";
import MusicPlayer from "./MusicPlayer";

interface Playlist {
  name: string;
  tracks: string[];
}

export default function PlayerLayout({ playlists }: { playlists: Playlist[] }) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("Custom");

  return (
    <div className="flex w-full min-h-screen">
      <SideBar
        playlists={playlists}
        selected={selectedPlaylist}
        onSelect={setSelectedPlaylist}
      />
      <div className="flex-1">
        <MusicPlayer playlists={playlists} selectedPlaylist={selectedPlaylist} />
      </div>
    </div>
  );
}
