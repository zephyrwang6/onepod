import { unstable_cache } from "next/cache";
import { fetchAllPodcasts } from "./feishu";
import type { Podcast } from "./types";

/**
 * Cached podcast data fetcher.
 * Uses Next.js ISR: serves cached data and revalidates in the background
 * every 5 minutes (300 seconds).
 */
const getCachedPodcasts = unstable_cache(
  async (): Promise<Podcast[]> => {
    try {
      return await fetchAllPodcasts();
    } catch (error) {
      console.error("[podcasts] Failed to fetch from Feishu API:", error);
      // Fallback to static data if API fails during initial build
      try {
        const staticData = await import("../podcasts.json");
        console.warn("[podcasts] Using static fallback data");
        return staticData.default as Podcast[];
      } catch {
        console.error("[podcasts] No fallback data available");
        return [];
      }
    }
  },
  ["all-podcasts"],
  { revalidate: 300 } // 5 minutes
);

export async function getAllPodcasts(): Promise<Podcast[]> {
  return getCachedPodcasts();
}

export async function getPodcastById(
  id: string
): Promise<Podcast | undefined> {
  const podcasts = await getCachedPodcasts();
  return podcasts.find((p) => p.id === id);
}

export async function getAdjacentPodcasts(
  id: string
): Promise<{ prev: Podcast | null; next: Podcast | null }> {
  const podcasts = await getCachedPodcasts();
  const idx = podcasts.findIndex((p) => p.id === id);
  return {
    prev: idx > 0 ? podcasts[idx - 1] : null,
    next: idx < podcasts.length - 1 ? podcasts[idx + 1] : null,
  };
}
