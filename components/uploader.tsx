"use client";

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FolderUp, Image as ImageIcon, Video as VideoIcon, AlertCircle } from "lucide-react";
import { ImageFileItem } from "@/types/watermark";

interface UploaderProps {
  onImagesAdded: (items: ImageFileItem[]) => void;
  compact?: boolean;
}

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB per file

export function Uploader({ onImagesAdded, compact = false }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Global clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1 || items[i].type.indexOf("video") !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        processFiles(files);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const validItems: ImageFileItem[] = [];
    const rejectedErrors: string[] = [];

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const isImage =
        SUPPORTED_IMAGE_TYPES.includes(file.type) ||
        file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      const isVideo =
        SUPPORTED_VIDEO_TYPES.includes(file.type) ||
        file.name.match(/\.(mp4|webm|ogg|mov)$/i);

      if (!isImage && !isVideo) {
        rejectedErrors.push(`"${file.name}" has an unsupported format.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        rejectedErrors.push(`"${file.name}" exceeds the 250MB limit.`);
        continue;
      }

      try {
        if (isVideo) {
          const { dimensions, duration, previewUrl } = await getVideoMetadata(file);
          const videoUrl = URL.createObjectURL(file);

          validItems.push({
            id: "vid-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 7),
            file,
            name: file.name,
            size: file.size,
            type: file.type || "video/mp4",
            mediaType: "video",
            duration,
            dimensions,
            previewUrl,
            videoUrl,
            status: "waiting",
          });
        } else {
          const dimensions = await getImageDimensions(file);
          const previewUrl = URL.createObjectURL(file);

          validItems.push({
            id: "img-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 7),
            file,
            name: file.name,
            size: file.size,
            type: file.type || "image/jpeg",
            mediaType: "image",
            dimensions,
            previewUrl,
            status: "waiting",
          });
        }
      } catch (err: any) {
        rejectedErrors.push(`Could not read file "${file.name}": ${err?.message || "format error"}`);
      }
    }

    if (rejectedErrors.length > 0) {
      setErrorMessage(rejectedErrors.slice(0, 2).join(" "));
    }

    if (validItems.length > 0) {
      onImagesAdded(validItems);
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image dimension decoding failed"));
      };
      img.src = url;
    });
  };

  const getVideoMetadata = (
    file: File
  ): Promise<{ dimensions: { width: number; height: number }; duration: number; previewUrl: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const videoUrl = URL.createObjectURL(file);
      video.src = videoUrl;

      video.onloadedmetadata = () => {
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const duration = video.duration || 0;

        // Seek slightly into video to capture a poster thumbnail
        video.currentTime = Math.min(0.5, duration / 2);
      };

      video.onseeked = () => {
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(width, 640);
        canvas.height = Math.round((canvas.width / width) * height);
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            const previewUrl = blob ? URL.createObjectURL(blob) : videoUrl;
            resolve({
              dimensions: { width, height },
              duration: video.duration || 0,
              previewUrl,
            });
          }, "image/jpeg", 0.85);
        } else {
          resolve({
            dimensions: { width, height },
            duration: video.duration || 0,
            previewUrl: videoUrl,
          });
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("Video metadata decoding failed"));
      };
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/quicktime"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is non-standard but supported in all modern browsers
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group ${
          compact ? "p-4 min-h-[140px]" : "p-8 min-h-[220px]"
        } ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10 scale-[0.99] shadow-inner"
            : "border-slate-800 hover:border-indigo-500/60 bg-slate-900/50 hover:bg-slate-900/80"
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-md">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-sm font-semibold text-white mb-1">
          Drop your images or <span className="text-indigo-400 underline decoration-indigo-400/50 underline-offset-2">videos</span> here
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mb-3">
          JPG, PNG, WEBP, MP4, WEBM up to 250MB. Paste (<kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 rounded border border-slate-700 text-slate-300">Ctrl+V</kbd>) supported.
        </p>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Select Media</span>
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            title="Upload entire folder"
          >
            <FolderUp className="w-3.5 h-3.5 text-slate-400" />
            Select Folder
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
