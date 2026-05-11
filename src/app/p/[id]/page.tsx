import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllPodcasts,
  getPodcastById,
  getAdjacentPodcasts,
} from "@/lib/podcasts";
import { getColorForPodcast } from "@/lib/colors";
import Sidebar from "@/components/Sidebar";
import Panel from "@/components/Panel";
import ArticleCard from "@/components/ArticleCard";
import MobileHeader from "@/components/MobileHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const podcast = await getPodcastById(id);
  if (!podcast) return { title: "Not Found" };

  return {
    title: `${podcast.title} — Onepod`,
    description: podcast.intro[0] || "",
    openGraph: {
      title: podcast.title,
      description: podcast.intro[0] || "",
      images: podcast.youtubeId
        ? [
            `https://img.youtube.com/vi/${podcast.youtubeId}/maxresdefault.jpg`,
          ]
        : [],
    },
  };
}

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const podcast = await getPodcastById(id);
  if (!podcast) notFound();

  const podcasts = await getAllPodcasts();
  const podcastIndex = podcasts.findIndex((p) => p.id === id);
  const { next } = await getAdjacentPodcasts(id);
  const color = getColorForPodcast(id, podcastIndex);

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: color.bg }}
    >
      <MobileHeader podcasts={podcasts} sidebarBg={color.sidebar} />
      <Sidebar podcasts={podcasts} sidebarBg={color.sidebar} />

      <main className="flex-1 h-screen overflow-y-auto px-6 py-12 md:px-12 md:py-12 main-scroll pt-[76px] md:pt-12">
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
          <Link
            href="/"
            className="inline-flex h-9 w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 text-[13px] font-medium text-white/80 no-underline backdrop-blur-md transition hover:bg-white/24 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            首页
          </Link>
          <ArticleCard
            podcast={podcast}
            nextPodcast={next}
            bgColor={color.bg}
          />
        </div>
      </main>

      <Panel podcast={podcast} />
    </div>
  );
}
