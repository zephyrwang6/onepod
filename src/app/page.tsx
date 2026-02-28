import { redirect } from "next/navigation";
import { getAllPodcasts } from "@/lib/podcasts";

export const revalidate = 300; // 5 minutes

export default async function Home() {
  const podcasts = await getAllPodcasts();
  if (podcasts.length > 0) {
    redirect(`/p/${podcasts[0].id}`);
  }
  return null;
}
