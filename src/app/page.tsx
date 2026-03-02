import { redirect } from "next/navigation";
import { getAllPodcasts } from "@/lib/podcasts";

// Force dynamic rendering to fetch real-time data from Feishu
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const podcasts = await getAllPodcasts();
  if (podcasts.length > 0) {
    redirect(`/p/${podcasts[0].id}`);
  }
  return null;
}
