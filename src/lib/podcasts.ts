import type { Podcast } from "./types";
import { fetchAllPodcasts as fetchFromFeishu } from "./feishu";

// Cache for podcast data to avoid repeated API calls within the same request
let podcastCache: Podcast[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache in production

async function getPodcasts(): Promise<Podcast[]> {
  const now = Date.now();

  // Use cached data if available and not expired
  if (podcastCache && now - cacheTime < CACHE_TTL_MS) {
    return podcastCache;
  }

  try {
    // Fetch fresh data from Feishu API
    podcastCache = await fetchFromFeishu();
    cacheTime = now;
    return podcastCache;
  } catch (error) {
    console.error("Failed to fetch from Feishu:", error);

    // If cache exists (even if expired), use it as fallback
    if (podcastCache) {
      return podcastCache;
    }

    throw error;
  }
}

export async function getAllPodcasts(): Promise<Podcast[]> {
  return getPodcasts();
}

export async function getPodcastById(
  id: string
): Promise<Podcast | undefined> {
  const podcasts = await getPodcasts();
  return podcasts.find((p) => p.id === id);
}

export async function getAdjacentPodcasts(
  id: string
): Promise<{ prev: Podcast | null; next: Podcast | null }> {
  const podcasts = await getPodcasts();
  const idx = podcasts.findIndex((p) => p.id === id);
  return {
    prev: idx > 0 ? podcasts[idx - 1] : null,
    next: idx < podcasts.length - 1 ? podcasts[idx + 1] : null,
  };
}
