import type { Podcast } from "./types";
import staticData from "../podcasts.json";

const podcasts: Podcast[] = staticData as Podcast[];

export async function getAllPodcasts(): Promise<Podcast[]> {
  return podcasts;
}

export async function getPodcastById(
  id: string
): Promise<Podcast | undefined> {
  return podcasts.find((p) => p.id === id);
}

export async function getAdjacentPodcasts(
  id: string
): Promise<{ prev: Podcast | null; next: Podcast | null }> {
  const idx = podcasts.findIndex((p) => p.id === id);
  return {
    prev: idx > 0 ? podcasts[idx - 1] : null,
    next: idx < podcasts.length - 1 ? podcasts[idx + 1] : null,
  };
}
