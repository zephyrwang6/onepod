"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const browser = globalThis as unknown as {
        location: { href: string };
        navigator: { clipboard: { writeText: (text: string) => Promise<void> } };
        setTimeout: (handler: () => void, timeout: number) => number;
      };
      await browser.navigator.clipboard.writeText(browser.location.href);
      setCopied(true);
      browser.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      console.error("Copy link failed:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[#bbb] transition-colors hover:text-[#333]"
      title={copied ? "链接已复制" : "复制分享链接"}
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
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </button>
  );
}
