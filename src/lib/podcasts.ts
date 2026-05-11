import type { Podcast } from "./types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { fetchAllPodcasts as fetchFromFeishu } from "./feishu";
import staticPodcasts from "../podcasts.json";

let podcastCache: Podcast[] | null = null;
let podcastCachePromise: Promise<Podcast[]> | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;
const DEFAULT_KV_CACHE_KEY = "podcasts";
const localPodcasts = staticPodcasts as Podcast[];

interface PodcastKvNamespace {
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
}

interface OnepodCloudflareEnv {
  ONEPOD_CACHE?: PodcastKvNamespace;
  ONEPOD_CACHE_KEY?: string;
}

function hasFeishuCredentials(): boolean {
  return Boolean(process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET);
}

function shouldFetchFromFeishuAtRuntime(): boolean {
  return process.env.FEISHU_RUNTIME_FETCH === "1" && hasFeishuCredentials();
}

async function getPodcastsFromKv(): Promise<Podcast[] | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const onepodEnv = env as unknown as OnepodCloudflareEnv;
    const kv = onepodEnv.ONEPOD_CACHE;
    if (!kv) return null;

    const cacheKey = onepodEnv.ONEPOD_CACHE_KEY || DEFAULT_KV_CACHE_KEY;
    const podcasts = await kv.get<Podcast[]>(cacheKey, "json");
    if (!Array.isArray(podcasts) || podcasts.length === 0) {
      return null;
    }

    return podcasts;
  } catch {
    return null;
  }
}

async function getPodcasts(): Promise<Podcast[]> {
  const now = Date.now();

  if (podcastCache && now - cacheTime < CACHE_TTL_MS) {
    return podcastCache;
  }

  if (!shouldFetchFromFeishuAtRuntime()) {
    podcastCache = (await getPodcastsFromKv()) || localPodcasts;
    cacheTime = now;
    return podcastCache;
  }

  if (podcastCachePromise) {
    return podcastCachePromise;
  }

  try {
    podcastCachePromise = fetchFromFeishu();
    podcastCache = await podcastCachePromise;
    cacheTime = Date.now();
    return podcastCache;
  } catch (error) {
    console.error("Failed to fetch from Feishu:", error);
    if (podcastCache) {
      return podcastCache;
    }
    podcastCache = localPodcasts;
    cacheTime = Date.now();
    return podcastCache;
  } finally {
    podcastCachePromise = null;
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
