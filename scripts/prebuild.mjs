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

async function getChildNodes(token) {
  const url = `${BASE_URL}/wiki/v2/spaces/${SPACE_ID}/nodes?parent_node_token=${PARENT_NODE}&page_size=50`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await resp.json();
  return result.code === 0 ? result.data.items : [];
}

async function getDocBlocks(token, objToken) {
  const headers = { Authorization: `Bearer ${token}` };
  const allBlocks = [];
  let pageToken = "";

  while (true) {
    let url = `${BASE_URL}/docx/v1/documents/${objToken}/blocks?page_size=100`;
    if (pageToken) url += `&page_token=${pageToken}`;

    const resp = await fetch(url, { headers });
    const result = await resp.json();
    if (result.code !== 0) break;

    allBlocks.push(...(result.data?.items || []));
    if (!result.data?.has_more) break;
    pageToken = result.data?.page_token || "";
  }

  return allBlocks;
}

function extractText(elements) {
  return (elements || [])
    .map((el) => el.text_run?.content || "")
    .filter(Boolean)
    .join("");
}

function extractYoutubeId(text) {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1];
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
      { signal: AbortSignal.timeout(8000) }
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

  try {
    const resp = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
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

async function main() {
  console.log("[prebuild] Fetching Feishu token...");
  const token = await getTenantToken();

  console.log("[prebuild] Fetching podcast list...");
  const children = await getChildNodes(token);
  console.log(`[prebuild] Found ${children.length} documents`);

  const podcasts = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    console.log(`[prebuild]   [${i + 1}/${children.length}] ${child.title}`);

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

    podcasts.push({
      id: child.node_token,
      title: cleanTitle,
      rawTitle: child.title,
      dateCode,
      youtubeId,
      feishuUrl: `https://my.feishu.cn/wiki/${child.node_token}`,
      intro: introParagraphs.slice(0, 15),
      highlights: highlights.slice(0, 20),
      fullText: fullText.slice(0, 5000),
      ...ytMeta,
    });
  }

  podcasts.sort((a, b) => b.dateCode.localeCompare(a.dateCode));

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
