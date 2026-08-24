const BASE_URL = "https://open.feishu.cn/open-apis";
const PARENT_NODE = "TOSJwKzxTiFdiRk0aducHNBFntg";
const SPACE_ID = "7591325128043121630";
const DEFAULT_CACHE_KEY = "podcasts";
const META_KEY = "podcasts:meta";
const DEFAULT_BATCH_SIZE = 18;
const FEISHU_MAX_RETRIES = 4;

async function getTenantToken(env) {
  if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET) {
    throw new Error("FEISHU_APP_ID and FEISHU_APP_SECRET must be set");
  }

  const resp = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET,
    }),
  });
  const data = await resp.json();
  if (!data.tenant_access_token) {
    throw new Error(`Failed to get Feishu token: ${JSON.stringify(data)}`);
  }
  return data.tenant_access_token;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFeishuJson(url, options, label) {
  let lastError;

  for (let attempt = 1; attempt <= FEISHU_MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, options);
      const result = await resp.json();
      if (resp.ok && result.code === 0) {
        return result;
      }

      lastError = new Error(
        `${label} failed: HTTP ${resp.status}, ${JSON.stringify(result)}`
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < FEISHU_MAX_RETRIES) {
      await sleep(400 * attempt ** 2);
    }
  }

  throw lastError;
}

