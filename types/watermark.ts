export type WatermarkMode = "tiled" | "cross-hatch" | "ribbon" | "frame" | "single";
export type WatermarkDensity = "sparse" | "normal" | "dense" | "very-dense";
export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type WatermarkType = "text" | "logo" | "both";

export interface WatermarkConfig {
  watermarkType: WatermarkType; // "text" | "logo" | "both"
  text: string;
  fontFamily: string;
  fontSize: number; // Responsive base scale (10 to 120, default 28)
  fontWeight: number; // 300 to 800, default 600
  color: string; // Hex color, default "#FFFFFF"
  opacity: number; // 0.05 to 0.80, default 0.25
  angle: number; // -90 to +90 degrees, default -30
  mode: WatermarkMode;
  density: WatermarkDensity;
  horizontalSpacing: number; // 20 to 300, default 80
  verticalSpacing: number; // 20 to 300, default 60
  position: WatermarkPosition;
  randomizeOffset: boolean;
  addCenterWatermark: boolean;
  centerWatermarkOpacity: number;

  // Logo / Image Watermark Properties
  logoDataUrl?: string | null;
  logoName?: string;
  logoImage?: HTMLImageElement | ImageBitmap | null;
  logoScale?: number; // 5 to 60 (% of base image dimension, default 20)
  logoOpacity?: number; // 0.05 to 1.0 (default 0.35)
}

export type ExportFormat = "original" | "image/jpeg" | "image/png" | "image/webp" | "video/webm" | "video/mp4";

export interface ExportConfig {
  format: ExportFormat;
  quality: number; // 0.5 to 1.0, default 0.90
  suffix: string; // default "-watermarked"
}

export type ProcessingStatus = "waiting" | "processing" | "completed" | "failed";

export interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  mediaType?: "image" | "video";
  duration?: number; // Video duration in seconds
  dimensions: {
    width: number;
    height: number;
  };
  previewUrl: string; // Image preview or video first-frame poster URL
  videoUrl?: string; // Direct URL for video playback
  status: ProcessingStatus;
  errorMessage?: string;
  resultBlob?: Blob;
  resultUrl?: string;
}

export interface WatermarkPreset {
  id: string;
  name: string;
  description?: string;
  config: WatermarkConfig;
  isBuiltIn?: boolean;
}

export interface BatchProcessingStats {
  total: number;
  completed: number;
  failed: number;
  startTime: number;
  endTime?: number;
  durationSeconds?: number;
}
