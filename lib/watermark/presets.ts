import { WatermarkConfig, WatermarkPreset } from "@/types/watermark";

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  watermarkType: "text",
  text: "WatermarkPro",
  fontFamily: "Inter",
  fontSize: 28, // Scaled dynamically relative to image dimensions
  fontWeight: 600,
  color: "#FFFFFF",
  opacity: 0.25,
  angle: -30,
  mode: "tiled",
  density: "normal",
  horizontalSpacing: 80,
  verticalSpacing: 60,
  position: "center",
  randomizeOffset: false,
  addCenterWatermark: false,
  centerWatermarkOpacity: 0.40,
  logoDataUrl: null,
  logoName: undefined,
  logoImage: null,
  logoScale: 20,
  logoOpacity: 0.35,
};

export const BUILT_IN_PRESETS: WatermarkPreset[] = [
  {
    id: "default-watermarkpro",
    name: "Default (WatermarkPro)",
    description: "Standard diagonal -30° repeated text with 25% opacity",
    isBuiltIn: true,
    config: { ...DEFAULT_WATERMARK_CONFIG },
  },
  {
    id: "light-protection",
    name: "Light Protection",
    description: "Subtle 20% opacity protection pattern",
    isBuiltIn: true,
    config: {
      ...DEFAULT_WATERMARK_CONFIG,
      text: "WatermarkPro",
      opacity: 0.20,
      angle: -30,
      density: "normal",
    },
  },
  {
    id: "strong-protection",
    name: "Strong Protection",
    description: "Dense 35% opacity pattern for maximum anti-theft",
    isBuiltIn: true,
    config: {
      ...DEFAULT_WATERMARK_CONFIG,
      text: "WatermarkPro",
      opacity: 0.35,
      angle: -30,
      density: "dense",
      horizontalSpacing: 50,
      verticalSpacing: 40,
    },
  },
  {
    id: "copyright",
    name: "Copyright",
    description: "Diagonal -45° copyright notice with 25% opacity",
    isBuiltIn: true,
    config: {
      ...DEFAULT_WATERMARK_CONFIG,
      text: "© WatermarkPro",
      opacity: 0.25,
      angle: -45,
      density: "normal",
    },
  },
  {
    id: "template-notice",
    name: "Template Notice",
    description: "Full coverage template ownership watermark",
    isBuiltIn: true,
    config: {
      ...DEFAULT_WATERMARK_CONFIG,
      text: "Protected with WatermarkPro",
      opacity: 0.22,
      angle: -30,
      fontSize: 24,
      density: "normal",
      horizontalSpacing: 90,
      verticalSpacing: 70,
    },
  },
  {
    id: "agency-cross-hatch",
    name: "Agency Cross-Hatch",
    description: "Dual diagonal criss-cross diamond security mesh",
    isBuiltIn: true,
    config: {
      ...DEFAULT_WATERMARK_CONFIG,
      text: "WatermarkPro",
      mode: "cross-hatch",
      opacity: 0.20,
      angle: -30,
      density: "normal",
      horizontalSpacing: 80,
      verticalSpacing: 60,
    },
  },
  {
    id: "caution-ribbon",
    name: "Security Ribbon Tape",
    description: "Continuous unbroken diagonal caution banner bands",
    isBuiltIn: true,
    config: {
      ...DEFAULT_WATERMARK_CONFIG,
      text: "WatermarkPro",
      mode: "ribbon",
      opacity: 0.25,
      angle: -25,
      density: "normal",
      verticalSpacing: 50,
    },
  },
  {
    id: "perimeter-frame",
    name: "Perimeter Frame Guard",
    description: "Outer 4-edge border protection with security corner brackets",
    isBuiltIn: true,
    config: {
      ...DEFAULT_WATERMARK_CONFIG,
      text: "WatermarkPro",
      mode: "frame",
      opacity: 0.30,
      fontSize: 22,
    },
  },
];

const PRESETS_STORAGE_KEY = "watermarkpro_user_presets_v1";

export function loadSavedPresets(): WatermarkPreset[] {
  if (typeof window === "undefined") return BUILT_IN_PRESETS;
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return BUILT_IN_PRESETS;
    const userPresets: WatermarkPreset[] = JSON.parse(raw);
    return [...BUILT_IN_PRESETS, ...userPresets];
  } catch {
    return BUILT_IN_PRESETS;
  }
}

export function saveUserPreset(name: string, config: WatermarkConfig): WatermarkPreset[] {
  if (typeof window === "undefined") return BUILT_IN_PRESETS;
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    const existing: WatermarkPreset[] = raw ? JSON.parse(raw) : [];
    const newPreset: WatermarkPreset = {
      id: "user-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim() || "Custom Preset",
      config: { ...config },
      isBuiltIn: false,
    };
    const updated = [...existing, newPreset];
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    return [...BUILT_IN_PRESETS, ...updated];
  } catch (e) {
    console.error("Failed to save preset to localStorage", e);
    return BUILT_IN_PRESETS;
  }
}

export function deleteUserPreset(id: string): WatermarkPreset[] {
  if (typeof window === "undefined") return BUILT_IN_PRESETS;
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return BUILT_IN_PRESETS;
    const existing: WatermarkPreset[] = JSON.parse(raw);
    const filtered = existing.filter((p) => p.id !== id);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(filtered));
    return [...BUILT_IN_PRESETS, ...filtered];
  } catch (e) {
    console.error("Failed to delete preset from localStorage", e);
    return BUILT_IN_PRESETS;
  }
}
