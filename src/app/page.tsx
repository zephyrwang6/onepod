import { getAllPodcasts } from "@/lib/podcasts";
import HomePodcastCard from "@/components/HomePodcastCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const podcasts = await getAllPodcasts();

  return (
    <main className="min-h-screen bg-[#e9ece8] px-3 py-5 text-[#20251f] sm:px-5 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1680px]">
        <header className="mb-5 flex items-end justify-between gap-5 px-1 sm:mb-7 md:mb-9">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[34px] font-semibold leading-none tracking-normal text-[#20251f] md:text-[48px]">
              Onepod
            </h1>
            <p className="mt-2 text-[13px] text-[#62705f] md:text-[14px]">
              每日精选海外科技播客
            </p>
          </div>
          <div className="hidden text-right text-[12px] uppercase tracking-[0.12em] text-[#7d887c] sm:block">
            {podcasts.length} episodes
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
