"use client";

import { useEffect, useRef, useState } from "react";
import { ImageFileItem } from "@/types/watermark";
import { Loader2, CheckCircle2, Clock, AlertCircle, Terminal, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

export interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: "info" | "success" | "warn" | "error";
}

interface ProcessingQueueModalProps {
  isOpen: boolean;
  items: ImageFileItem[];
  currentIndex: number;
  total: number;
  logs: LogEntry[];
  onCancel: () => void;
}

export function ProcessingQueueModal({
  isOpen,
  items,
  currentIndex,
  total,
  logs,
  onCancel,
}: ProcessingQueueModalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showConsole, setShowConsole] = useState(true);

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (showConsole && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showConsole]);

  if (!isOpen) return null;

  const completedCount = items.filter((i) => i.status === "completed").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const processedCount = completedCount + failedCount;
  const progressPercent = total > 0 ? Math.round((processedCount / total) * 100) : 0;

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.time}] ${l.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Applying Bulk Watermark
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Processing
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Processing {processedCount} of {total} files locally on your device
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-indigo-400 px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-800/60 shadow-inner">
            {progressPercent}%
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div className="px-6 pt-5 pb-2 bg-slate-900/80">
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-300 shadow-lg"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
            <span>
              <strong className="text-emerald-400 font-semibold">{completedCount}</strong> Completed{" "}
              {failedCount > 0 && (
                <>
                  • <strong className="text-rose-400 font-semibold">{failedCount}</strong> Failed
                </>
              )}
            </span>
            <span>{total - processedCount} Remaining</span>
          </div>
        </div>

        {/* Media Queue List */}
        <div className="px-6 py-3 max-h-40 overflow-y-auto space-y-1.5 border-b border-slate-800/80 bg-slate-950/40">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                item.status === "processing"
                  ? "bg-indigo-950/30 border-indigo-500/50 shadow-sm"
                  : "bg-slate-950/40 border-slate-800/70"
              }`}
            >
              <div className="flex items-center gap-2 truncate max-w-[340px]">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                  {item.mediaType === "video" || item.type.startsWith("video/") ? "VIDEO" : "IMG"}
                </span>
                <span className="font-mono text-slate-200 truncate">{item.name}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.status === "completed" && (
                  <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Done
                  </span>
                )}
                {item.status === "processing" && (
                  <span className="flex items-center gap-1.5 text-indigo-300 text-[11px] font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    Processing
                  </span>
                )}
                {item.status === "waiting" && (
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    Queued
                  </span>
                )}
                {item.status === "failed" && (
                  <span className="flex items-center gap-1 text-rose-400 text-[11px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Failed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ================= LIVE CONSOLE TERMINAL OUTPUT (User Request) ================= */}
        <div className="flex-1 flex flex-col bg-black border-t border-slate-800 overflow-hidden min-h-[160px] max-h-[220px]">
          {/* Console Header Bar */}
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-semibold text-slate-300 text-[11px]">
                Live Processing Console
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                {logs.length} events
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyLogs}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[10px] flex items-center gap-1 font-mono"
                title="Copy all console output to clipboard"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConsole(!showConsole)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title={showConsole ? "Collapse console" : "Expand console"}
              >
                {showConsole ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Console Screen Box */}
          {showConsole && (
            <div className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-1 bg-black/95 text-slate-300 select-text leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">Waiting for engine output...</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 break-all">
                    <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                    <span
                      className={
                        log.type === "success"
                          ? "text-emerald-400 font-semibold"
                          : log.type === "error"
                          ? "text-rose-400 font-semibold"
                          : log.type === "warn"
                          ? "text-amber-300"
                          : "text-slate-200"
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Status: {progressPercent < 100 ? "Processing batch in real-time" : "Batch complete"}
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Cancel Batch
          </button>
        </div>
      </div>
    </div>
  );
}
