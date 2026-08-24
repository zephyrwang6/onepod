"use client";

import Link from "next/link";
import HomePodcastCard from "@/components/HomePodcastCard";
import type { Podcast } from "@/lib/types";

export default function HomeTabs({
  podcasts,
}: {
  podcasts: Podcast[];
}) {
  return (
    <main
      className="min-h-screen px-3 py-5 text-[#20251f] transition-colors duration-700 sm:px-5 md:px-8 lg:px-12"
      style={{ backgroundColor: "#e9ece8" }}
    >
      <div className="mx-auto max-w-[1680px]">
        <header className="mb-5 flex flex-col gap-5 px-1 sm:mb-7 md:mb-9 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[34px] font-semibold leading-none tracking-normal text-[#20251f] md:text-[48px]">
              Onepod
            </h1>
            <p className="mt-2 text-[13px] text-[#62705f] md:text-[14px]">
              每日精选海外科技播客
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <Link
              href="/sources"
              className="order-2 w-fit text-[13px] font-semibold text-[#7d887c] no-underline transition hover:text-[#20251f] sm:order-none"
            >
              信源
            </Link>

            <div className="hidden text-right text-[12px] uppercase tracking-[0.12em] text-[#7d887c] sm:block">
              {podcasts.length} episodes
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
          {podcasts.map((podcast) => (
            <HomePodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </section>
      </div>
    </main>
  );
}