async function getChildNodes(token, parentNode = PARENT_NODE) {
  const nodes = [];
  let pageToken = "";

  while (true) {
    const params = new URLSearchParams({
      parent_node_token: parentNode,
      page_size: "50",
    });
    if (pageToken) params.set("page_token", pageToken);

    const result = await fetchFeishuJson(
      `${BASE_URL}/wiki/v2/spaces/${SPACE_ID}/nodes?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
      "Fetch child nodes"
    );

    nodes.push(...(result.data?.items || []));
    if (!result.data?.has_more) break;

    pageToken = result.data?.page_token || "";
    if (!pageToken) break;
  }

  return nodes;
}

async function getDocBlocks(token, objToken) {
  const headers = { Authorization: `Bearer ${token}` };
  const allBlocks = [];
  let pageToken = "";

  while (true) {
    const params = new URLSearchParams({ page_size: "100" });
    if (pageToken) params.set("page_token", pageToken);

    const result = await fetchFeishuJson(
      `${BASE_URL}/docx/v1/documents/${objToken}/blocks?${params}`,
      { headers },
      `Fetch blocks for ${objToken}`
    );

    allBlocks.push(...(result.data?.items || []));
    if (!result.data?.has_more) break;
    pageToken = result.data?.page_token || "";
    if (!pageToken) break;
  }

  return allBlocks;
}

function extractText(elements) {
  return (elements || [])
    .map((el) => {
      const content = el.text_run?.content || "";
      const link =
        el.text_run?.text_element_style?.link?.url ||
        el.link?.url ||
        el.url ||
        "";
      if (link && !content.includes(link)) {
        return `${content}${content ? "\n" : ""}${link}`;
      }
      return content;
    })
    .filter(Boolean)
    .join("");
}

function extractYoutubeId(text) {
  const compactText = text.replace(/\s+/g, "");
  const patterns = [
    /(?:youtube\.com\/watch\?[^#\n\r]*?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const candidate of [text, compactText]) {
    for (const pattern of patterns) {
      const match = candidate.match(pattern);
      if (match) return match[1];
    }
  }
  return null;
}

function blocksToContent(blocks) {
  let fullText = "";
  let youtubeId = null;
  const sections = [];
  let currentSection = { title: "", paragraphs: [] };

  for (const block of blocks) {
    const blockType = block.block_type;
    let text = "";

    if (blockType === 2) {
      text = extractText(block.text?.elements);
    } else if (blockType === 3) {
      text = extractText(block.heading1?.elements);
      if (currentSection.paragraphs.length > 0) sections.push(currentSection);
      currentSection = { title: text, paragraphs: [] };
      continue;
    } else if (blockType === 4) {
      text = extractText(block.heading2?.elements);
      if (currentSection.paragraphs.length > 0) sections.push(currentSection);
      currentSection = { title: text, paragraphs: [] };
      continue;
    } else if (blockType === 5) {
      text = extractText(block.heading3?.elements);
    } else if (blockType === 12) {
      text = "• " + extractText(block.bullet?.elements);
    } else if (blockType === 13) {
      text = extractText(block.ordered?.elements);
    } else {
      continue;
    }

    if (text.trim() === "---") {
      if (currentSection.paragraphs.length > 0) sections.push(currentSection);
      currentSection = { title: "", paragraphs: [] };
      continue;
    }

    if (text.trim()) {
      fullText += text + "\n";
      currentSection.paragraphs.push(text);
      if (!youtubeId) youtubeId = extractYoutubeId(text);
    }
  }

  if (currentSection.paragraphs.length > 0) sections.push(currentSection);
  return { fullText, youtubeId, sections };
}

async function fetchYoutubeMeta(videoId) {
  const meta = {
    ytTitle: null,
    ytChannel: null,
    ytChannelUrl: null,
    ytViews: null,
    ytPublished: null,
  };
  if (!videoId) return meta;

  try {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(1500) }
    );
    if (resp.ok) {
      const data = await resp.json();
      meta.ytTitle = data.title || null;
      meta.ytChannel = data.author_name || null;
      meta.ytChannelUrl = data.author_url || null;
    }
  } catch {
    // YouTube metadata is nice-to-have; Feishu content is the source of truth.
  }

  return meta;
}

function parseTitle(rawTitle) {
  let match = rawTitle.match(/^(\d{4})[：:\s-]+(.+)$/);
  if (match) return { dateCode: match[1], title: match[2] };

  match = rawTitle.match(/^(\d{4})\s+(.+)$/);
  if (match) return { dateCode: match[1], title: match[2] };

  return { dateCode: "", title: rawTitle };
}

function getNodeCreatedAt(node) {
  return Number(node.node_create_time || node.obj_create_time || 0);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
}

async function buildPodcastFromNode(token, child, existingPodcast) {
  const blocks = await getDocBlocks(token, child.obj_token);
  const { fullText, youtubeId, sections } = blocksToContent(blocks);
  const { dateCode, title } = parseTitle(child.title);

  let intro = [];
  let highlights = [];

  for (const section of sections) {
    if (section.title.includes("精华") || !section.title) {
      if (intro.length === 0 && !section.title) {
        intro = section.paragraphs;
      } else if (section.title.includes("精华")) {
        highlights = section.paragraphs;
      }
    } else if (intro.length === 0) {
      intro = section.paragraphs;
    }
  }

  if (intro.length === 0 && sections.length > 0) intro = sections[0].paragraphs;
  if (highlights.length === 0 && sections.length > 1) {
    highlights = sections[sections.length - 1].paragraphs;
  }

  let youtubeMeta;
  if (
    existingPodcast?.youtubeId === youtubeId &&
    (existingPodcast.ytTitle || existingPodcast.ytChannel)
  ) {
    youtubeMeta = {
      ytTitle: existingPodcast.ytTitle,
      ytChannel: existingPodcast.ytChannel,
      ytChannelUrl: existingPodcast.ytChannelUrl,
      ytViews: existingPodcast.ytViews,
      ytPublished: existingPodcast.ytPublished,
    };
  } else {
    youtubeMeta = await fetchYoutubeMeta(youtubeId);
  }

  return {
    id: child.node_token,
    title,
    rawTitle: child.title,
    dateCode,
    createdAt: getNodeCreatedAt(child),
    youtubeId,
    feishuUrl: `https://my.feishu.cn/wiki/${child.node_token}`,
    intro: intro.slice(0, 15),
    highlights: highlights.slice(0, 20),
    fullText,
    ...youtubeMeta,
  };
}

async function fetchPodcastNodes(env) {
  const token = await getTenantToken(env);
  const children = await getChildNodes(token);
  children.sort((a, b) => getNodeCreatedAt(b) - getNodeCreatedAt(a));
  return { token, children };
}

function getBatchChildren(children, existingById, previousMeta, batchSize) {
  const selected = [];
  const selectedIds = new Set();
  const missing = children.filter((child) => !existingById.has(child.node_token));

  for (const child of missing) {
    if (selected.length >= batchSize) break;
    selected.push(child);
    selectedIds.add(child.node_token);
  }

  const cursor = Number(previousMeta?.nextCursor || 0);
  for (let offset = 0; offset < children.length && selected.length < batchSize; offset++) {
    const child = children[(cursor + offset) % children.length];
    if (selectedIds.has(child.node_token)) continue;
    selected.push(child);
    selectedIds.add(child.node_token);
  }

  const nextCursor = children.length
    ? (cursor + Math.max(1, batchSize)) % children.length
    : 0;

  return { selected, missingCount: missing.length, nextCursor };
}

async function syncPodcasts(env) {
  if (!env.ONEPOD_CACHE) {
    throw new Error("ONEPOD_CACHE KV binding is missing");
  }

  const startedAt = Date.now();
  const cacheKey = env.ONEPOD_CACHE_KEY || DEFAULT_CACHE_KEY;
  const batchSize = Number(env.SYNC_BATCH_SIZE || DEFAULT_BATCH_SIZE);
  const [previousPodcasts, previousMeta] = await Promise.all([
    env.ONEPOD_CACHE.get(cacheKey, "json"),
    env.ONEPOD_CACHE.get(META_KEY, "json"),
  ]);
  const existingPodcasts = Array.isArray(previousPodcasts)
    ? previousPodcasts
    : [];
  const existingById = new Map(
    existingPodcasts.map((podcast) => [podcast.id, podcast])
  );
  const { token, children } = await fetchPodcastNodes(env);
  const { selected, missingCount, nextCursor } = getBatchChildren(
    children,
    existingById,
    previousMeta,
    batchSize
  );

  const refreshedPodcasts = await mapWithConcurrency(selected, 3, (child) =>
    buildPodcastFromNode(token, child, existingById.get(child.node_token))
  );

  for (const podcast of refreshedPodcasts) {
    existingById.set(podcast.id, podcast);
  }

  const podcasts = children
    .map((child) => existingById.get(child.node_token))
    .filter(Boolean);
  const meta = {
    ok: true,
    source: "feishu-batch",
    count: podcasts.length,
    totalNodes: children.length,
    processed: refreshedPodcasts.length,
    missingBeforeSync: missingCount,
    nextCursor,
    hasFullCoverage: podcasts.length === children.length,
    syncedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  };

  await env.ONEPOD_CACHE.put(cacheKey, JSON.stringify(podcasts));
  await env.ONEPOD_CACHE.put(META_KEY, JSON.stringify(meta));
  return meta;
}

async function syncPodcastsOnly(env) {
  const token = await getTenantToken(env);
  return syncPodcastsWithToken(env, token);
}

async function syncPodcastsWithToken(env, token) {
  if (!env.ONEPOD_CACHE) {
    throw new Error("ONEPOD_CACHE KV binding is missing");
  }

  const startedAt = Date.now();
  const cacheKey = env.ONEPOD_CACHE_KEY || DEFAULT_CACHE_KEY;
  const batchSize = Number(env.SYNC_BATCH_SIZE || DEFAULT_BATCH_SIZE);
  const [previousPodcasts, previousMeta] = await Promise.all([
    env.ONEPOD_CACHE.get(cacheKey, "json"),
    env.ONEPOD_CACHE.get(META_KEY, "json"),
  ]);
  const existingPodcasts = Array.isArray(previousPodcasts)
    ? previousPodcasts
    : [];
  const existingById = new Map(
    existingPodcasts.map((podcast) => [podcast.id, podcast])
  );
  const children = await getChildNodes(token);
  children.sort((a, b) => getNodeCreatedAt(b) - getNodeCreatedAt(a));
  const { selected, missingCount, nextCursor } = getBatchChildren(
    children,
    existingById,
    previousMeta,
    batchSize
  );

  const refreshedPodcasts = await mapWithConcurrency(selected, 3, (child) =>
    buildPodcastFromNode(token, child, existingById.get(child.node_token))
  );

  for (const podcast of refreshedPodcasts) {
    existingById.set(podcast.id, podcast);
  }

  const podcasts = children
    .map((child) => existingById.get(child.node_token))
    .filter(Boolean);
  const meta = {
    ok: true,
    source: "feishu-batch",
    count: podcasts.length,
    totalNodes: children.length,
    processed: refreshedPodcasts.length,
    missingBeforeSync: missingCount,
    nextCursor,
    hasFullCoverage: podcasts.length === children.length,
    syncedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  };

  await env.ONEPOD_CACHE.put(cacheKey, JSON.stringify(podcasts));
  await env.ONEPOD_CACHE.put(META_KEY, JSON.stringify(meta));
  return meta;
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/sync" && request.method === "POST") {
      const expected = env.SYNC_TOKEN;
      const actual = request.headers.get("authorization");
      if (!expected || actual !== `Bearer ${expected}`) {
        return json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }

      try {
        return json(await syncPodcastsOnly(env));
      } catch (error) {
        return json(
          { ok: false, error: error instanceof Error ? error.message : error },
          { status: 500 }
        );
      }
    }

    const meta = await env.ONEPOD_CACHE?.get(META_KEY, "json");
    return json({
      ok: true,
      worker: "onepod-feishu-sync",
      meta: meta || null,
    });
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(syncPodcastsOnly(env));
  },
};

export default worker;
