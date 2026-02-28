"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Podcast } from "@/lib/types";
import QRCode from "qrcode";
import html2canvas from "html2canvas-pro";

function formatParagraph(text: string): string {
  return text
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/(\d+)[、．.]\s*/g, "$1. ")
    .trim();
}

/** Hidden card rendered off-screen, captured by html2canvas */
function ShareCard({
  podcast,
  bgColor,
  qrDataUrl,
  cardRef,
}: {
  podcast: Podcast;
  bgColor: string;
  qrDataUrl: string;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const allLines = podcast.intro
    .filter(
      (t) =>
        !t.includes("YouTube 链接") &&
        !t.includes("youtube.com") &&
        !t.includes("youtu.be")
    )
    .map(formatParagraph)
    .filter(Boolean);
  const introLines = allLines.slice(0, 10);
  const hasMore = allLines.length > introLines.length;

  return (
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: 375,
        backgroundColor: bgColor,
        padding: 28,
        fontFamily:
          '"Noto Serif SC", "Crimson Pro", Georgia, serif',
      }}
    >
      {/* Main card */}
      <div
        style={{
          backgroundColor: "#faf9f7",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Cover image */}
        {podcast.youtubeId ? (
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${podcast.youtubeId}/maxresdefault.jpg`}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: "100%",
                aspectRatio: "16/9",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 500,
                fontFamily:
                  '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                padding: "4px 10px",
                borderRadius: 999,
                letterSpacing: "0.04em",
              }}
            >
              🎙 Issue {podcast.dateCode || "#"}
            </div>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background:
                "linear-gradient(135deg, #2a2f3d 0%, #3a3f4d 50%, #2a2f3d 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}

        {/* Card body */}
        <div style={{ padding: "24px 28px 28px" }}>
          {/* Title */}
          <h2
            style={{
              fontFamily:
                '"Crimson Pro", "Noto Serif SC", serif',
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.35,
              color: "#1a1a1a",
              margin: "0 0 16px 0",
              letterSpacing: "-0.01em",
            }}
          >
            {podcast.title}
          </h2>

          {/* Separator */}
          <div
            style={{
              width: 36,
              height: 1,
              backgroundColor: "#e0e0e0",
              marginBottom: 16,
            }}
          />

          {/* Core points (intro) */}
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.85,
              color: "#4a4a4a",
            }}
          >
            {introLines.map((text, i) => (
              <p key={i} style={{ margin: "0 0 10px 0" }}>
                {text}
              </p>
            ))}
          </div>

          {/* Ellipsis + scan hint */}
          {hasMore && (
            <div
              style={{
                textAlign: "center",
                marginTop: 8,
                fontSize: 12,
                color: "#aaa",
                fontFamily:
                  '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              ···
              <br />
              扫码查看更多内容
            </div>
          )}
        </div>
      </div>

      {/* Footer branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 20,
          padding: "0 4px",
        }}
      >
        {/* Left: logo + tagline */}
        <div>
          <div
            style={{
              fontFamily:
                '"Crimson Pro", "Noto Serif SC", serif',
              fontSize: 22,
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}
          >
            onepod
          </div>
          <div
            style={{
              fontFamily:
                '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.02em",
            }}
          >
            每日精选播客，看比听更快
          </div>
        </div>

        {/* Right: QR code */}
        {qrDataUrl && (
          <div
            style={{
              backgroundColor: "#fff",
              padding: 6,
              borderRadius: 8,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{
                width: 72,
                height: 72,
                display: "block",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Modal showing generated image */
function ShareModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleSave = useCallback(() => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "onepod-share.png";
    a.click();
  }, [imageUrl]);

  const handleCopy = useCallback(async () => {
    try {
      const resp = await fetch(imageUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: open image in new tab
      window.open(imageUrl, "_blank");
    }
  }, [imageUrl]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[340px] w-[90%] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Image preview */}
        <div className="overflow-y-auto rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="分享图片"
            className="w-full block rounded-2xl"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-white/15 text-white text-[13px] font-medium py-3 rounded-xl hover:bg-white/25 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            {copied ? "已复制" : "复制图片"}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-[#1a1a1a] text-[13px] font-medium py-3 rounded-xl hover:bg-white/90 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            保存图片
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShareButton({
  podcast,
  bgColor,
}: {
  podcast: Podcast;
  bgColor: string;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const handleShare = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Generate QR code
      const pageUrl = window.location.href;
      const qr = await QRCode.toDataURL(pageUrl, {
        width: 200,
        margin: 0,
        color: { dark: "#1a1a1a", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(qr);
      setShowCard(true);

      // Wait for render + image loading
      await new Promise((r) => setTimeout(r, 500));

      // Wait for cover image to load
      if (cardRef.current) {
        const imgs = cardRef.current.querySelectorAll("img");
        await Promise.all(
          Array.from(imgs).map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete) return resolve();
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
          )
        );
      }

      // Capture
      if (!cardRef.current) throw new Error("Card ref not found");

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: bgColor,
        logging: false,
      });

      const url = canvas.toDataURL("image/png");
      setImageUrl(url);
    } catch (err) {
      console.error("Share image generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [podcast, bgColor, loading]);

  const handleClose = useCallback(() => {
    setImageUrl(null);
    setShowCard(false);
    setQrDataUrl("");
  }, []);

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading}
        className="text-[#bbb] hover:text-[#333] transition-colors disabled:opacity-40"
        title="生成分享图片"
      >
        {loading ? (
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              strokeDasharray="60"
              strokeDashoffset="20"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
      </button>

      {/* Portal: hidden share card for rendering (escapes transform context) */}
      {mounted && showCard &&
        createPortal(
          <ShareCard
            podcast={podcast}
            bgColor={bgColor}
            qrDataUrl={qrDataUrl}
            cardRef={cardRef}
          />,
          document.body
        )}

      {/* Portal: image preview modal (escapes transform context) */}
      {mounted && imageUrl &&
        createPortal(
          <ShareModal imageUrl={imageUrl} onClose={handleClose} />,
          document.body
        )}
    </>
  );
}
