"use client";

import Link from "next/link";
import { useState } from "react";
import type { Podcast } from "@/lib/types";

function formatCreatedAt(createdAt?: number): string {
  if (!createdAt) return "未知时间";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(createdAt * 1000));
}

function getChannel(podcast: Podcast): string {
  if (podcast.ytChannel) return podcast.ytChannel;

  const sourceMatch = podcast.intro
    .join("\n")
    .match(/来源[：:]\s*([^/｜|\n，。]+)/);
  if (sourceMatch) return sourceMatch[1].trim();

  const titleChannel = podcast.rawTitle
    .replace(/^\d{4}-\d{2}-\d{2}[-：:\s]*/, "")
    .replace(/^\d{4}[-：:\s]*/, "")
    .replace(/^\d{2}-\d{2}[-：:\s]*/, "")
    .split(/[：:｜|]/)[0]
    .split(/\s+[X×]\s+/)[0]
    .split("-")[0]
    .trim();

  return titleChannel || "YouTube";
}

function cleanSummaryLine(line: string): string {
  return line
    .replace(/^文章标题[：:].*$/g, "")
    .replace(/^嘉宾[：:].*$/g, "")
    .replace(/^频道[：:].*$/g, "")
    .replace(/^日期[：:].*$/g, "")
    .replace(/^主题[：:]/g, "")
    .replace(/^播客地址[：:].*$/g, "")
    .replace(/^YouTube 链接[：:].*$/g, "")
    .replace(/^[-•\d、．.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitContentLines(text: string): string[] {
  return text
    .split(/\n|。|！|？|；/g)
    .map(cleanSummaryLine)
    .filter((line) => {
      if (line.length < 16) return false;
      if (/^https?:\/\//.test(line)) return false;
      if (/^(核心观点|精华片段|精彩片段|精选|总结一下|下面是)/.test(line)) {
        return false;
      }
      return true;
    });
}

function scoreLine(line: string): number {
  const sharpSignals = [
    "真正",
    "本质",
    "关键",
    "核心",
    "护城河",
    "反常识",
    "低估",
    "高估",
    "误区",
    "不是",
    "而是",
    "意味着",
    "说明",
    "最大",
    "最难",
    "最后",
    "正在",
    "已经",
  ];

  return sharpSignals.reduce(
    (score, signal) => score + (line.includes(signal) ? 1 : 0),
    0
  );
}

function getSharpSummary(podcast: Podcast): string {
  const candidates = [
    ...splitContentLines(podcast.fullText || ""),
    ...podcast.highlights.map(cleanSummaryLine),
    ...podcast.intro.map(cleanSummaryLine),
  ].filter(Boolean);

  const uniqueCandidates = Array.from(new Set(candidates));
  const selected = uniqueCandidates
    .map((line, index) => ({ line, index, score: scoreLine(line) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index)
    .map(({ line }) => line);

  const fallback = podcast.intro.map(cleanSummaryLine).find(Boolean) || podcast.title;
  const summary = (selected.length ? selected : [fallback]).join("。");
  const normalized = summary.replace(/。{2,}/g, "。").replace(/\s+/g, " ").trim();

  if (normalized.length <= 190) return normalized;
  return `${normalized.slice(0, 188).replace(/[，、；：:,.。\s]+$/g, "")}...`;
}

export default function HomePodcastCard({ podcast }: { podcast: Podcast }) {
  const initialCoverUrl = podcast.youtubeId
    ? `https://img.youtube.com/vi/${podcast.youtubeId}/hqdefault.jpg`
    : null;
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);

  return (
    <Link
      href={`/p/${podcast.id}`}
      className="group block overflow-hidden rounded-[8px] bg-white shadow-[0_16px_44px_rgba(34,45,38,0.12)] no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(34,45,38,0.18)]"
    >
      <article className="flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#243329]">
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center font-[family-name:var(--font-display)] text-[20px] leading-tight text-white/75 md:text-[24px]">
            Onepod
          </div>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={podcast.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
              onError={() => setCoverUrl(null)}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3.5 py-3 md:px-5 md:py-4">
          <div className="mb-2 flex items-center justify-between gap-2 font-[family-name:var(--font-ui)] text-[10.5px] uppercase tracking-[0.08em] text-[#7d887c] md:mb-3 md:text-[11.5px]">
            <span className="truncate">{getChannel(podcast)}</span>
            <span className="shrink-0">{formatCreatedAt(podcast.createdAt)}</span>
          </div>

          <h2 className="line-clamp-3 font-[family-name:var(--font-display)] text-[15px] font-semibold leading-[1.25] text-[#20251f] md:text-[18px] xl:text-[20px]">
            {podcast.title}
          </h2>

          <p className="mt-2.5 line-clamp-5 text-[12px] leading-[1.6] text-[#4f5a4d] md:text-[13px]">
            {getSharpSummary(podcast)}
          </p>
        </div>
      </article>
    </Link>
  );
}
