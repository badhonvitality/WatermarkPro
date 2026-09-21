import JSZip from "jszip";
import { ImageFileItem, ExportConfig } from "@/types/watermark";
import { resolveOutputFilename, resolveTargetMimeType } from "./image-processing";
import { resolveVideoOutputFilename } from "./video-processing";

/**
 * Downloads a single image or video file to the user's computer
 */
export function downloadSingleImage(item: ImageFileItem, exportConfig: ExportConfig): void {
  if (!item.resultBlob && !item.resultUrl) return;

  const isVideo = item.mediaType === "video" || item.type.startsWith("video/");
  let filename = "";

  if (isVideo && item.resultBlob) {
    filename = resolveVideoOutputFilename(item.name, item.resultBlob.type, exportConfig.suffix);
  } else {
    const targetMime = resolveTargetMimeType(item.type, exportConfig.format);
    filename = resolveOutputFilename(item.name, targetMime, exportConfig.suffix);
  }

  const url = item.resultUrl || (item.resultBlob ? URL.createObjectURL(item.resultBlob) : "");
  if (!url) return;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Bundles all completed images and videos into a single ZIP file and initiates browser download
 */
export async function downloadBatchAsZip(
  items: ImageFileItem[],
  exportConfig: ExportConfig,
  zipFilename = "watermarked-media.zip",
  onProgress?: (percent: number) => void
): Promise<void> {
  const completedItems = items.filter((item) => item.status === "completed" && item.resultBlob);

  if (completedItems.length === 0) {
    throw new Error("No completed media files to download.");
  }

  const zip = new JSZip();

  // Keep track of names to prevent duplicates in ZIP
  const usedNames = new Set<string>();

  completedItems.forEach((item, index) => {
    if (!item.resultBlob) return;
    const isVideo = item.mediaType === "video" || item.type.startsWith("video/");
    let filename = "";

    if (isVideo) {
      filename = resolveVideoOutputFilename(item.name, item.resultBlob.type, exportConfig.suffix);
    } else {
      const targetMime = resolveTargetMimeType(item.type, exportConfig.format);
      filename = resolveOutputFilename(item.name, targetMime, exportConfig.suffix);
    }

    if (usedNames.has(filename)) {
      const dot = filename.lastIndexOf(".");
      const namePart = dot !== -1 ? filename.substring(0, dot) : filename;
      const extPart = dot !== -1 ? filename.substring(dot) : "";
      filename = `${namePart}_${index + 1}${extPart}`;
    }
    usedNames.add(filename);

    zip.file(filename, item.resultBlob);
  });

  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent));
    }
  );

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
