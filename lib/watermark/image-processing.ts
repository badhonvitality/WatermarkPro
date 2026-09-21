import { ExportConfig, ImageFileItem, WatermarkConfig } from "@/types/watermark";
import { renderWatermark } from "./renderer";
import { sanitizeFilename } from "@/lib/utils";
import { processSingleVideo } from "./video-processing";

/**
 * Loads an image File into an HTMLImageElement
 */
export function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Determines target mime type based on export config and original file type
 */
export function resolveTargetMimeType(originalType: string, format: ExportConfig["format"]): string {
  if (format === "image/png") return "image/png";
  if (format === "image/jpeg") return "image/jpeg";
  if (format === "image/webp") return "image/webp";

  // If "original":
  if (originalType === "image/png") return "image/png";
  if (originalType === "image/webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Determines output filename with extension and suffix
 */
export function resolveOutputFilename(
  originalName: string,
  targetMimeType: string,
  suffix: string
): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
  const safeBase = sanitizeFilename(base);

  let ext = ".jpg";
  if (targetMimeType === "image/png") ext = ".png";
  else if (targetMimeType === "image/webp") ext = ".webp";
  else if (targetMimeType === "image/jpeg") ext = ".jpg";
  else if (dotIndex !== -1) ext = originalName.substring(dotIndex);

  return `${safeBase}${suffix}${ext}`;
}

/**
 * Processes a single image file with the given watermark config and export options
 */
export async function processSingleImage(
  file: File,
  watermarkConfig: WatermarkConfig,
  exportConfig: ExportConfig
): Promise<{ blob: Blob; width: number; height: number; filename: string }> {
  const img = await loadImageElement(file);
  const canvas = renderWatermark(img, watermarkConfig);

  const targetMime = resolveTargetMimeType(file.type, exportConfig.format);
  const quality = targetMime === "image/png" ? undefined : exportConfig.quality;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error(`Failed to convert canvas to blob for ${file.name}`));
      },
      targetMime,
      quality
    );
  });

  const filename = resolveOutputFilename(file.name, targetMime, exportConfig.suffix);

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    filename,
  };
}

/**
 * Controlled concurrency batch processing with live logging
 */
export async function processBatchQueue(
  items: ImageFileItem[],
  watermarkConfig: WatermarkConfig,
  exportConfig: ExportConfig,
  concurrency = 3,
  onItemProgress?: (item: ImageFileItem, index: number, total: number) => void,
  onLog?: (msg: string, type?: "info" | "success" | "warn" | "error") => void
): Promise<ImageFileItem[]> {
  const results = [...items];
  const total = results.length;
  let currentIndex = 0;
  let activeWorkers = 0;

  // Check if queue contains videos (if so, process sequentially to prevent browser decoder deadlock)
  const hasVideos = items.some((i) => i.mediaType === "video" || i.type.startsWith("video/"));
  const effectiveConcurrency = hasVideos ? 1 : concurrency;

  // Hydrate logoImage if logoDataUrl is set but logoImage is missing
  let activeConfig = watermarkConfig;
  if (watermarkConfig.logoDataUrl && !watermarkConfig.logoImage && typeof Image !== "undefined") {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Failed to load logo image"));
        i.src = watermarkConfig.logoDataUrl!;
      });
      activeConfig = { ...watermarkConfig, logoImage: img };
    } catch (e) {
      console.warn("Could not preload logoImage for batch queue:", e);
    }
  }

  onLog?.(`[Queue] Starting batch of ${total} files with concurrency ${effectiveConcurrency}...`, "info");

  return new Promise((resolve) => {
    function processNext() {
      if (currentIndex >= total && activeWorkers === 0) {
        onLog?.(`[Queue] All ${total} files processed!`, "success");
        resolve(results);
        return;
      }

      while (activeWorkers < effectiveConcurrency && currentIndex < total) {
        const itemIndex = currentIndex++;
        const item = results[itemIndex];
        activeWorkers++;

        item.status = "processing";
        onItemProgress?.(item, itemIndex, total);

        const isVideo = item.mediaType === "video" || item.type.startsWith("video/");
        onLog?.(`[Queue] Processing (${itemIndex + 1}/${total}): "${item.name}" [${isVideo ? "VIDEO" : "IMAGE"}]`, "info");

        const taskPromise = isVideo
          ? processSingleVideo(
              item,
              activeConfig,
              exportConfig,
              () => {
                onItemProgress?.(item, itemIndex, total);
              },
              onLog
            )
          : processSingleImage(item.file, activeConfig, exportConfig);

        taskPromise
          .then(({ blob, width, height }) => {
            if (item.resultUrl) {
              URL.revokeObjectURL(item.resultUrl);
            }
            item.resultBlob = blob;
            item.resultUrl = URL.createObjectURL(blob);
            item.status = "completed";
            item.errorMessage = undefined;
            onLog?.(`[Queue] ✓ Finished "${item.name}" (${width}×${height})`, "success");
          })
          .catch((err) => {
            console.error(`Error processing ${item.name}:`, err);
            item.status = "failed";
            item.errorMessage = err?.message || "Failed to process media";
            onLog?.(`[Queue] ✗ Failed "${item.name}": ${item.errorMessage}`, "error");
          })
          .finally(() => {
            activeWorkers--;
            onItemProgress?.(item, itemIndex, total);
            processNext();
          });
      }
    }

    processNext();
  });
}
