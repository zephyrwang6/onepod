import { getAllPodcasts } from "@/lib/podcasts";
import HomeTabs from "@/components/HomeTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const podcasts = await getAllPodcasts();
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

  return <HomeTabs podcasts={homePodcasts} />;
}
