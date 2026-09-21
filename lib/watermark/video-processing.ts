import { ExportConfig, ImageFileItem, WatermarkConfig } from "@/types/watermark";
import { renderWatermark } from "./renderer";
import { sanitizeFilename } from "@/lib/utils";

/**
 * Detects the best supported recording video format
 */
export function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";

  const candidates = [
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "video/webm";
}

/**
 * Resolves output filename for video with suffix
 */
export function resolveVideoOutputFilename(
  originalName: string,
  targetMime: string,
  suffix: string
): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
  const safeBase = sanitizeFilename(base);

  const ext = targetMime.includes("mp4") ? ".mp4" : ".webm";
  return `${safeBase}${suffix}${ext}`;
}

/**
 * Processes a single video file client-side by playing frames + watermark to canvas
 * and encoding through MediaRecorder in real-time.
 */
export function processSingleVideo(
  item: ImageFileItem,
  watermarkConfig: WatermarkConfig,
  exportConfig: ExportConfig,
  onProgress?: (percent: number) => void,
  onLog?: (msg: string, type?: "info" | "success" | "warn" | "error") => void
): Promise<{ blob: Blob; width: number; height: number; filename: string }> {
  return new Promise((resolve, reject) => {
    onLog?.(`[Video] Loading "${item.name}" into media decoder...`, "info");

    const video = document.createElement("video");
    const videoUrl = item.videoUrl || URL.createObjectURL(item.file);
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";

    // Attach off-screen to DOM so browser video decoders never suspend background playback
    video.style.position = "fixed";
    video.style.left = "-9999px";
    video.style.top = "-9999px";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      try {
        video.pause();
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        if (!item.videoUrl) URL.revokeObjectURL(videoUrl);
      } catch {
        // Safe cleanup
      }
    };

    // Safety timeout: fail gracefully if video hangs for over 90 seconds
    const safetyTimeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Video encoding timed out for "${item.name}"`));
    }, 120000);

    video.onloadedmetadata = async () => {
      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        const duration = video.duration || 1;

        onLog?.(`[Video] Metadata ready: ${width}×${height}px, ${duration.toFixed(1)}s duration.`, "info");

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        // Capture canvas stream at 30 FPS
        const stream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream(30);

        // Try preserving original audio track
        try {
          let audioTracks: MediaStreamTrack[] = [];
          if ((video as any).captureStream) {
            audioTracks = (video as any).captureStream().getAudioTracks();
          } else if ((video as any).mozCaptureStream) {
            audioTracks = (video as any).mozCaptureStream().getAudioTracks();
          }
          audioTracks.forEach((track) => stream.addTrack(track));
          if (audioTracks.length > 0) {
            onLog?.(`[Video] Preserving audio track (${audioTracks.length} track)`, "info");
          }
        } catch {
          // Audio extraction fallback
        }

        const targetMime = getSupportedVideoMimeType();
        onLog?.(`[Video] Initializing MediaRecorder with format: ${targetMime}...`, "info");

        const recorder = new MediaRecorder(stream, {
          mimeType: targetMime,
          videoBitsPerSecond: 6000000, // 6 Mbps for crisp quality
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          clearTimeout(safetyTimeout);
          cleanup();

          const finalMime = targetMime.includes("mp4") ? "video/mp4" : "video/webm";
          const blob = new Blob(chunks, { type: finalMime });
          const filename = resolveVideoOutputFilename(item.name, finalMime, exportConfig.suffix);

          onLog?.(`[Video] Complete! Encoded ${(blob.size / 1024 / 1024).toFixed(2)} MB: ${filename}`, "success");

          resolve({
            blob,
            width,
            height,
            filename,
          });
        };

        recorder.onerror = (err) => {
          clearTimeout(safetyTimeout);
          cleanup();
          onLog?.(`[Video] MediaRecorder error: ${err}`, "error");
          reject(err);
        };

        // Reset to beginning
        try {
          video.currentTime = 0;
        } catch {
          // ignore
        }

        // Wait for video to be ready to play
        await new Promise((res) => {
          if (video.readyState >= 2) return res(null);
          let resolved = false;
          const done = () => {
            if (!resolved) {
              resolved = true;
              video.removeEventListener("canplay", done);
              video.removeEventListener("loadeddata", done);
              res(null);
            }
          };
          video.addEventListener("canplay", done);
          video.addEventListener("loadeddata", done);
          setTimeout(done, 1500);
        });

        // Start recording
        recorder.start(100);
        try {
          await video.play();
        } catch (playErr) {
          onLog?.(`[Video] Note: autoplay triggered fallback (${playErr})`, "warn");
        }

        onLog?.(`[Video] Live rendering watermark at 30 FPS...`, "info");

        let lastLoggedSec = -1;

        const finalizeRecording = () => {
          if (recorder.state === "recording") {
            onProgress?.(100);
            onLog?.(`[Video] Reached end of video (${duration.toFixed(1)}s). Finalizing output...`, "info");
            recorder.stop();
          }
        };

        // Frame rendering loop synchronized with video playback
        const renderLoop = () => {
          if (isCleanedUp || video.ended || video.currentTime >= duration) {
            finalizeRecording();
            return;
          }

          renderWatermark(video, watermarkConfig, canvas);

          const currentSec = Math.floor(video.currentTime);
          const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
          onProgress?.(pct);

          if (currentSec !== lastLoggedSec && currentSec % 2 === 0) {
            lastLoggedSec = currentSec;
            onLog?.(`[Video] Encoding "${item.name}": ${pct}% (${video.currentTime.toFixed(1)}s / ${duration.toFixed(1)}s)`, "info");
          }

          if ("requestVideoFrameCallback" in video) {
            (video as any).requestVideoFrameCallback(renderLoop);
          } else {
            requestAnimationFrame(renderLoop);
          }
        };

        if ("requestVideoFrameCallback" in video) {
          (video as any).requestVideoFrameCallback(renderLoop);
        } else {
          requestAnimationFrame(renderLoop);
        }

        // Watchdog interval to ensure completion triggers even if backgrounded or throttled
        const watchdog = setInterval(() => {
          if (isCleanedUp) {
            clearInterval(watchdog);
            return;
          }
          if (video.ended || video.currentTime >= duration - 0.1) {
            clearInterval(watchdog);
            finalizeRecording();
          }
        }, 300);

        video.onended = () => {
          clearInterval(watchdog);
          finalizeRecording();
        };
      } catch (err: any) {
        clearTimeout(safetyTimeout);
        cleanup();
        onLog?.(`[Video] Error during setup: ${err?.message}`, "error");
        reject(err);
      }
    };

    video.onerror = (err) => {
      clearTimeout(safetyTimeout);
      cleanup();
      onLog?.(`[Video] Failed to decode video element: ${err}`, "error");
      reject(new Error(`Failed to load video "${item.name}"`));
    };
  });
}
