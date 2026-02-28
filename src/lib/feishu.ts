/**
 * Feishu (飞书) API client for fetching wiki document content.
 * TypeScript port of build.py - runs at request time with ISR caching.
 */

import type { Podcast } from "./types";

const BASE_URL = "https://open.feishu.cn/open-apis";
const PARENT_NODE = "TOSJwKzxTiFdiRk0aducHNBFntg";
const SPACE_ID = "7591325128043121630";

interface FeishuBlock {
  block_type: number;
  text?: { elements: FeishuElement[] };
  heading1?: { elements: FeishuElement[] };
  heading2?: { elements: FeishuElement[] };
  heading3?: { elements: FeishuElement[] };
  bullet?: { elements: FeishuElement[] };
  ordered?: { elements: FeishuElement[] };
}

interface FeishuElement {
  text_run?: { content: string };
}

interface FeishuNode {
  title: string;
  obj_token: string;
  node_token: string;
}

interface Section {
  title: string;
  paragraphs: string[];
}

interface YoutubeMeta {
  ytTitle: string | null;
  ytChannel: string | null;
  ytChannelUrl: string | null;
  ytViews: number | null;
  ytPublished: string | null;
}

async function getTenantToken(): Promise<string> {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("FEISHU_APP_ID and FEISHU_APP_SECRET must be set");
  }

  const resp = await fetch(
    `${BASE_URL}/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
      cache: "no-store",
    }
  );

  const data = await resp.json();
  if (!data.tenant_access_token) {
    throw new Error(`Failed to get Feishu token: ${JSON.stringify(data)}`);
  }
  return data.tenant_access_token;
}

async function getChildNodes(token: string): Promise<FeishuNode[]> {
  const url = `${BASE_URL}/wiki/v2/spaces/${SPACE_ID}/nodes?parent_node_token=${PARENT_NODE}&page_size=50`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const result = await resp.json();
  if (result.code === 0) {
    return result.data.items;
  }
  console.error("Failed to fetch child nodes:", result);
  return [];
}

async function getDocBlocks(
  token: string,
  objToken: string
): Promise<FeishuBlock[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const allBlocks: FeishuBlock[] = [];
  let pageToken = "";

  while (true) {
    let url = `${BASE_URL}/docx/v1/documents/${objToken}/blocks?page_size=100`;
    if (pageToken) {
      url += `&page_token=${pageToken}`;
    }

    const resp = await fetch(url, { headers, cache: "no-store" });
    const result = await resp.json();

    if (result.code !== 0) break;

    const items = result.data?.items || [];
    allBlocks.push(...items);

    if (!result.data?.has_more) break;
    pageToken = result.data?.page_token || "";
  }

  return allBlocks;
}

function extractTextFromElements(elements: FeishuElement[]): string {
  return elements
    .map((el) => el.text_run?.content || "")
    .filter(Boolean)
    .join("");
}

function extractYoutubeId(text: string): string | null {
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

function blocksToContent(blocks: FeishuBlock[]): {
  fullText: string;
  youtubeId: string | null;
  sections: Section[];
} {
  let fullText = "";
  let youtubeId: string | null = null;
  const sections: Section[] = [];
  let currentSection: Section = { title: "", paragraphs: [] };

  for (const block of blocks) {
    const bt = block.block_type;
    let text = "";

    if (bt === 2) {
      // text
      text = extractTextFromElements(block.text?.elements || []);
    } else if (bt === 3) {
      // h1
      text = extractTextFromElements(block.heading1?.elements || []);
      if (currentSection.paragraphs.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: text, paragraphs: [] };
      continue;
    } else if (bt === 4) {
      // h2
      text = extractTextFromElements(block.heading2?.elements || []);
      if (currentSection.paragraphs.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: text, paragraphs: [] };
      continue;
    } else if (bt === 5) {
      // h3
      text = extractTextFromElements(block.heading3?.elements || []);
    } else if (bt === 12) {
      // bullet
      text = "• " + extractTextFromElements(block.bullet?.elements || []);
    } else if (bt === 13) {
      // ordered
      text = extractTextFromElements(block.ordered?.elements || []);
    } else if (bt === 1) {
      // page
      continue;
    } else {
      continue;
    }

    if (text.trim() === "---") {
      if (currentSection.paragraphs.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: "", paragraphs: [] };
      continue;
    }

    if (text.trim()) {
      fullText += text + "\n";
      currentSection.paragraphs.push(text);

      if (!youtubeId) {
        youtubeId = extractYoutubeId(text);
      }
    }
  }

  if (currentSection.paragraphs.length > 0) {
    sections.push(currentSection);
  }

  return { fullText, youtubeId, sections };
}

async function fetchYoutubeMeta(videoId: string | null): Promise<YoutubeMeta> {
  const meta: YoutubeMeta = {
    ytTitle: null,
    ytChannel: null,
    ytChannelUrl: null,
    ytViews: null,
    ytPublished: null,
  };

  if (!videoId) return meta;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const resp = await fetch(oembedUrl, { cache: "no-store" });
    if (resp.ok) {
      const data = await resp.json();
      meta.ytTitle = data.title || null;
      meta.ytChannel = data.author_name || null;
      meta.ytChannelUrl = data.author_url || null;
    }
  } catch (e) {
    console.error(`oEmbed failed for ${videoId}:`, e);
  }

  try {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const resp = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    const html = await resp.text();

    const viewMatch = html.match(/"viewCount":"(\d+)"/);
    if (viewMatch) {
      meta.ytViews = parseInt(viewMatch[1], 10);
    }

    const dateMatch = html.match(/"publishDate":"([^"]+)"/);
    if (dateMatch) {
      meta.ytPublished = dateMatch[1].slice(0, 10);
    }
  } catch (e) {
    console.error(`Page scrape failed for ${videoId}:`, e);
  }

  return meta;
}

function parseTitle(rawTitle: string): { dateCode: string; title: string } {
  let m = rawTitle.match(/^(\d{4})[：:\s-]+(.+)$/);
  if (m) return { dateCode: m[1], title: m[2] };

  m = rawTitle.match(/^(\d{4})\s+(.+)$/);
  if (m) return { dateCode: m[1], title: m[2] };

  return { dateCode: "", title: rawTitle };
}

/**
 * Fetch all podcasts from Feishu wiki API.
 * This is the main entry point - results should be cached by the caller.
 */
export async function fetchAllPodcasts(): Promise<Podcast[]> {
  console.log("[feishu] Fetching podcasts from Feishu API...");

  const token = await getTenantToken();
  const children = await getChildNodes(token);
  console.log(`[feishu] Found ${children.length} documents`);

  const podcasts: Podcast[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    console.log(
      `[feishu]   [${i + 1}/${children.length}] ${child.title}`
    );

    const blocks = await getDocBlocks(token, child.obj_token);
    const { fullText, youtubeId, sections } = blocksToContent(blocks);
    const { dateCode, title: cleanTitle } = parseTitle(child.title);

    let introParagraphs: string[] = [];
    let highlights: string[] = [];

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
  console.log(`[feishu] Done! Fetched ${podcasts.length} podcasts`);

  return podcasts;
}
