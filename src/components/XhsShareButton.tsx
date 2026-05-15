"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas-pro";
import type { TouchEvent } from "react";
import type { Podcast } from "@/lib/types";

const CARD_WIDTH = 540;
const CARD_HEIGHT = 720;
const XHS_FONT =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type ContentLine = {
  text: string;
  type: "heading" | "body";
};

type XhsPage =
  | { type: "cover"; page: number; total: number }
  | { type: "content"; page: number; total: number; lines: ContentLine[] };

type CoverMeta = {
  channel: string;
  guest: string;
  updatedAt: string;
};

function stripMetaValue(text: string): string {
  return text
    .replace(/^\s*[•\-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMetaValue(source: string, labels: string[]): string {
  const labelPattern = labels.join("|");
  const match = source.match(
    new RegExp(`(?:^|\\n)\\s*[•\\-]?\\s*(?:${labelPattern})[：:]\\s*([^\\n]+)`)
  );
  return match ? stripMetaValue(match[1]) : "";
}

function formatDateFromEpoch(timestamp?: number): string {
  if (!timestamp) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(timestamp * 1000))
    .replace(/\//g, "-");
}

function getCoverMeta(podcast: Podcast): CoverMeta {
  const source = podcast.fullText?.trim()
    ? podcast.fullText
    : podcast.intro.join("\n");
  const channel =
    podcast.ytChannel ||
    getMetaValue(source, ["频道", "来源"]) ||
    "海外科技播客";
  const guest =
    getMetaValue(source, ["嘉宾", "演讲者", "主持人"]) || "本期嘉宾";
  const updatedAt =
    formatDateFromEpoch(podcast.createdAt) ||
    podcast.ytPublished ||
    getMetaValue(source, ["日期", "更新时间"]) ||
    "";

  return { channel, guest, updatedAt };
}

function isMetadataLine(text: string): boolean {
  return /^\s*[•\-]?\s*(嘉宾|演讲者|主持人|频道|来源|日期|更新时间|标签|链接|播客地址|观看量|YouTube|YouTube 链接|下面是 YouTube 链接)[：:]/.test(
    text
  );
}

function isClosingLine(text: string): boolean {
  return /^(感谢阅读|如果对你有启发|欢迎转发)/.test(text);
}

function isSectionLabel(text: string): boolean {
  return /^(核心观点|精华片段|精彩片段|播客地址|视频链接)[：:]?$/.test(
    text
  );
}

function isHighlightStart(lines: string[], index: number): boolean {
  const text = lines[index];
  const next = lines[index + 1] || "";
  return /^关于.+/.test(text) && next.trim().startsWith(">");
}

function cleanText(text: string): string {
  return text
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\s*[-•]\s*/, "")
    .trim();
}

function isLikelyHeading(text: string, next?: string): boolean {
  if (!next) return false;
  if (text.length > 34) return false;
  if (/[。！？.!?]$/.test(text)) return false;
  if (/^[-•>]/.test(text)) return false;
  return next.length > text.length || next.length > 36;
}

function splitLongBody(text: string): string[] {
  if (text.length <= 86) return [text];

  const parts = text
    .split(/(?<=[。！？；;.!?])\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [text];

  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    if (current && current.length + part.length > 96) {
      chunks.push(current);
      current = part;
    } else {
      current = current ? `${current}${part}` : part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function getCoreLines(podcast: Podcast): ContentLine[] {
  const source = podcast.fullText?.trim()
    ? podcast.fullText
    : podcast.intro.join("\n");
  const rawLines = source
    .split(/\n+/)
    .map((text) => text.trim())
    .filter(Boolean);
  const lines: ContentLine[] = [];

  for (let index = 0; index < rawLines.length; index++) {
    const rawLine = rawLines[index];
    if (isMetadataLine(rawLine)) continue;
    if (isSectionLabel(rawLine)) continue;
    if (isHighlightStart(rawLines, index)) break;
    if (isClosingLine(rawLine)) break;
    if (rawLine.startsWith(">")) continue;

    const text = cleanText(rawLine);
    if (!text) continue;

    const headingMatch = text.match(/^(#{1,3})\s*(.+)$/);
    if (headingMatch) {
      lines.push({ text: headingMatch[2], type: "heading" });
      continue;
    }

    if (isLikelyHeading(text, rawLines[index + 1])) {
      lines.push({ text, type: "heading" });
      continue;
    }

    for (const chunk of splitLongBody(text)) {
      lines.push({ text: chunk, type: "body" });
    }
  }

  if (lines.length > 0) return lines;

  return podcast.intro
    .flatMap((text) => text.split(/\n+/))
    .map(cleanText)
    .filter(Boolean)
    .map((text) => ({ text, type: "body" as const }));
}

function lineWeight(line: ContentLine): number {
  return line.type === "heading"
    ? line.text.length * 1.45 + 28
    : line.text.length;
}

function paginateLines(lines: ContentLine[]): ContentLine[][] {
  const totalWeight = lines.reduce((sum, line) => sum + lineWeight(line), 0);
  const pageCount = Math.max(1, Math.ceil(totalWeight / 350));
  const pageBudget = Math.max(290, Math.ceil(totalWeight / pageCount));
  const pages: ContentLine[][] = [];
  let current: ContentLine[] = [];
  let currentWeight = 0;

  for (const line of lines) {
    const weight = lineWeight(line);
    if (current.length > 0 && currentWeight + weight > pageBudget) {
      pages.push(current);
      current = [];
      currentWeight = 0;
    }
    current.push(line);
    currentWeight += weight;
  }

  if (current.length > 0) pages.push(current);
  return pages;
}

function createPages(podcast: Podcast): XhsPage[] {
  const contentPages = paginateLines(getCoreLines(podcast));
  const total = contentPages.length + 1;
  return [
    { type: "cover", page: 1, total },
    ...contentPages.map((lines, index) => ({
      type: "content" as const,
      page: index + 2,
      total,
      lines,
    })),
  ];
}

function XhsLogo() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M838.848 64c26.88 0 51.456 9.12 71.68 24.192 9.856 6.976 18.304 15.776 25.28 25.28 14.72 20.032 24.192 44.768 24.192 71.84v653.568c0 26.88-9.152 51.424-24.192 71.68a112.608 112.608 0 0 1-25.28 25.28 118.72 118.72 0 0 1-71.68 24.16H185.152c-26.88 0-51.456-9.152-71.68-24.192a112.608 112.608 0 0 1-25.28-25.28A118.656 118.656 0 0 1 64 838.912V185.312c0-27.072 9.152-51.808 23.84-71.872a112.64 112.64 0 0 1 25.28-25.28A120.544 120.544 0 0 1 185.088 64z m-196.736 335.232h-121.344v51.392h33.536v164.672h-53.76l-13.376 26.464-4.256 8.384-7.84 15.488h188.352v-50.176H608.96V449.92h33.152v-50.688z m-167.936 212.8h-83.68c-7.68 15.072-16.48 32.288-27.04 53.44 27.936 0 52.48 0.16 76.864-0.192 3.2-0.192 7.68-2.688 9.152-5.376 8.064-14.528 15.392-29.568 24.704-47.84z m-214.144-233.408h-52.48v242.752H172.608l33.312 44.064h31.936c2.208-0.096 22.144-1.792 21.664-32.416 0.32-79.552 0.512-174.848 0.512-254.4z m508.224 0h-52.48v21.504h-34.432v50.688h33.888v45.312h-51.104v53.6h52.512v115.008h51.968v-115.744c25.6 0 49.12-0.352 72.416 0.192 11.648 0.16 17.92 7.52 18.24 18.976 0.16 3.648 0.224 9.12 0.256 15.168v9.376c-0.032 14.304-0.224 28.48-0.224 28.48l-52.512-0.16 20.256 43.52h49.344c5.76-0.128 36.16-2.528 36.16-36.896v-91.744c0-30.816-18.848-39.776-63.104-39.584v-9.824c-0.064-15.904-0.224-40.96-0.352-49.824-0.16-33.888-31.712-36.384-37.76-36.544H768.64l-0.352-21.504zM170.08 452.064H114.88c4.48 69.344-15.584 130.624-15.584 132.768 10.24 17.92 20.256 35.84 31.36 55.168 36.672-51.392 39.328-159.168 39.424-183.136v-4.8z m179.2-0.32H297.504c-0.352 97.6 13.248 163.36 38.336 185.408 10.944-31.712 26.176-65.408 26.176-65.408s-16.672-68.608-12.736-120z m133.696-73.12h-52.512c-15.232 31.168-31.36 62.336-45.696 94.048-8.96 20.064-1.6 29.92 20.064 30.816 7.52 0.192 15.04 0 25.28 0-3.424 7.872-5.92 13.088-8.256 18.464-6.976 15.392-14.496 30.624-20.8 46.208-5.184 12.544 0 22.752 13.28 24.192 18.464 1.984 37.12 1.44 55.552 1.44 1.984 0 5.024-2.336 6.08-4.32 6.656-12.352 12.928-24.896 19.904-38.688-4.832-0.544-7.36-0.896-10.048-0.896-25.088-0.544-25.088-0.704-13.76-23.296l4.288-8.768c10.752-21.696 21.504-43.36 33.664-67.712-22.72 1.248-42.112 2.304-63.424 3.584 9.152-24.384 23.488-49.472 36.384-75.072z m320.768 72v45.504H768.96l-0.32-45.504h35.104z m106.08-46.912c-12.16-11.648-25.088-7.904-34.4-1.984a28.032 28.032 0 0 0-13.088 23.84v26.688h27.968c24.352 0 37.632-29.408 20.8-47.136-0.384-0.512-0.736-1.056-1.28-1.408z"
        fill="currentColor"
      />
    </svg>
  );
}

function XhsCard({
  podcast,
  page,
  bgColor,
  setCardRef,
}: {
  podcast: Podcast;
  page: XhsPage;
  bgColor: string;
  setCardRef: (node: HTMLDivElement | null) => void;
}) {
  const coverUrl = podcast.youtubeId
    ? `https://img.youtube.com/vi/${podcast.youtubeId}/maxresdefault.jpg`
    : null;
  const coverMeta = getCoverMeta(podcast);

  return (
    <div
      ref={setCardRef}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: bgColor,
        padding: 34,
        boxSizing: "border-box",
        fontFamily: XHS_FONT,
        color: "#1f211f",
        overflow: "hidden",
        position: "relative",
        fontVariantLigatures: "none",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: "#fbfaf7",
          borderRadius: 28,
          padding: page.type === "cover" ? 0 : "34px 36px 26px",
          overflow: "hidden",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 18px 48px rgba(26, 28, 24, 0.16)",
        }}
      >
        {page.type === "cover" ? (
          <>
            <div
              style={{
                height: 252,
                background: "#1e2420",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt=""
                  crossOrigin="anonymous"
                  onError={(event) => {
                    if (!podcast.youtubeId) return;
                    event.currentTarget.src = `https://img.youtube.com/vi/${podcast.youtubeId}/hqdefault.jpg`;
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.32))",
                }}
              />
            </div>
            <div
              style={{
                padding: "30px 38px 34px",
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div
                style={{
                  color: "#ff2442",
                  fontSize: 15,
                  fontWeight: 800,
                  marginBottom: 14,
                  letterSpacing: ".08em",
                }}
              >
                海外科技播客精选
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 33,
                  lineHeight: "42px",
                  letterSpacing: 0,
                  fontWeight: 800,
                  wordBreak: "normal",
                  overflowWrap: "break-word",
                }}
              >
                {podcast.title}
              </h1>
              <div
                style={{
                  width: 46,
                  height: 2,
                  background: "#ece7df",
                  margin: "24px 0 20px",
                }}
              />
              <div
                style={{
                  display: "grid",
                  gap: 11,
                  color: "#5c625a",
                  fontSize: 17,
                  lineHeight: "25px",
                  fontWeight: 500,
                }}
              >
                {[
                  ["频道", coverMeta.channel],
                  ["嘉宾", coverMeta.guest],
                  ["时间", coverMeta.updatedAt],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr",
                        gap: 10,
                        alignItems: "start",
                      }}
                    >
                      <span
                        style={{
                          color: "#9b9f96",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}：
                      </span>
                      <span
                        style={{
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  color: "#ff2442",
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                }}
              >
                核心观点
              </div>
              <div style={{ color: "#a1a49d", fontSize: 13 }}>
                {page.page}/{page.total}
              </div>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {page.lines.map((line, index) =>
                line.type === "heading" ? (
                  <h2
                    key={`${line.text}-${index}`}
                    style={{
                      margin: index === 0 ? "0 0 13px" : "20px 0 13px",
                      fontSize: 26,
                      lineHeight: "34px",
                      fontWeight: 850,
                      letterSpacing: 0,
                      wordBreak: "normal",
                      overflowWrap: "break-word",
                    }}
                  >
                    {line.text}
                  </h2>
                ) : (
                  <p
                    key={`${line.text}-${index}`}
                    style={{
                      margin: "0 0 15px",
                      fontSize: 21,
                      lineHeight: "34px",
                      color: "#4a4f48",
                      fontWeight: 500,
                      letterSpacing: 0,
                      wordBreak: "normal",
                      overflowWrap: "break-word",
                    }}
                  >
                    {line.text}
                  </p>
                )
              )}
            </div>
          </>
        )}
      </div>
      <div
        style={{
          color: "rgba(255, 255, 255, 0.72)",
          fontSize: 13,
          lineHeight: "20px",
          fontWeight: 600,
          padding: "0 4px",
          flex: "0 0 auto",
        }}
      >
        OnePod · 每日精选海外播客
      </div>
    </div>
  );
}

function XhsPreviewModal({
  images,
  onClose,
}: {
  images: string[];
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const activeImage = images[activeIndex] || images[0] || "";

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const downloadImage = useCallback((url: string, index: number) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `onepod-xhs-${String(index + 1).padStart(2, "0")}.png`;
    anchor.rel = "noopener";
    anchor.click();
  }, []);

  const downloadAll = useCallback(() => {
    images.forEach((url, index) => {
      setTimeout(() => downloadImage(url, index), index * 160);
    });
  }, [downloadImage, images]);

  const showPrevious = useCallback(() => {
    setActiveIndex((index) => (index - 1 + images.length) % images.length);
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex((index) => (index + 1) % images.length);
  }, [images.length]);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const startX = touchStartX.current;
      touchStartX.current = null;
      if (startX === null) return;

      const distance = event.changedTouches[0].clientX - startX;
      if (Math.abs(distance) < 36) return;
      if (distance > 0) showPrevious();
      else showNext();
    },
    [showNext, showPrevious]
  );

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/65 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-6 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-[980px] flex-col rounded-t-[24px] bg-[#181818] p-3 shadow-2xl sm:max-h-[90vh] sm:rounded-none sm:bg-transparent sm:p-0 sm:shadow-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3 px-1 sm:mb-4 sm:items-center sm:px-0">
          <div className="text-white">
            <div className="text-[16px] font-semibold">小红书切图</div>
            <div className="mt-1 text-[12px] text-white/55">
              {activeIndex + 1} / {images.length}，比例 3:4
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => downloadImage(activeImage, activeIndex)}
              className="min-h-10 rounded-full bg-white px-4 text-[13px] font-semibold text-[#1f211f] transition hover:bg-white/90"
            >
              下载当前
            </button>
            <button
              onClick={onClose}
              className="min-h-10 rounded-full bg-white/15 px-3 text-[13px] font-medium text-white transition hover:bg-white/25"
            >
              关闭
            </button>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden rounded-[20px] bg-white/8 p-3">
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0].clientX;
            }}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={showPrevious}
              className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
              aria-label="上一张"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={`小红书切图 ${activeIndex + 1}`}
              className="block max-h-[66dvh] w-auto max-w-full rounded-[18px] object-contain shadow-xl"
            />
            <button
              onClick={showNext}
              className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
              aria-label="下一张"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 justify-center gap-1.5">
              {images.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition ${
                    index === activeIndex
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/35 hover:bg-white/60"
                  }`}
                  aria-label={`查看第 ${index + 1} 张`}
                />
              ))}
            </div>
            <button
              onClick={downloadAll}
              className="min-h-10 shrink-0 rounded-full bg-white/12 px-4 text-[13px] font-semibold text-white transition hover:bg-white/20"
            >
              下载全部
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function XhsShareButton({
  podcast,
  bgColor,
}: {
  podcast: Podcast;
  bgColor: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [renderCards, setRenderCards] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pages = useMemo(() => createPages(podcast), [podcast]);

  useEffect(() => setMounted(true), []);

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    cardRefs.current = [];
    setLoading(true);
    setRenderCards(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await document.fonts?.ready;

      const nodes = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      await Promise.all(
        nodes.flatMap((node) =>
          Array.from(node.querySelectorAll("img")).map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete) return resolve();
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
          )
        )
      );

      const nextImages = [];
      for (const node of nodes) {
        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: bgColor,
          logging: false,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        });
        nextImages.push(canvas.toDataURL("image/png"));
      }
      setImages(nextImages);
    } catch (error) {
      console.error("XHS image generation failed:", error);
    } finally {
      setLoading(false);
      setRenderCards(false);
    }
  }, [bgColor, loading]);

  const handleClose = useCallback(() => setImages([]), []);

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="-m-2 inline-flex h-9 w-9 items-center justify-center text-[#bbb] transition hover:text-[#ff2442] disabled:opacity-40 md:m-0 md:h-5 md:w-5"
        title="生成小红书切图"
        aria-label="生成小红书切图"
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              strokeDasharray="60"
              strokeDashoffset="20"
            />
          </svg>
        ) : (
          <XhsLogo />
        )}
      </button>

      {mounted &&
        renderCards &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: "calc(100vw + 32px)",
              top: 0,
              display: "grid",
              gap: 24,
              width: CARD_WIDTH,
              pointerEvents: "none",
            }}
          >
            {pages.map((page, index) => (
              <XhsCard
                key={`${page.type}-${page.page}`}
                podcast={podcast}
                page={page}
                bgColor={bgColor}
                setCardRef={(node) => {
                  cardRefs.current[index] = node;
                }}
              />
            ))}
          </div>,
          document.body
        )}

      {mounted &&
        images.length > 0 &&
        createPortal(
          <XhsPreviewModal images={images} onClose={handleClose} />,
          document.body
        )}
    </>
  );
}
