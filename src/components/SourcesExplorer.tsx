"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { HomePodcast } from "@/components/HomePodcastCard";
import type { SourceItem } from "@/lib/sources";

interface SourcesExplorerProps {
  title?: string;
  caption?: string;
  sources: SourceItem[];
  podcastsBySource: Record<string, HomePodcast[]>;
}

function getDateCode(podcast: HomePodcast): string {
  const match = podcast.rawTitle.match(/^(\d{4})[：:\s-]/);
  if (match) return match[1];

  return podcast.createdAt
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
      })
        .format(new Date(podcast.createdAt * 1000))
        .replace("/", "")
    : "----";
}

function SourcePodcastCard({ podcast }: { podcast: HomePodcast }) {
  const coverUrl = podcast.youtubeId
    ? `https://img.youtube.com/vi/${podcast.youtubeId}/hqdefault.jpg`
    : null;

  return (
    <Link
      href={`/p/${podcast.id}`}
      className="group block overflow-hidden border border-[#20251f]/10 bg-[#f8faf7] text-[#20251f] no-underline transition hover:border-[#20251f]/22 hover:bg-white"
    >
      <article className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 p-2.5 sm:grid-cols-1 sm:gap-0 sm:p-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#26342b]">
          <div className="absolute inset-0 flex items-center justify-center text-[18px] font-semibold text-white/70">
            Onepod
          </div>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={podcast.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : null}
          <div className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white">
            {getDateCode(podcast)}
          </div>
        </div>

        <div className="min-w-0 px-1 py-1 sm:px-3.5 sm:py-3">
          <div className="mb-1 truncate text-[11px] font-semibold text-[#7d887c]">
            {podcast.ytChannel || "YouTube"}
          </div>
          <h3 className="line-clamp-3 text-[15px] font-bold leading-snug text-[#20251f] sm:text-[16px]">
            {podcast.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-[12px] leading-[1.55] text-[#596356]">
            {[...podcast.highlights, ...podcast.intro]
              .find((line) => line && line.length > 18)
              ?.replace(/^[-•\d、．.\s]+/, "")
              .trim() || "点击阅读 Onepod 已采集的这期播客内容。"}
          </p>
        </div>
      </article>
    </Link>
  );
}

export default function SourcesExplorer({
  title,
  caption,
  sources,
  podcastsBySource,
}: SourcesExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const querySource = searchParams.get("source");
  const [selectedName, setSelectedName] = useState<string | null>(querySource);

  useEffect(() => {
    setSelectedName(querySource);
  }, [querySource]);

  const selectedSource = useMemo(
    () => sources.find((source) => source.name === selectedName) || null,
    [selectedName, sources]
  );
  const selectedPodcasts = selectedSource
    ? podcastsBySource[selectedSource.name] || []
    : [];

  const openSource = (source: SourceItem) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("source", source.name);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closePanel = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("source");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <section className="mt-12">
        {title || caption ? (
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#20251f]/10 pb-4">
            <div>
              {title ? (
                <h2 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-none text-[#20251f]">
                  {title}
                </h2>
              ) : null}
            {caption ? (
              <p className="mt-2 text-[13px] leading-relaxed text-[#7a8378]">
                {caption}
              </p>
            ) : null}
            </div>
          </div>
        ) : null}

        <div className="divide-y divide-[#20251f]/8">
          {sources.map((source) => {
            const sourcePodcasts = podcastsBySource[source.name] || [];

            return (
              <article
                key={source.url}
                className="grid cursor-pointer gap-3 py-5 transition hover:bg-white/25 md:grid-cols-[210px_minmax(0,1fr)_minmax(220px,0.72fr)] md:gap-8"
                role="button"
                tabIndex={0}
                onClick={() => openSource(source)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSource(source);
                  }
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#d8ddd6] ring-1 ring-[#20251f]/8">
                    {source.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={source.avatarUrl}
                        alt={source.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#6e786c]">
                        {source.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-bold leading-snug text-[#20251f]">
                      {source.name}
                    </h3>
                    <div className="mt-1 text-[12px] font-semibold text-[#9aa299]">
                      {sourcePodcasts.length || source.count || 0} episodes
                    </div>
                  </div>
                </div>
                <p className="text-[14px] leading-[1.75] text-[#535d52]">
                  {source.description}
                </p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="break-all text-[13px] leading-[1.7] text-[#758071] no-underline transition hover:text-[#20251f] hover:underline hover:decoration-[#20251f]/25 hover:underline-offset-4"
                >
                  {source.url}
                </a>
              </article>
            );
          })}
        </div>
      </section>

      {selectedSource ? (
        <div
          className="pointer-events-none fixed inset-y-0 right-0 z-50 flex w-full justify-end"
          onClick={closePanel}
        >
          <aside
            className="pointer-events-auto flex h-full w-full max-w-[760px] translate-x-0 flex-col overflow-hidden border-l border-[#20251f]/12 bg-[#e9ece8] animate-in slide-in-from-right-6 duration-300"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#20251f]/10 bg-[#eef1ed] px-5 py-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 gap-3">
                <div className="relative mt-1 h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#d8ddd6] ring-1 ring-[#20251f]/8">
                  {selectedSource.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedSource.avatarUrl}
                      alt={selectedSource.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-[#20251f]">
                    {selectedSource.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#647060]">
                    {selectedSource.description}
                  </p>
                  <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8a9488]">
                    {selectedPodcasts.length} Onepod episodes
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#20251f]/10 bg-transparent text-[#6e786c] transition hover:border-[#20251f]/18 hover:bg-[#20251f]/5 hover:text-[#20251f]"
                aria-label="关闭"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-7 sm:py-6">
              {selectedPodcasts.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedPodcasts.map((podcast) => (
                    <SourcePodcastCard key={podcast.id} podcast={podcast} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center border border-dashed border-[#20251f]/14 bg-[#f8faf7] px-8 text-center">
                  <p className="max-w-[360px] text-[14px] leading-relaxed text-[#647060]">
                    这个播客已经加入采集范围，但 Onepod 里还没有对应文章。等下一次采集处理后，这里会自动出现卡片。
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
