"use client";

import MusicPlayer from "@/app/components/MusicPlayer";
import { playlists } from "./components/Playlists";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <MusicPlayer playlists={playlists} />
    </main>
  );
}
