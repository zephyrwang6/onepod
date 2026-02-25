"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Podcast } from "@/lib/types";

function parseTitleAndGuest(title: string): {
  displayTitle: string;
  guest: string;
} {
  const cleaned = title.replace(/^\d{4}/, "").trim();

  let guest = "";
  let articleTitle = "";

  // Pattern 1: "Guest X Platform：ArticleTitle" or "Guest × Platform：ArticleTitle"
  const xMatch = cleaned.match(/^(.+?)\s+[X×]\s+(.+)$/);
  if (xMatch) {
    guest = xMatch[1].trim();
    const afterX = xMatch[2].trim();
    const colonMatch = afterX.match(/^.+?[：:]\s*(.+)$/);
    if (colonMatch) {
      articleTitle = colonMatch[1].trim();
    } else {
      articleTitle = afterX;
    }
  }
  // Pattern 2: "Guest 访谈：ArticleTitle" or "xxxxx：ArticleTitle"
  else {
    const colonMatch = cleaned.match(/^(.+?)\s*[：:]\s*(.+)$/);
    if (colonMatch) {
      const before = colonMatch[1].trim();
      articleTitle = colonMatch[2].trim();
      const visitMatch = before.match(/^(.+?)\s*访谈$/);
      if (visitMatch) {
        guest = visitMatch[1].trim();
      }
    }
    // Pattern 3: "xxx 的 Person 访谈" (no colon)
    else {
      const deMatch = cleaned.match(/的\s*(.+?)\s*访谈$/);
      if (deMatch) {
        guest = deMatch[1].trim();
      }
      articleTitle = cleaned;
    }
  }

  articleTitle = articleTitle.replace(/\s*\|.*$/, "").trim();

  return {
    displayTitle: articleTitle || cleaned,
    guest,
  };
}

export default function Sidebar({
  podcasts,
  sidebarBg,
}: {
  podcasts: Podcast[];
  sidebarBg: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col h-screen w-[280px] shrink-0"
      style={{ background: sidebarBg }}
    >
      <div className="px-7 pt-9 pb-6 shrink-0">
        <Link href="/" className="block no-underline">
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold text-white leading-[1.1] tracking-[-0.02em]">
            Onepod
          </h1>
          <span className="block text-[12px] text-white/35 mt-2 leading-[1.5] font-[family-name:var(--font-ui)]">
            每日一期，看比听快
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 sidebar-scroll">
        {podcasts.map((p) => {
          const isActive = pathname === `/p/${p.id}`;
          const { displayTitle, guest } = parseTitleAndGuest(p.title);
          return (
            <Link
              key={p.id}
              href={`/p/${p.id}`}
              className={`group block px-7 py-2.5 no-underline transition-all duration-200 ${
                isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
              }`}
            >
              <div
                className={`text-[14.5px] leading-[1.45] line-clamp-2 transition-colors duration-200 ${
                  isActive
                    ? "text-white font-medium"
                    : "text-white/50 group-hover:text-white/80"
                }`}
              >
                {displayTitle}
                {guest && (
                  <span className={`text-[12.5px] ${isActive ? "text-white/40" : "text-white/25"}`}>
                    {" "}({guest})
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-7 py-5 shrink-0">
        <div className="text-[11px] text-white/20 tracking-wide">
          {podcasts.length} episodes
        </div>
      </div>
    </aside>
  );
}
