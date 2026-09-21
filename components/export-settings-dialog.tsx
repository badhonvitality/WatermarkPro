"use client";

import { ExportConfig, ImageFileItem, WatermarkConfig } from "@/types/watermark";
import { Settings2, X, Check, Image as ImageIcon, Sliders } from "lucide-react";
import { resolveOutputFilename, resolveTargetMimeType } from "@/lib/watermark/image-processing";

interface ExportSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExportConfig;
  onChange: (config: ExportConfig) => void;
  sampleItem: ImageFileItem | null;
  watermarkConfig: WatermarkConfig;
}

import { resolveVideoOutputFilename } from "@/lib/watermark/video-processing";

export function ExportSettingsDialog({
  isOpen,
  onClose,
  config,
  onChange,
  sampleItem,
  watermarkConfig,
}: ExportSettingsDialogProps) {
  if (!isOpen) return null;

  const isVideo = sampleItem?.mediaType === "video" || sampleItem?.type.startsWith("video/");
  const sampleTargetMime = sampleItem
    ? resolveTargetMimeType(sampleItem.type, config.format)
    : "image/jpeg";
  const sampleOutputName = sampleItem
    ? isVideo
      ? resolveVideoOutputFilename(sampleItem.name, "video/mp4", config.suffix)
      : resolveOutputFilename(sampleItem.name, sampleTargetMime, config.suffix)
    : `example${config.suffix}.jpg`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export & File Settings</h3>
              <p className="text-[11px] text-slate-400">Configure output format, compression and naming</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Format Selector */}
          <div className="space-y-2">
            <label className="font-semibold text-white">Output Image Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Original", val: "original" },
                { label: "JPEG / JPG", val: "image/jpeg" },
                { label: "PNG (Lossless)", val: "image/png" },
                { label: "WEBP", val: "image/webp" },
              ].map((f) => (
                <button
                  key={f.val}
                  type="button"
                  onClick={() => onChange({ ...config, format: f.val as any })}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-medium ${
                    config.format === f.val
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* JPEG / WEBP Quality Slider */}
          {config.format !== "image/png" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Compression Quality
                </label>
                <span className="font-mono text-indigo-400 font-bold">
                  {Math.round(config.quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="1.00"
                step="0.05"
                value={config.quality}
                onChange={(e) => onChange({ ...config, quality: parseFloat(e.target.value) })}
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Smaller size (50%)</span>
                <span>Recommended (90%)</span>
                <span>Maximum (100%)</span>
              </div>
            </div>
          )}

          {/* File Name Suffix */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Filename Suffix</label>
            <input
              type="text"
              value={config.suffix}
              onChange={(e) => onChange({ ...config, suffix: e.target.value })}
              placeholder="-watermarked"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              Appended to the original image name (e.g. photo.jpg → photo{config.suffix}.jpg)
            </p>
          </div>

          {/* Export Summary Box (Requirement #39) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
            <span className="font-semibold text-indigo-300 uppercase tracking-wider text-[10px] block">
              Sample File Output Preview
            </span>
            <div className="grid grid-cols-2 gap-y-1 text-slate-400">
              <span>Original Filename:</span>
              <span className="text-white font-mono truncate">{sampleItem?.name || "building-template.jpg"}</span>

              <span>Output Filename:</span>
              <span className="text-emerald-400 font-mono truncate">{sampleOutputName}</span>

              <span>Dimensions:</span>
              <span className="text-white">
                {sampleItem ? `${sampleItem.dimensions.width} × ${sampleItem.dimensions.height} px (Preserved)` : "1920 × 1080 px (Preserved)"}
              </span>

              <span>Watermark Text:</span>
              <span className="text-white font-medium">{watermarkConfig.text}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow transition"
          >
            Save & Done
          </button>
        </div>
      </div>
    </div>
  );
}
