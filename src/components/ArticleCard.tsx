"use client";

import Link from "next/link";
import type { Podcast } from "@/lib/types";
import ShareButton from "./ShareButton";

function formatParagraph(text: string): string {
  let s = text;
  s = s.replace(/https?:\/\/[^\s]+/g, "");
  s = s.replace(/(\d+)[、．.]\s*/g, "<strong>$1. </strong>");
  return s.trim();
}

function IntroSection({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="font-[family-name:var(--font-body)] text-[15.5px] leading-[1.9] text-[#4a4a4a]">
      {paragraphs
        .filter(
          (t) =>
            !t.includes("YouTube 链接") &&
            !t.includes("youtube.com") &&
            !t.includes("youtu.be")
        )
        .map((text, i) => {
          const cleaned = formatParagraph(text);
          if (!cleaned) return null;
          return (
            <p
              key={i}
              className="mb-4 last:mb-0"
              dangerouslySetInnerHTML={{ __html: cleaned }}
            />
          );
        })}
    </div>
  );
}

function HighlightsSection({ paragraphs }: { paragraphs: string[] }) {
  const blocks: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } = { title: "", lines: [] };

  for (const text of paragraphs) {
    if (
      text.includes("YouTube 链接") ||
      text.includes("youtube.com") ||
      text.includes("youtu.be")
    )
      continue;

    if (text.startsWith("#")) {
      if (current.lines.length || current.title) blocks.push(current);
      current = { title: text.replace(/^#\d+\s*/, ""), lines: [] };
      continue;
    }

    let formatted = text;
    formatted = formatted.replace(
      /^(主持人|嘉宾)[：:]\s*/,
      '<span class="font-[family-name:var(--font-ui)] font-semibold text-[13px] text-[#222]">$1：</span>'
    );
    formatted = formatted.replace(
      /^(编辑补充)[：:]\s*/,
      '<span class="italic text-[#999] text-[13.5px]">$1：</span>'
    );
    formatted = formatted.replace(/https?:\/\/[^\s]+/g, "").trim();
    if (!formatted) continue;
    current.lines.push(formatted);
  }
  if (current.lines.length || current.title) blocks.push(current);

  return (
    <div className="font-[family-name:var(--font-body)] text-[15px] leading-[1.9] text-[#4a4a4a]">
      {blocks.map((block, i) => (
        <div key={i} className="mb-6 pl-5 border-l-2 border-accent/25">
          {block.title && (
            <p className="font-semibold text-[#1a1a1a] mb-1.5 text-[15px]">
              {block.title}
            </p>
          )}
          {block.lines.map((line, j) => (
            <p
              key={j}
              className="mb-1.5"
              dangerouslySetInnerHTML={{ __html: line }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ArticleCard({
  podcast,
  nextPodcast,
  bgColor,
}: {
  podcast: Podcast;
  nextPodcast: Podcast | null;
  bgColor: string;
}) {
  return (
    <article className="w-full max-w-[680px] bg-white rounded-2xl shadow-[0_8px_60px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-up h-fit">
      {/* Hero */}
      {podcast.youtubeId ? (
        <a
          href={`https://www.youtube.com/watch?v=${podcast.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block w-full aspect-video overflow-hidden bg-[#111]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${podcast.youtubeId}/maxresdefault.jpg`}
            alt={podcast.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${podcast.youtubeId}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-16 h-16 drop-shadow-xl" viewBox="0 0 68 48">
              <path
                d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                fill="red"
              />
              <path d="M45 24L27 14v20" fill="#fff" />
            </svg>
          </div>
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[11px] font-medium px-3.5 py-1.5 rounded-full tracking-wide">
            🎙 Issue {podcast.dateCode || "#"}
          </div>
        </a>
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-[#2a2f3d] via-[#3a3f4d] to-[#2a2f3d] flex items-center justify-center">
          <svg
            className="w-12 h-12 opacity-20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}

      {/* Body */}
      <div className="px-10 pt-8 pb-10 max-md:px-6">
        {/* Meta */}
        <div className="flex items-center justify-between mb-5 text-[13px] text-[#aaa]">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <span>每日播客推荐</span>
          </div>
          <div className="flex items-center gap-3">
            {podcast.youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${podcast.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#bbb] hover:text-[#333] transition-colors"
                title="YouTube"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </a>
            )}
            <a
              href={podcast.feishuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#bbb] hover:text-[#333] transition-colors"
              title="飞书原文"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <ShareButton podcast={podcast} bgColor={bgColor} />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.3] text-[#1a1a1a] mb-7 tracking-[-0.01em] max-md:text-[24px]">
          {podcast.title}
        </h1>

        {/* Intro */}
        <IntroSection paragraphs={podcast.intro} />

        {/* Highlights */}
        {podcast.highlights.length > 0 && (
          <>
            <div className="w-10 h-px bg-[#e0e0e0] my-8" />
            <div className="text-[11px] font-semibold text-accent tracking-[0.08em] uppercase mb-4 font-[family-name:var(--font-ui)]">
              ✦ 精华片段
            </div>
            <HighlightsSection paragraphs={podcast.highlights} />
          </>
        )}
      </div>

      {/* Read Next */}
      {nextPodcast && (
        <Link
          href={`/p/${nextPodcast.id}`}
          className="block px-10 py-7 bg-[#f5f3f0] hover:bg-[#eeebe6] transition-colors duration-300 no-underline max-md:px-6"
        >
          <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#aaa] mb-2">
            Next Episode →
          </div>
          <div className="font-[family-name:var(--font-display)] text-[18px] font-medium text-[#1a1a1a] leading-snug">
            {nextPodcast.title}
          </div>
        </Link>
      )}
    </article>
  );
}
