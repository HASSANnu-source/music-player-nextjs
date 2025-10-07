import { playlists } from "./components/Playlists";
import PlayerLayout from "./components/PlayerLayout";

export default function HomePage() {
  return (
    <PlayerLayout playlists={playlists} />
  );
}
