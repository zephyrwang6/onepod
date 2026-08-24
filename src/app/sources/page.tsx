import Link from "next/link";
import SourcesExplorer from "@/components/SourcesExplorer";
import { getAllPodcasts } from "@/lib/podcasts";
import {
  getPodcastSources,
  normalizePodcastChannelName,
} from "@/lib/sources";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SourcesPage() {
  const podcasts = await getAllPodcasts();
  const podcastSources = getPodcastSources(podcasts);
  const homePodcasts = podcasts.map((podcast) => ({
    id: podcast.id,
    title: podcast.title,
    rawTitle: podcast.rawTitle,
    createdAt: podcast.createdAt,
    youtubeId: podcast.youtubeId,
    intro: podcast.intro,
    highlights: podcast.highlights,
    ytChannel: podcast.ytChannel,
  }));
  const podcastsBySource = podcastSources.reduce<Record<string, typeof homePodcasts>>(
    (grouped, source) => ({
      ...grouped,
      [source.name]: homePodcasts.filter(
        (podcast) => normalizePodcastChannelName(podcast.ytChannel) === source.name
      ),
    }),
    {}
  );

  return (
    <main className="min-h-screen bg-[#e9ece8] px-4 py-6 text-[#20251f] sm:px-6 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1120px]">
        <header className="flex items-start justify-between gap-6">
          <div>
            <Link href="/" className="relative block w-fit no-underline">
              <h1 className="font-[family-name:var(--font-display)] text-[34px] font-semibold leading-none tracking-normal text-[#20251f] md:text-[48px]">
                Onepod
              </h1>
              <span className="absolute -right-24 bottom-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9aa299] md:-right-28">
                {podcastSources.length} podcasts
              </span>
            </Link>
            <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-[#62705f]">
              Onepod 正在追踪的海外科技播客列表。点击任意播客，可以查看已经采集和整理过的内容。
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="group relative">
              <button
                type="button"
                className="inline-flex h-9 w-fit items-center rounded-full px-2 text-[13px] font-semibold text-[#6e786c] transition hover:text-[#20251f]"
              >
                用户群
              </button>
              <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-[210px] border border-[#20251f]/10 bg-[#f8faf7] p-3 opacity-0 transition group-hover:opacity-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/onepod-wechat-group.jpg"
                  alt="Onepod 用户群二维码"
                  className="block w-full"
                />
              </div>
            </div>
            <a
              href="https://my.feishu.cn/share/base/form/shrcnVyvoBedmtEgZi0JJ2YfDNd"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-[#6e786c] no-underline transition hover:text-[#20251f]"
            >
              提交信源
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-full px-2 text-[13px] font-semibold text-[#6e786c] no-underline transition hover:text-[#20251f]"
            >
              返回首页
            </Link>
          </div>
        </header>

        <SourcesExplorer
          sources={podcastSources}
          podcastsBySource={podcastsBySource}
        />
      </div>
    </main>
  );
}
