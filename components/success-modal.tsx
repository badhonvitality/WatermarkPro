"use client";

import { useEffect, useState } from "react";
import { ImageFileItem, ExportConfig, BatchProcessingStats } from "@/types/watermark";
import { downloadBatchAsZip, downloadSingleImage } from "@/lib/watermark/export-zip";
import confetti from "canvas-confetti";
import {
  CheckCircle,
  Download,
  FolderArchive,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  items: ImageFileItem[];
  stats: BatchProcessingStats;
  exportConfig: ExportConfig;
  onClose: () => void;
  onReset: () => void;
}

export function SuccessModal({
  isOpen,
  items,
  stats,
  exportConfig,
  onClose,
  onReset,
}: SuccessModalProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [showIndividual, setShowIndividual] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#a855f7", "#3b82f6", "#10b981"],
        });
      } catch {
        // Safe fallback if canvas-confetti fails
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const completedItems = items.filter((i) => i.status === "completed" && i.resultBlob);
  const duration = stats.durationSeconds ? stats.durationSeconds.toFixed(1) : "0.0";

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipProgress(0);
    try {
      await downloadBatchAsZip(items, exportConfig, "watermarked-images.zip", (percent) => {
        setZipProgress(percent);
      });
    } catch (e) {
      console.error("ZIP download failed", e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Icon & Title */}
        <div className="p-8 text-center bg-gradient-to-b from-indigo-950/40 to-slate-900 border-b border-slate-800/80">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-950/40">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Watermark Complete!</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Your images and videos have been watermarked and are ready for download.
          </p>

          {/* Statistics Box (Requirement #47) */}
          <div className="grid grid-cols-3 gap-3 mt-6 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-[11px]">Processed</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {stats.completed}
              </span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-800">
              <span className="text-slate-400 text-[11px]">Failed</span>
              <span className="text-base font-bold text-slate-300 font-mono">
                {stats.failed}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-[11px]">Time</span>
              <span className="text-base font-bold text-indigo-400 font-mono">
                {duration}s
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          {/* Main Download ZIP Button */}
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping || completedItems.length === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <FolderArchive className="w-5 h-5" />
            <span>
              {isZipping
                ? `Packing ZIP (${zipProgress}%)...`
                : `Download All as ZIP (${completedItems.length} Files)`}
            </span>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowIndividual(!showIndividual)}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <span>Download Individually</span>
              {showIndividual ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Batch</span>
            </button>
          </div>

          {/* Expandable Individual Downloads */}
          {showIndividual && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 text-xs animate-fade-in">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
                Click any image to save individually
              </span>
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
                >
                  <span className="font-mono text-slate-300 truncate max-w-[240px]">
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadSingleImage(item, exportConfig)}
                    className="p-1 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Processed locally in your browser</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
