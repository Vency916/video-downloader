"use client";

import { PLATFORM_CONFIG } from "@/lib/platform-detector";
import { MediaResult } from "@/lib/types";
import { Clock, RotateCcw, Trash2 } from "lucide-react";
import React from "react";

interface DownloadHistoryProps {
  history: MediaResult[];
  onSelectResult: (item: MediaResult) => void;
  onClearHistory: () => void;
}

export default function DownloadHistory({
  history,
  onSelectResult,
  onClearHistory,
}: DownloadHistoryProps) {
  if (history.length === 0) return null;

  return (
    <section className="w-full max-w-3xl mx-auto space-y-3 pt-6">
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Recent Downloads ({history.length})</span>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-rose-400 transition cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {history.map((item) => {
          const meta = PLATFORM_CONFIG[item.platform];
          return (
            <button
              key={`${item.platform}-${item.id}`}
              type="button"
              onClick={() => onSelectResult(item)}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0e0f14] hover:bg-[#15161d] border border-neutral-800/80 hover:border-neutral-700 text-left transition duration-200 group cursor-pointer"
            >
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-11 h-13 rounded-lg object-cover bg-black shrink-0 border border-neutral-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-13 rounded-lg bg-neutral-900 shrink-0 border border-neutral-800" />
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-300">
                    {meta.name}
                  </span>
                  <span className="text-[11px] text-neutral-500 truncate">
                    {item.author.handle}
                  </span>
                </div>
                <p className="text-xs font-normal text-neutral-200 truncate group-hover:text-white transition">
                  {item.title}
                </p>
              </div>

              <RotateCcw className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300 shrink-0 mr-1 transition" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
