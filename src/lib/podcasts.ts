import type { Podcast } from "./types";
import { fetchAllPodcasts as fetchFromFeishu } from "./feishu";

let podcastCache: Podcast[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getPodcasts(): Promise<Podcast[]> {
  const now = Date.now();

  if (podcastCache && now - cacheTime < CACHE_TTL_MS) {
    return podcastCache;
  }

  try {
    podcastCache = await fetchFromFeishu();
    cacheTime = now;
    return podcastCache;
  } catch (error) {
    console.error("Failed to fetch from Feishu:", error);
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
