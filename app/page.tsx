import { playlists } from "./components/Playlists";
import PlayerLayout from "./components/PlayerLayout";

export default function HomePage() {
  return (
    <main className="min-h-screen flex">
      <PlayerLayout playlists={playlists} />
    </main>
  );
}
