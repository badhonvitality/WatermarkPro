"use client";

import { useEffect, useRef, useState, useCallback, ChangeEvent } from "react";
import { ImageFileItem, WatermarkConfig } from "@/types/watermark";
import { renderWatermark } from "@/lib/watermark/renderer";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Split,
  Eye,
  Sliders,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";

interface PreviewCanvasProps {
  activeItem: ImageFileItem | null;
  watermarkConfig: WatermarkConfig;
  allCount: number;
  activeIndex: number;
  onNavigate: (direction: "prev" | "next") => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function PreviewCanvas({
  activeItem,
  watermarkConfig,
  allCount,
  activeIndex,
  onNavigate,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // View & Zoom State
  const [zoomMode, setZoomMode] = useState<"fit" | "actual" | "custom">("fit");
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"watermarked" | "split" | "original">("watermarked");
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage 0 - 100
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Keep a ref to the latest render callback to avoid stale closures in events/loops
  const renderSourceFrameRef = useRef<Function>(() => {});

  // Video playback state
  const isVideo = activeItem?.mediaType === "video" || activeItem?.type.startsWith("video/");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(activeItem?.duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Stop video loop on unmount or item change
  const stopVideoLoop = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  };

  // Render a single frame (from image or video) to canvas
  const renderSourceFrame = useCallback(
    (source: HTMLImageElement | HTMLVideoElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const width = (source as any).naturalWidth || (source as any).videoWidth || (source as any).width || 1280;
      const height = (source as any).naturalHeight || (source as any).videoHeight || (source as any).height || 720;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (viewMode === "original") {
        ctx.drawImage(source as any, 0, 0, width, height);
      } else if (viewMode === "watermarked") {
        renderWatermark(source, watermarkConfig, canvas);
      } else if (viewMode === "split") {
        // Split view: Left = Original, Right = Watermarked
        const offCanvas = document.createElement("canvas");
        renderWatermark(source, watermarkConfig, offCanvas);

        ctx.drawImage(source as any, 0, 0, width, height);

        const splitPx = (width * splitPosition) / 100;
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitPx, 0, width - splitPx, height);
        ctx.clip();
        ctx.drawImage(offCanvas, 0, 0);
        ctx.restore();

        // Split dividing line
        ctx.save();
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = Math.max(3, Math.round(width * 0.003));
        ctx.beginPath();
        ctx.moveTo(splitPx, 0);
        ctx.lineTo(splitPx, height);
        ctx.stroke();
        ctx.restore();
      }
    },
    [watermarkConfig, viewMode, splitPosition]
  );

  // Update ref whenever renderSourceFrame changes
  useEffect(() => {
    renderSourceFrameRef.current = renderSourceFrame;
  }, [renderSourceFrame]);

  // Video continuous animation loop
  const runVideoLoop = useCallback(() => {
    const video = videoElementRef.current;
    if (!video || video.paused || video.ended) {
      setIsPlaying(false);
      return;
    }

    renderSourceFrameRef.current(video);
    setCurrentTime(video.currentTime);
    animFrameIdRef.current = requestAnimationFrame(runVideoLoop);
  }, []);

  // Load image or video when activeItem changes
  useEffect(() => {
    stopVideoLoop();
    setIsPlaying(false);
    setCurrentTime(0);

    if (!activeItem) {
      imageElementRef.current = null;
      videoElementRef.current = null;
      return;
    }

    if (isVideo) {
      imageElementRef.current = null;
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = isMuted;
      video.playsInline = true;
      video.preload = "auto";
      video.src = activeItem.videoUrl || activeItem.previewUrl;
      videoElementRef.current = video;

      video.onloadedmetadata = () => {
        setDuration(video.duration || activeItem.duration || 0);
        video.currentTime = 0;
      };

      video.onseeked = () => {
        renderSourceFrameRef.current(video);
      };

      video.onended = () => {
        setIsPlaying(false);
        stopVideoLoop();
      };
    } else {
      videoElementRef.current = null;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = activeItem.previewUrl;
      img.onload = () => {
        imageElementRef.current = img;
        renderSourceFrameRef.current(img);
      };
    }

    return () => {
      stopVideoLoop();
    };
  }, [activeItem?.id, activeItem?.previewUrl, activeItem?.videoUrl, isVideo]);

  // Re-render frame whenever config, viewMode or splitPosition changes
  useEffect(() => {
    if (isVideo && videoElementRef.current) {
      if (!isPlaying) {
        renderSourceFrame(videoElementRef.current);
      }
    } else if (!isVideo && imageElementRef.current) {
      renderSourceFrame(imageElementRef.current);
    }
  }, [watermarkConfig, viewMode, splitPosition, isVideo, isPlaying, renderSourceFrame]);

  // Video playback controls
  const handleTogglePlay = () => {
    const video = videoElementRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      stopVideoLoop();
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        runVideoLoop();
      }).catch((err) => {
        console.warn("Video play interrupted", err);
      });
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const video = videoElementRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    renderSourceFrame(video);
  };

  const handleToggleMute = () => {
    const video = videoElementRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Adjust canvas visual scaling inside container
  const computeFitScale = useCallback(() => {
    if (!containerRef.current || !activeItem) return 1;
    const containerW = containerRef.current.clientWidth - 40;
    const containerH = containerRef.current.clientHeight - (isVideo ? 80 : 40);
    const imgW = activeItem.dimensions.width || 1280;
    const imgH = activeItem.dimensions.height || 720;

    const scaleX = containerW / imgW;
    const scaleY = containerH / imgH;
    return Math.min(scaleX, scaleY, 1);
  }, [activeItem, isVideo]);

  useEffect(() => {
    if (zoomMode === "fit") {
      setZoomScale(computeFitScale());
    } else if (zoomMode === "actual") {
      setZoomScale(1);
    }
  }, [zoomMode, activeItem, computeFitScale]);

  // Handle split slider drag
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || viewMode !== "split" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPosition(percent);
  };

  if (!activeItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80 min-h-[450px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-800/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-950/50">
          <Eye className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Live Watermark Preview</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          Upload your images or videos to configure diagonal copyright watermarks in real-time.
        </p>
        <button
          onClick={() => {
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            input?.click();
          }}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer hover:scale-105"
        >
          <Eye className="w-4 h-4" />
          Choose Media to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Top Preview Controls Bar */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View mode toggles */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode("watermarked")}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === "watermarked"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Watermarked
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === "split"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Split screen slider: Drag to compare original and watermarked"
          >
            <Split className="w-3.5 h-3.5" />
            Before / After
          </button>
          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              viewMode === "original"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Original
          </button>
        </div>

        {/* Center: Media Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activeIndex <= 0}
            onClick={() => onNavigate("prev")}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Previous (Left arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-300 font-mono font-medium">
            {activeIndex + 1} / {allCount}
          </span>
          <button
            type="button"
            disabled={activeIndex >= allCount - 1}
            onClick={() => onNavigate("next")}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Next (Right arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setZoomMode("fit");
              setZoomScale(computeFitScale());
            }}
            className={`px-2 py-1 rounded-lg font-medium border transition cursor-pointer flex items-center gap-1 ${
              zoomMode === "fit"
                ? "bg-slate-800 border-indigo-500/50 text-indigo-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Fit to Screen"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Fit
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomMode("actual");
              setZoomScale(1);
            }}
            className={`px-2 py-1 rounded-lg font-medium border transition cursor-pointer flex items-center gap-1 ${
              zoomMode === "actual"
                ? "bg-slate-800 border-indigo-500/50 text-indigo-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="100% Native Resolution"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            100%
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomMode("custom");
              setZoomScale((s) => Math.max(0.1, s - 0.15));
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-400 w-12 text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => {
              setZoomMode("custom");
              setZoomScale((s) => Math.min(3, s + 0.15));
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseMove={handleSplitMouseMove}
        onMouseUp={() => setIsDraggingSplit(false)}
        onMouseLeave={() => setIsDraggingSplit(false)}
        className="relative flex-1 overflow-auto flex items-center justify-center p-4 canvas-checkerboard select-none min-h-[360px]"
      >
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: "center center",
            transition: zoomMode !== "custom" ? "transform 0.15s ease-out" : "none",
          }}
          className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800/80"
        >
          <canvas ref={canvasRef} className="max-w-none block" />

          {/* Split Slider Draggable Divider Line & Badge */}
          {viewMode === "split" && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingSplit(true);
              }}
              style={{ left: `${splitPosition}%` }}
              className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-20 group"
            >
              <div className="w-1 h-full bg-indigo-500 shadow-md group-hover:bg-indigo-400 transition-colors" />
              <div className="absolute w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-white/80 group-hover:scale-110 transition-transform">
                <Sliders className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Before / After labels when split mode is active */}
        {viewMode === "split" && (
          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10">
            <span className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-semibold shadow border border-white/10">
              Original
            </span>
            <span className="px-3 py-1 rounded-lg bg-indigo-600/90 backdrop-blur-md text-white text-xs font-semibold shadow border border-indigo-400/30">
              Watermarked
            </span>
          </div>
        )}
      </div>

      {/* Video Playback Bar (If video media) */}
      {isVideo && (
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-md flex items-center justify-center"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <span className="font-mono text-slate-300 text-[11px] w-24">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1"
          />

          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      )}

      {/* Bottom Metadata Status Bar */}
      <div className="px-4 py-2 bg-slate-900/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3 truncate">
          <span className="font-semibold text-slate-300 truncate max-w-xs">{activeItem.name}</span>
          <span>•</span>
          <span>
            {activeItem.dimensions.width} × {activeItem.dimensions.height} px
          </span>
          <span>•</span>
          <span className="uppercase font-semibold text-indigo-400">
            {isVideo ? "VIDEO" : activeItem.type.replace("image/", "")}
          </span>
          {isVideo && duration > 0 && <span>({formatTime(duration)})</span>}
        </div>

        <div className="flex items-center gap-2">
          {isRendering && <span className="text-indigo-400 animate-pulse">Rendering...</span>}
          <span className="text-slate-400 hidden sm:inline">
            Watermark: <strong className="text-white">{watermarkConfig.text}</strong> ({watermarkConfig.angle}°, {Math.round(watermarkConfig.opacity * 100)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
