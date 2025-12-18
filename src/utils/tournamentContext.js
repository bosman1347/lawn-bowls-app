import { getActiveTournament, setActiveTournament } from "./storage";

export function resolveTournament(searchParams) {
  const fromUrl = searchParams.get("t");

  if (fromUrl) {
    // URL is always the authority (QR / phone)
    setActiveTournament(fromUrl);
    return fromUrl;
  }

  // Fallback to stored admin selection
  return getActiveTournament();
}
