import { notFound } from "next/navigation";
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

// Force dynamic rendering to fetch real-time data from Feishu
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

      <main className="flex-1 h-screen overflow-y-auto flex justify-center px-6 py-12 md:px-12 md:py-12 main-scroll pt-[76px] md:pt-12">
        <ArticleCard podcast={podcast} nextPodcast={next} bgColor={color.bg} />
      </main>

      <Panel podcast={podcast} />
    </div>
  );
}
