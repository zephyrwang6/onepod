import podcastData from "../podcasts.json";
import type { Podcast } from "./types";

const podcasts: Podcast[] = podcastData as Podcast[];

export function getAllPodcasts(): Podcast[] {
  return podcasts;
}

export function getPodcastById(id: string): Podcast | undefined {
  return podcasts.find((p) => p.id === id);
}

export function getPodcastByIndex(index: number): Podcast | undefined {
  return podcasts[index];
}

export function getAdjacentPodcasts(id: string): {
  prev: Podcast | null;
  next: Podcast | null;
} {
  const idx = podcasts.findIndex((p) => p.id === id);
  return {
    prev: idx > 0 ? podcasts[idx - 1] : null,
    next: idx < podcasts.length - 1 ? podcasts[idx + 1] : null,
  };
}
