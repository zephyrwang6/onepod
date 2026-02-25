"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Podcast } from "@/lib/types";

export default function MobileHeader({
  podcasts,
  sidebarBg,
}: {
  podcasts: Podcast[];
  sidebarBg: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl flex items-center gap-3 px-5 py-3.5">
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 flex items-center justify-center text-white cursor-pointer bg-transparent border-none"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="font-[family-name:var(--font-display)] text-base font-semibold text-white">
          Onepod
        </span>
      </header>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-[99] bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`md:hidden fixed top-0 left-0 w-[300px] h-screen z-[100] backdrop-blur-xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: sidebarBg }}
      >
        <div className="px-6 pt-8 pb-5">
          <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold text-white leading-tight">
            Onepod
          </h1>
          <span className="block text-[12px] text-white/35 mt-1.5">
            每日一期，看比听快
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 sidebar-scroll">
          {podcasts.map((p) => {
            const isActive = pathname === `/p/${p.id}`;
            return (
              <Link
                key={p.id}
                href={`/p/${p.id}`}
                onClick={() => setOpen(false)}
                className={`block px-6 py-2.5 no-underline transition-all duration-200 ${
                  isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="text-[11px] text-white/25 tracking-wider font-medium">
                  {p.dateCode}
                </div>
                <div
                  className={`text-[13px] leading-[1.45] line-clamp-2 ${
                    isActive ? "text-white font-medium" : "text-white/45"
                  }`}
                >
                  {p.title}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
