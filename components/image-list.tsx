"use client";

import { ImageFileItem } from "@/types/watermark";
import { formatFileSize } from "@/lib/utils";
import { Trash2, CheckCircle2, Clock, Loader2, AlertCircle, Plus, Sparkles } from "lucide-react";

interface ImageListProps {
  items: ImageFileItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveAll: () => void;
  onAddMoreClick: () => void;
}

export function ImageList({
  items,
  selectedId,
  onSelect,
  onRemove,
  onRemoveAll,
  onAddMoreClick,
}: ImageListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-slate-800/80 rounded-2xl bg-slate-900/30">
        <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-300 mb-1">No images loaded yet</p>
        <p className="text-xs text-slate-500 mb-4 max-w-xs">
          Upload images using the box above or click below to choose files.
        </p>
        <button
          onClick={onAddMoreClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          Choose Images to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            Images Queue ({items.length})
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {items.filter((i) => i.status === "completed").length} / {items.length} Ready
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddMoreClick}
            type="button"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
            title="Add more images"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Add</span>
          </button>
          <button
            onClick={onRemoveAll}
            type="button"
            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/40 transition cursor-pointer text-xs flex items-center gap-1"
            title="Remove all images"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[calc(100vh-380px)] min-h-[220px]">
        {items.map((item) => {
          const isSelected = item.id === selectedId;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-indigo-500 bg-indigo-950/20 shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                  : "border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Video Indicator */}
                {(item.mediaType === "video" || item.type.startsWith("video/")) && (
                  <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span>VID</span>
                  </div>
                )}
                {/* Status icon overlay */}
                <div className="absolute top-1 right-1">
                  {item.status === "completed" && (
                    <span className="flex w-4 h-4 rounded-full bg-emerald-500 items-center justify-center text-white shadow">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                  {item.status === "processing" && (
                    <span className="flex w-4 h-4 rounded-full bg-indigo-500 items-center justify-center text-white shadow animate-spin">
                      <Loader2 className="w-3 h-3" />
                    </span>
                  )}
                  {item.status === "failed" && (
                    <span className="flex w-4 h-4 rounded-full bg-rose-500 items-center justify-center text-white shadow">
                      <AlertCircle className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span>
                    {item.dimensions.width} × {item.dimensions.height}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(item.size)}</span>
                </div>
                <div className="mt-1">
                  {item.status === "waiting" && (
                    <span className="text-[10px] text-slate-400">Waiting in queue</span>
                  )}
                  {item.status === "processing" && (
                    <span className="text-[10px] text-indigo-400 font-medium animate-pulse">Processing...</span>
                  )}
                  {item.status === "completed" && (
                    <span className="text-[10px] text-emerald-400 font-medium">Ready for export</span>
                  )}
                  {item.status === "failed" && (
                    <span className="text-[10px] text-rose-400 font-medium truncate max-w-full">
                      {item.errorMessage || "Failed"}
                    </span>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
