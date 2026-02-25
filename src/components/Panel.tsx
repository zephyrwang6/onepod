import type { Podcast } from "@/lib/types";

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Panel({ podcast }: { podcast: Podcast }) {
  return (
    <aside className="hidden lg:flex flex-col justify-between h-screen w-[260px] shrink-0 py-10 px-7">
      <div>
        <div className="text-[11px] tracking-[0.14em] uppercase text-white/25 font-semibold mb-6">
          原播客信息
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase text-white/30 mb-1.5 font-medium">
              标题
            </div>
            <div className="font-[family-name:var(--font-display)] text-[16px] text-white leading-[1.45]">
              {podcast.ytTitle || podcast.title}
            </div>
          </div>

          {/* Published date */}
          {podcast.ytPublished && (
            <div>
              <div className="text-[11px] tracking-[0.08em] uppercase text-white/30 mb-1.5 font-medium">
                发布时间
              </div>
              <div className="text-[15px] text-white/75">
                {formatDate(podcast.ytPublished)}
              </div>
            </div>
          )}

          {/* Views */}
          {podcast.ytViews != null && (
            <div>
              <div className="text-[11px] tracking-[0.08em] uppercase text-white/30 mb-1.5 font-medium">
                播放数
              </div>
              <div className="text-[15px] text-white/75">
                {formatViews(podcast.ytViews)} 次播放
              </div>
            </div>
          )}

          {/* Channel */}
          {podcast.ytChannel && (
            <div>
              <div className="text-[11px] tracking-[0.08em] uppercase text-white/30 mb-1.5 font-medium">
                作者
              </div>
              {podcast.ytChannelUrl ? (
                <a
                  href={podcast.ytChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] text-white/75 no-underline hover:text-white transition-colors"
                >
                  {podcast.ytChannel}
                </a>
              ) : (
                <div className="text-[15px] text-white/75">
                  {podcast.ytChannel}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-8">
          {podcast.youtubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${podcast.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[12px] text-white/45 no-underline px-4 py-2.5 rounded-lg bg-white/[0.06] transition-all duration-200 hover:bg-white/[0.12] hover:text-white"
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              观看原视频
            </a>
          )}
          <a
            href={podcast.feishuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-[12px] text-white/45 no-underline px-4 py-2.5 rounded-lg bg-white/[0.06] transition-all duration-200 hover:bg-white/[0.12] hover:text-white"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            飞书原文
          </a>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[11px] text-white/20 mb-1">Made by</div>
        <a
          href="https://jike.city/pmplanet"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-white/40 no-underline hover:text-white/70 transition-colors"
        >
          空格的键盘
        </a>
      </div>
    </aside>
  );
}
