"use client";

import { detectPlatform, PLATFORM_CONFIG } from "@/lib/platform-detector";
import { Platform } from "@/lib/types";
import {
  ArrowRight,
  ClipboardPaste,
  Layers,
  Link2,
  Loader2,
  X,
} from "lucide-react";
import React, { useState } from "react";

interface UrlInputFormProps {
  onExtract: (urls: string[]) => Promise<void>;
  isLoading: boolean;
  selectedPlatform?: Platform;
}

export default function UrlInputForm({
  onExtract,
  isLoading,
  selectedPlatform = "tiktok",
}: UrlInputFormProps) {
  const [input, setInput] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);

  const detectedPlatform = detectPlatform(input);
  const activePlatform =
    detectedPlatform !== "unknown" ? detectedPlatform : selectedPlatform;
  const activeMeta = PLATFORM_CONFIG[activePlatform];

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput((prev) => (isBatchMode && prev ? `${prev}\n${text}` : text));
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isBatchMode) {
      const lines = input
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        await onExtract(lines);
      }
    } else {
      await onExtract([input.trim()]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Input Box Card */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative bg-[#111217] border border-neutral-800/90 hover:border-neutral-700/90 focus-within:border-neutral-500 rounded-2xl p-2 sm:p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition duration-300">
          {!isBatchMode ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 flex items-center min-w-0">
                <div className="pl-3.5 pr-2.5 text-neutral-500 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-900 border border-neutral-700 text-neutral-200">
                    {activeMeta.name}
                  </span>
                </div>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeMeta.placeholder}
                  disabled={isLoading}
                  className="w-full bg-transparent text-white placeholder-neutral-500 text-sm py-2.5 pr-16 focus:outline-none"
                  aria-label="Video URL"
                />

                <div className="absolute right-1.5 flex items-center gap-1">
                  {input ? (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded-full hover:bg-neutral-800 transition cursor-pointer"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 rounded-full transition cursor-pointer"
                      title="Paste link from clipboard"
                    >
                      <ClipboardPaste className="w-3 h-3 text-neutral-300" />
                      <span>Paste</span>
                    </button>
                  )}
                </div>
              </div>

              {/* White Pill Action Button */}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm text-black bg-white hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <span>Download</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2 p-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1.5">
                <span>Batch Mode: Paste multiple URLs (one per line)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="inline-flex items-center gap-1 text-neutral-300 hover:text-white"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste</span>
                  </button>
                  {input && (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="text-neutral-400 hover:text-rose-400"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  "https://www.tiktok.com/@creator/video/123456789\nhttps://x.com/user/status/987654321"
                }
                disabled={isLoading}
                className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3 text-white placeholder-neutral-600 text-xs font-mono focus:outline-none focus:border-neutral-700"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full font-medium text-xs text-black bg-white hover:bg-neutral-200 disabled:opacity-40 shadow transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Extract Batch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Sub-bar toggle */}
      <div className="flex items-center justify-between px-2 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>
            {activePlatform === "tiktok"
              ? "Pure 1080p source stream • No watermark burned-in"
              : `Optimized direct stream extraction for ${activeMeta.name}`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsBatchMode((prev) => !prev)}
          className="inline-flex items-center gap-1 hover:text-neutral-300 transition cursor-pointer"
        >
          <Layers className="w-3 h-3" />
          <span>{isBatchMode ? "Single Mode" : "Batch Mode"}</span>
        </button>
      </div>
    </div>
  );
}
