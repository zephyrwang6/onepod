import { redirect } from "next/navigation";
import { getAllPodcasts } from "@/lib/podcasts";

export default function Home() {
  const podcasts = getAllPodcasts();
  if (podcasts.length > 0) {
    redirect(`/p/${podcasts[0].id}`);
  }
  return null;
}
