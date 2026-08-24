import type { Podcast } from "./types";

export interface SourceItem {
  name: string;
  description: string;
  url: string;
  count?: number;
  avatarUrl?: string;
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

const PODCAST_AVATARS: Record<string, string> = {
  "Andrej Karpathy": "https://yt3.googleusercontent.com/ytc/AIdro_nDvyq2NoPL626bk1IbxQ94SfQsD-B0qgZchghtQNkLWoEz=s900-c-k-c0x00ffffff-no-rj",
  Anthropic: "https://yt3.googleusercontent.com/ux-GXUpB4PkI-qXVOpj9gGEiCkytT0Q78ka4srlxOm_Y3m1gEh5qy8Vu6vTjGSDztMT0NybtC7I=s900-c-k-c0x00ffffff-no-rj",
  "Lex Fridman": "https://yt3.googleusercontent.com/ytc/AIdro_ljfMy9kUR1PH9VRf-XsTsPqFMgORC_zodOQVEAm4hx36lC=s900-c-k-c0x00ffffff-no-rj",
  "Lenny's Podcast": "https://yt3.googleusercontent.com/Wk7-4UW17JqDXgVWDiE7s1gJxDkt_UwNa2oNw8OYRwc9deiCv2V2fFAdNgByDi0K9AAF0YMj=s900-c-k-c0x00ffffff-no-rj",
  "Peter Yang": "https://yt3.googleusercontent.com/ytc/AIdro_k0xbR9-CBYMh3YOZJnMQr00qwnbA_aAChW3z0I8lNcGRE=s900-c-k-c0x00ffffff-no-rj",
  "The MAD Podcast (Matt Turck)": "https://yt3.googleusercontent.com/zELsyYmenYTQanNFH9Vti3fuVN2Dkky0AGvVlMLUeTvssEiWIdIKKmwNxtrgmAKWGeN4F9RnNIc=s900-c-k-c0x00ffffff-no-rj",
  Every: "https://yt3.googleusercontent.com/n6p0RudkPKoaFsxiZfunvI5MpqS443Qfbf2E4mmAy1k0etF4M7etYyJAJ_RMknfit6Tnxx4Du4g=s900-c-k-c0x00ffffff-no-rj",
  "Y Combinator": "https://yt3.googleusercontent.com/dGyATx87Fp_s1nZvnupUFSnMqbAPZ6nqRby9Esk1m6YE41iBq-9Z8iGoIgHTCT9SiDBUpP2V=s900-c-k-c0x00ffffff-no-rj",
  "Latent Space": "https://yt3.googleusercontent.com/pSTHcffCXEverYEPdjM0iIRPH-IUT4d2biIMZ_Z7bhyf6sME-laFer9vEfpFbM5tqFYJV-UsLQ=s900-c-k-c0x00ffffff-no-rj",
  "South Park Commons": "https://yt3.googleusercontent.com/rTHi9Q-VulPPgZLDdamX57N_db9TognfYKHMG9liMbpFmSNAA5hTm7nyU0QLXgfU3E50LurN3wE=s900-c-k-c0x00ffffff-no-rj",
  "No Priors": "https://yt3.googleusercontent.com/HQXIpkLms_iVMi_Ob5Cie3PNcZ3smOT7HeNLIAWvBO-lZMdiax2N5LH1blWMxUtMrJCcXyNZ=s900-c-k-c0x00ffffff-no-rj",
  a16z: "https://yt3.googleusercontent.com/hkiO7UAtALrbqOcewo4CIrbd0j8XDeWttKkdtihfX1emeV4iUMwjIe1KKn4zd6wT2OOwANDnIA=s900-c-k-c0x00ffffff-no-rj",
  "Google DeepMind": "https://yt3.googleusercontent.com/xofhdRNoyqgAB_YpJgAQeasGtE6gTEXpR2v1vyMmtqlRCmoEUIsTGJcavUORLhhKQk3b9UeUFw=s900-c-k-c0x00ffffff-no-rj",
  "Google for Developers": "https://yt3.googleusercontent.com/WZ_63J_-745xyW_DGxGi3VUyTZAe0Jvhw2ZCg7fdz-tv9esTbNPZTFR9X79QzA0ArIrMjYJCDA=s900-c-k-c0x00ffffff-no-rj",
  "Stanford GSB": "https://yt3.googleusercontent.com/ytc/AIdro_lWoHJNSE1UPPiFdCG4_aQZ1apKXrKI7nZ_sFlKwhNwRl0=s900-c-k-c0x00ffffff-no-rj",
  "Mckay Wrigley": "https://yt3.googleusercontent.com/ytc/AIdro_m114mcpiz4WMxjxkci1z8z3XXCP64yYoL2Z4wsjM2bNdWO=s900-c-k-c0x00ffffff-no-rj",
  "Tiago Forte": "https://yt3.googleusercontent.com/CqC4SrpXMCHA9b39JDtbXxefJ0TlHmaxFpAxSKqDCBVIudLl50gtlYA5fmIIGFlc4mjE1-uw6w=s900-c-k-c0x00ffffff-no-rj",
  "The Pragmatic Engineer": "https://yt3.googleusercontent.com/ytc/AIdro_mzrMszjXcIm7EdsK_QfN9Pk7YXbiXj9fihf86JaB8=s900-c-k-c0x00ffffff-no-rj",
  "The AI Daily Brief": "https://yt3.googleusercontent.com/kNdRN_Aa_xXvA1Y2KxcephehAzzbvyYbnm2xGg7MjUZ11yHpVah2GqsprxIXlA57uhdl97yF=s900-c-k-c0x00ffffff-no-rj",
  TBPN: "https://yt3.googleusercontent.com/1QdlbXwJRXYY6leF-ULTE8ahNmTYEgezebSqVDZqI2DLGSkRCCcvcUtdkAhOj5mLB8C0AK_J=s900-c-k-c0x00ffffff-no-rj",
  "Brett Malinowski": "https://yt3.googleusercontent.com/jVlCb_H_mcYd9UkwcSLvoTDG3SRTobvGUQ22PLtogxFGJpbbXOVXhdzY9wULJe6hVLFbfdu2vQ=s900-c-k-c0x00ffffff-no-rj",
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
    avatarUrl: PODCAST_AVATARS[name],
    description:
      PODCAST_DESCRIPTIONS[name] ||
      "podcast-workflow / youtube-feed skill 中配置的海外 AI、科技、创业播客信源。",
  })).sort((a, b) => {
    const countDiff = (b.count || 0) - (a.count || 0);
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name);
  });
}
