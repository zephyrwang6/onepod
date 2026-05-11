#!/usr/bin/env node
/**
 * Pre-build script: fetch podcast data from Feishu wiki and write to src/podcasts.json.
 * Run before `next build` to ensure fresh data.
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load .env.local if it exists (for local development)
const envLocalPath = resolve(ROOT, ".env.local");
if (existsSync(envLocalPath)) {
  const envContent = readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const BASE_URL = "https://open.feishu.cn/open-apis";
const PARENT_NODE = "TOSJwKzxTiFdiRk0aducHNBFntg";
const SPACE_ID = "7591325128043121630";

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_MAX_RETRIES = 4;

if (!APP_ID || !APP_SECRET) {
  console.error(
    "Error: FEISHU_APP_ID and FEISHU_APP_SECRET environment variables must be set"
  );
  process.exit(1);
}

async function getTenantToken() {
  const resp = await fetch(
    `${BASE_URL}/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    }
  );
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

async function getChildNodes(token) {
  const nodes = [];
  let pageToken = "";

  while (true) {
    const params = new URLSearchParams({
      parent_node_token: PARENT_NODE,
      page_size: "50",
    });
    if (pageToken) params.set("page_token", pageToken);

    const url = `${BASE_URL}/wiki/v2/spaces/${SPACE_ID}/nodes?${params}`;
    const result = await fetchFeishuJson(url, {
      headers: { Authorization: `Bearer ${token}` },
    }, "Fetch child nodes");

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
    let url = `${BASE_URL}/docx/v1/documents/${objToken}/blocks?page_size=100`;
    if (pageToken) url += `&page_token=${pageToken}`;

    const result = await fetchFeishuJson(
      url,
      { headers },
      `Fetch blocks for ${objToken}`
    );

    allBlocks.push(...(result.data?.items || []));
    if (!result.data?.has_more) break;
    pageToken = result.data?.page_token || "";
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
    for (const pat of patterns) {
      const m = candidate.match(pat);
      if (m) return m[1];
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
    const bt = block.block_type;
    let text = "";

    if (bt === 2) {
      text = extractText(block.text?.elements);
    } else if (bt === 3) {
      text = extractText(block.heading1?.elements);
      if (currentSection.paragraphs.length > 0) sections.push(currentSection);
      currentSection = { title: text, paragraphs: [] };
      continue;
    } else if (bt === 4) {
      text = extractText(block.heading2?.elements);
      if (currentSection.paragraphs.length > 0) sections.push(currentSection);
      currentSection = { title: text, paragraphs: [] };
      continue;
    } else if (bt === 5) {
      text = extractText(block.heading3?.elements);
    } else if (bt === 12) {
      text = "• " + extractText(block.bullet?.elements);
    } else if (bt === 13) {
      text = extractText(block.ordered?.elements);
    } else if (bt === 1) {
      continue;
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
    console.error(`  oEmbed timeout/failed for ${videoId}`);
  }

  if (process.env.FEISHU_FETCH_YOUTUBE_META !== "1") {
    return meta;
  }

  try {
    const resp = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(1500),
      }
    );
    const html = await resp.text();
    const viewMatch = html.match(/"viewCount":"(\d+)"/);
    if (viewMatch) meta.ytViews = parseInt(viewMatch[1], 10);
    const dateMatch = html.match(/"publishDate":"([^"]+)"/);
    if (dateMatch) meta.ytPublished = dateMatch[1].slice(0, 10);
  } catch {
    console.error(`  Page scrape timeout/failed for ${videoId}`);
  }

  return meta;
}

function parseTitle(rawTitle) {
  let m = rawTitle.match(/^(\d{4})[：:\s-]+(.+)$/);
  if (m) return { dateCode: m[1], title: m[2] };
  m = rawTitle.match(/^(\d{4})\s+(.+)$/);
  if (m) return { dateCode: m[1], title: m[2] };
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

async function buildPodcastFromNode(token, child, index, total) {
  console.log(`[prebuild]   [${index + 1}/${total}] ${child.title}`);

  const blocks = await getDocBlocks(token, child.obj_token);
  const { fullText, youtubeId, sections } = blocksToContent(blocks);
  const { dateCode, title: cleanTitle } = parseTitle(child.title);

  let introParagraphs = [];
  let highlights = [];

  for (const sec of sections) {
    if (sec.title.includes("精华") || !sec.title) {
      if (introParagraphs.length === 0 && !sec.title) {
        introParagraphs = sec.paragraphs;
      } else if (sec.title.includes("精华")) {
        highlights = sec.paragraphs;
      }
    } else if (introParagraphs.length === 0) {
      introParagraphs = sec.paragraphs;
    }
  }

  if (introParagraphs.length === 0 && sections.length > 0) {
    introParagraphs = sections[0].paragraphs;
  }
  if (highlights.length === 0 && sections.length > 1) {
    highlights = sections[sections.length - 1].paragraphs;
  }

  const ytMeta = await fetchYoutubeMeta(youtubeId);

  return {
    id: child.node_token,
    title: cleanTitle,
    rawTitle: child.title,
    dateCode,
    createdAt: getNodeCreatedAt(child),
    youtubeId,
    feishuUrl: `https://my.feishu.cn/wiki/${child.node_token}`,
    intro: introParagraphs.slice(0, 15),
    highlights: highlights.slice(0, 20),
    fullText,
    ...ytMeta,
  };
}

async function main() {
  console.log("[prebuild] Fetching Feishu token...");
  const token = await getTenantToken();

  console.log("[prebuild] Fetching podcast list...");
  const children = await getChildNodes(token);
  children.sort((a, b) => getNodeCreatedAt(b) - getNodeCreatedAt(a));
  console.log(`[prebuild] Found ${children.length} documents`);

  const podcasts = await mapWithConcurrency(children, 3, (child, index) =>
    buildPodcastFromNode(token, child, index, children.length)
  );

  const outPath = resolve(__dirname, "..", "src", "podcasts.json");
  writeFileSync(outPath, JSON.stringify(podcasts, null, 2), "utf-8");
  console.log(
    `[prebuild] Done! Written ${podcasts.length} podcasts to ${outPath}`
  );
}

main().catch((err) => {
  console.error("[prebuild] Fatal error:", err);
  process.exit(1);
});
