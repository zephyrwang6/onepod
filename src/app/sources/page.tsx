import Link from "next/link";
import { getAllPodcasts } from "@/lib/podcasts";
import { getPodcastSources, type SourceItem } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function SourceSection({
  title,
  caption,
  sources,
}: {
  title: string;
  caption: string;
  sources: SourceItem[];
}) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#20251f]/10 pb-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-none text-[#20251f]">
            {title}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#7a8378]">
            {caption}
          </p>
        </div>
        <div className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9aa299]">
          {sources.length} sources
        </div>
      </div>

      <div className="divide-y divide-[#20251f]/8">
        {sources.map((source) => (
          <article
            key={`${title}-${source.url}`}
            className="grid gap-3 py-5 md:grid-cols-[210px_minmax(0,1fr)_minmax(220px,0.72fr)] md:gap-8"
          >
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-bold leading-snug text-[#20251f]">
                {source.name}
              </h3>
              {source.count ? (
                <div className="mt-1 text-[12px] font-semibold text-[#9aa299]">
                  {source.count} episodes
                </div>
              ) : null}
            </div>
            <p className="text-[14px] leading-[1.75] text-[#535d52]">
              {source.description}
            </p>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-[13px] leading-[1.7] text-[#758071] no-underline transition hover:text-[#20251f] hover:underline hover:decoration-[#20251f]/25 hover:underline-offset-4"
            >
              {source.url}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function SourcesPage() {
  const podcasts = await getAllPodcasts();
  const podcastSources = getPodcastSources(podcasts);

  return (
    <main className="min-h-screen bg-[#e9ece8] px-4 py-6 text-[#20251f] sm:px-6 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1120px]">
        <header className="flex items-start justify-between gap-6">
          <div>
            <Link href="/" className="block w-fit no-underline">
              <h1 className="font-[family-name:var(--font-display)] text-[34px] font-semibold leading-none tracking-normal text-[#20251f] md:text-[48px]">
                Onepod
              </h1>
            </Link>
            <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-[#62705f]">
              Onepod 当前使用的播客频道信源。这里保留原始地址，方便检查、订阅和追溯。
            </p>
            <a
              href="https://my.feishu.cn/share/base/form/shrcnVyvoBedmtEgZi0JJ2YfDNd"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#20251f]/10 bg-white/45 px-4 py-2 text-[13px] font-semibold text-[#4f5a4c] no-underline shadow-[0_10px_28px_rgba(34,45,38,0.06)] transition hover:border-[#20251f]/18 hover:bg-white/70 hover:text-[#20251f]"
            >
              提交您关心的信源，每天获取更新
              <svg
                className="h-3.5 w-3.5"
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
          </div>

          <Link
            href="/"
            className="inline-flex h-9 shrink-0 items-center rounded-full px-2 text-[13px] font-semibold text-[#6e786c] no-underline transition hover:text-[#20251f]"
          >
            返回首页
          </Link>
        </header>

        <SourceSection
          title="播客"
          caption="主要来自海外科技、AI、产品和创业相关 YouTube 频道。"
          sources={podcastSources}
        />
      </div>
    </main>
  );
}
