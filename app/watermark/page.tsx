"use client";

import { useState } from "react";
import {
  ImageFileItem,
  WatermarkConfig,
  ExportConfig,
  BatchProcessingStats,
} from "@/types/watermark";
import { DEFAULT_WATERMARK_CONFIG } from "@/lib/watermark/presets";
import { processBatchQueue } from "@/lib/watermark/image-processing";
import { downloadBatchAsZip } from "@/lib/watermark/export-zip";

import { Navbar } from "@/components/navbar";
import { Uploader } from "@/components/uploader";
import { ImageList } from "@/components/image-list";
import { PreviewCanvas } from "@/components/preview-canvas";
import { WatermarkSettings } from "@/components/watermark-settings";
import { ExportSettingsDialog } from "@/components/export-settings-dialog";
import { ProcessingQueueModal, LogEntry } from "@/components/processing-queue-modal";
import { SuccessModal } from "@/components/success-modal";

import {
  Layers,
  Settings2,
  Play,
  Download,
  ShieldCheck,
} from "lucide-react";

const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: "original",
  quality: 0.90,
  suffix: "-watermarked",
};

export default function WatermarkStudioPage() {
  // Images state
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Configuration state
  const [watermarkConfig, setWatermarkConfig] =
    useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG);
  const [exportConfig, setExportConfig] =
    useState<ExportConfig>(DEFAULT_EXPORT_CONFIG);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProcessIndex, setCurrentProcessIndex] = useState<number>(0);
  const [processLogs, setProcessLogs] = useState<LogEntry[]>([]);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [batchStats, setBatchStats] = useState<BatchProcessingStats>({
    total: 0,
    completed: 0,
    failed: 0,
    startTime: 0,
  });

  // Mobile active tab view
  const [mobileTab, setMobileTab] = useState<"images" | "preview" | "settings">("preview");

  // Handler for adding images
  const handleAddImages = (newItems: ImageFileItem[]) => {
    setImages((prev) => {
      const updated = [...prev, ...newItems];
      if (!selectedImageId && updated.length > 0) {
        setSelectedImageId(updated[0].id);
      }
      return updated;
    });
    setMobileTab("preview");
  };

  // Handler for removing single image
  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
      }
      const filtered = prev.filter((i) => i.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  // Handler for removing all images
  const handleRemoveAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
    });
    setImages([]);
    setSelectedImageId(null);
  };

  // Navigation across images in batch
  const handleNavigate = (direction: "prev" | "next") => {
    if (images.length === 0) return;
    const currentIndex = images.findIndex((i) => i.id === selectedImageId);
    if (direction === "prev" && currentIndex > 0) {
      setSelectedImageId(images[currentIndex - 1].id);
    } else if (direction === "next" && currentIndex < images.length - 1) {
      setSelectedImageId(images[currentIndex + 1].id);
    }
  };

  // Run bulk batch watermarking
  const handleApplyWatermark = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setCurrentProcessIndex(0);
    setProcessLogs([]);
    const startTime = Date.now();

    const addLog = (text: string, type: "info" | "success" | "warn" | "error" = "info") => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setProcessLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          time: timeStr,
          text,
          type,
        },
      ]);
    };

    addLog(`🚀 Initiating batch watermarking for ${images.length} files...`, "info");
    const hasVideos = images.some((i) => i.mediaType === "video" || i.type.startsWith("video/"));
    if (hasVideos) {
      addLog(`📹 Video items detected! Using high-precision sequential canvas stream recorder...`, "info");
    }

    try {
      const updatedItems = await processBatchQueue(
        images,
        watermarkConfig,
        exportConfig,
        3, // Controlled concurrency of 3 workers (sequential for videos)
        (item, index) => {
          setCurrentProcessIndex(index);
          setImages([...images]);
        },
        addLog
      );

      const endTime = Date.now();
      const completed = updatedItems.filter((i) => i.status === "completed").length;
      const failed = updatedItems.filter((i) => i.status === "failed").length;

      setImages([...updatedItems]);
      setBatchStats({
        total: updatedItems.length,
        completed,
        failed,
        startTime,
        endTime,
        durationSeconds: (endTime - startTime) / 1000,
      });

      addLog(`✅ Batch process completed! ${completed} succeeded, ${failed} failed.`, completed > 0 ? "success" : "warn");
      setIsProcessing(false);
      setShowSuccessModal(true);
    } catch (e: any) {
      console.error("Batch processing error", e);
      addLog(`❌ Batch processing error: ${e?.message || e}`, "error");
      setIsProcessing(false);
    }
  };

  const activeItem = images.find((i) => i.id === selectedImageId) || (images.length > 0 ? images[0] : null);
  const activeIndex = images.findIndex((i) => i.id === activeItem?.id);
  const completedCount = images.filter((i) => i.status === "completed").length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      {/* Main Studio Container */}
      <main className="flex-1 flex flex-col max-w-[1720px] w-full mx-auto p-2 sm:p-4 lg:p-6 gap-4">
        {/* Top Studio Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Watermark Studio
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Client-Side Engine
            </span>
          </div>

          {/* Mobile View Switcher */}
          <div className="flex lg:hidden items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMobileTab("images")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                mobileTab === "images" ? "bg-indigo-600 text-white" : "text-slate-400"
              }`}
            >
              Images ({images.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                mobileTab === "preview" ? "bg-indigo-600 text-white" : "text-slate-400"
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("settings")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                mobileTab === "settings" ? "bg-indigo-600 text-white" : "text-slate-400"
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* 3-Column Studio Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[580px]">
          {/* ================= LEFT COLUMN: IMAGES & UPLOAD (3 COLS) ================= */}
          <section
            className={`lg:col-span-3 flex flex-col gap-3 ${
              mobileTab === "images" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-lg">
              <Uploader onImagesAdded={handleAddImages} compact />
            </div>

            <div className="flex-1 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col">
              <ImageList
                items={images}
                selectedId={activeItem?.id || null}
                onSelect={(id) => {
                  setSelectedImageId(id);
                  setMobileTab("preview");
                }}
                onRemove={handleRemoveImage}
                onRemoveAll={handleRemoveAll}
                onAddMoreClick={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  input?.click();
                }}
              />
            </div>
          </section>

          {/* ================= CENTER COLUMN: LIVE PREVIEW CANVAS (6 COLS) ================= */}
          <section
            className={`lg:col-span-6 flex flex-col min-h-[460px] ${
              mobileTab === "preview" ? "flex" : "hidden lg:flex"
            }`}
          >
            <PreviewCanvas
              activeItem={activeItem}
              watermarkConfig={watermarkConfig}
              allCount={images.length}
              activeIndex={activeIndex !== -1 ? activeIndex : 0}
              onNavigate={handleNavigate}
            />
          </section>

          {/* ================= RIGHT COLUMN: WATERMARK SETTINGS (3 COLS) ================= */}
          <section
            className={`lg:col-span-3 flex flex-col ${
              mobileTab === "settings" ? "flex" : "hidden lg:flex"
            }`}
          >
            <WatermarkSettings config={watermarkConfig} onChange={setWatermarkConfig} />
          </section>
        </div>

        {/* ================= BOTTOM BAR: BATCH PROCESSING CONTROLS ================= */}
        <div className="sticky bottom-2 z-30 p-3 sm:p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          {/* Left summary & Export format config */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-white">
                {images.length === 0
                  ? "No media selected"
                  : `${images.length} ${images.length === 1 ? "File" : "Files"} Ready`}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>
                  Export as: <strong className="text-slate-200 uppercase">{exportConfig.format}</strong>
                </span>
                {exportConfig.format !== "image/png" && (
                  <span>({Math.round(exportConfig.quality * 100)}% quality)</span>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs flex items-center gap-1.5"
              title="Configure export format and quality"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Export Settings</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <button
                type="button"
                onClick={() => downloadBatchAsZip(images, exportConfig)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2 border border-slate-700"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download ZIP ({completedCount})</span>
              </button>
            )}

            <button
              type="button"
              disabled={images.length === 0 || isProcessing}
              onClick={handleApplyWatermark}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {isProcessing
                  ? "Processing..."
                  : `Apply Watermark (${images.length})`}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ExportSettingsDialog
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        config={exportConfig}
        onChange={setExportConfig}
        sampleItem={activeItem}
        watermarkConfig={watermarkConfig}
      />

      <ProcessingQueueModal
        isOpen={isProcessing}
        items={images}
        currentIndex={currentProcessIndex}
        total={images.length}
        logs={processLogs}
        onCancel={() => setIsProcessing(false)}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        items={images}
        stats={batchStats}
        exportConfig={exportConfig}
        onClose={() => setShowSuccessModal(false)}
        onReset={() => {
          setShowSuccessModal(false);
          handleRemoveAll();
        }}
      />
    </div>
  );
}
