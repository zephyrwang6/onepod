import type { Podcast } from "./types";

export interface SourceItem {
  name: string;
  description: string;
  url: string;
  count?: number;
}

const PODCAST_DESCRIPTIONS: Record<string, string> = {
  "Y Combinator": "创业者、AI 公司和早期产品构建者的一手访谈。",
  "Latent Space": "面向 AI 工程师和研究者的技术访谈与行业讨论。",
  Every: "围绕 AI、知识工作、组织和软件产品的深度内容。",
  "The MAD Podcast (Matt Turck)": "数据、AI、基础设施和企业软件创业者访谈。",
  "The MAD Podcast with Matt Turck": "数据、AI、基础设施和企业软件创业者访谈。",
  "Peter Yang": "产品、创作者经济和 AI 工作流相关访谈。",
  "Lenny's Podcast": "产品增长、创业和团队建设的一线经验。",
  "Lex Fridman": "AI、科学、工程和思想领域的长访谈。",
  "South Park Commons": "技术创业者、研究者和产品构建者的深度对话。",
  "The Pragmatic Engineer": "工程管理、软件行业和开发者职业观察。",
  "Andrej Karpathy": "AI 教育、深度学习、编程和技术直觉讲解。",
  Anthropic: "Claude、AI 安全、模型能力和研究进展发布。",
  "No Priors": "AI 创业者、研究者和投资人访谈。",
  a16z: "科技趋势、创业、投资和 AI 行业观点。",
  "Google DeepMind": "AI 研究、模型能力和前沿科学应用。",
  "Google for Developers": "开发者工具、AI API、平台能力和工程实践。",
  "Stanford GSB": "商业、领导力和技术趋势相关公开访谈。",
  "Mckay Wrigley": "AI coding、产品构建和个人自动化实践。",
  "Tiago Forte": "知识管理、生产力和创作者工作流。",
  "The AI Daily Brief": "每日 AI 新闻、产品动态和行业趋势。",
  TBPN: "科技商业、AI 创业和硅谷实时讨论。",
  "Brett Malinowski": "AI 工具、自动化和创业机会拆解。",
};

const PODCAST_SKILL_CHANNELS = [
  ["Andrej Karpathy", "@AndrejKarpathy"],
  ["Anthropic", "@anthropic-ai"],
  ["Lex Fridman", "@lexfridman"],
  ["Lenny's Podcast", "@LennysPodcast"],
  ["Peter Yang", "@PeterYangYT"],
  ["The MAD Podcast (Matt Turck)", "@DataDrivenNYC"],
  ["Every", "@EveryInc"],
  ["Y Combinator", "@ycombinator"],
  ["Latent Space", "@LatentSpacePod"],
  ["South Park Commons", "@southparkcommons"],
  ["No Priors", "@NoPriorsPodcast"],
  ["a16z", "@a16z"],
  ["Google DeepMind", "@googledeepmind"],
  ["Google for Developers", "@GoogleDevelopers"],
  ["Stanford GSB", "@stanfordgsb"],
  ["Mckay Wrigley", "@realmckaywrigley"],
  ["Tiago Forte", "@TiagoForte"],
  ["The Pragmatic Engineer", "@ThePragmaticEngineer"],
  ["The AI Daily Brief", "@TheAIDailyBrief"],
  ["TBPN", "@TBPNLive"],
  ["Brett Malinowski", "@TheBrettWay"],
] as const;

const CHANNEL_NAME_ALIASES: Record<string, string> = {
  "The MAD Podcast with Matt Turck": "The MAD Podcast (Matt Turck)",
  "Stanford Graduate School of Business": "Stanford GSB",
};

export function getPodcastSources(podcasts: Podcast[]): SourceItem[] {
  const counts = new Map<string, number>();

  for (const podcast of podcasts) {
    const name = podcast.ytChannel?.trim();
    if (!name) continue;
    const normalized = CHANNEL_NAME_ALIASES[name] || name;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  return PODCAST_SKILL_CHANNELS.map(([name, handle]) => ({
    name,
    url: `https://www.youtube.com/${handle}`,
    count: counts.get(name) || 0,
    description:
      PODCAST_DESCRIPTIONS[name] ||
      "podcast-workflow / youtube-feed skill 中配置的海外 AI、科技、创业播客信源。",
  })).sort((a, b) => {
    const countDiff = (b.count || 0) - (a.count || 0);
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name);
  });
}
