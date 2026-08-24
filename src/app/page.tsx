import { getAllPodcasts } from "@/lib/podcasts";
import HomeTabs from "@/components/HomeTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const podcasts = await getAllPodcasts();

  return <HomeTabs podcasts={podcasts} />;
}
