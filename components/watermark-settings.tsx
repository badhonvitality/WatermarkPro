"use client";

import { WatermarkConfig, WatermarkType } from "@/types/watermark";
import { PresetManager } from "./preset-manager";
import {
  Type,
  Image as ImageIcon,
  Sliders,
  RotateCw,
  Eye,
  Palette,
  Grid,
  Sparkles,
  Layers,
  ChevronDown,
  Hash,
  Minus,
  Square,
  Upload,
  X,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface WatermarkSettingsProps {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
}

const FONT_FAMILIES = [
  "Inter",
  "Arial",
  "Helvetica",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Georgia",
  "Times New Roman",
];

const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800];

const ANGLE_PRESETS = [
  { label: "0°", val: 0 },
  { label: "-30°", val: -30 },
  { label: "-45°", val: -45 },
  { label: "30°", val: 30 },
  { label: "45°", val: 45 },
  { label: "90°", val: 90 },
];

const SAMPLE_TEXTS = [
  "WatermarkPro",
  "© WatermarkPro",
  "CONFIDENTIAL",
  "DO NOT COPY",
  "COPYRIGHT PROTECTED",
];

const COLOR_SWATCHES = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Off-White", hex: "#F1F5F9" },
  { name: "Light Gray", hex: "#CBD5E1" },
  { name: "Black", hex: "#000000" },
  { name: "Red", hex: "#EF4444" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Cyan", hex: "#06B6D4" },
];

// Royalty-free SVG sample badges for instant one-click testing
const SAMPLE_LOGOS = [
  {
    name: "Verified Shield",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="white" stroke-width="6"><path d="M50 10 L85 25 L85 55 C85 75 50 92 50 92 C50 92 15 75 15 55 L15 25 Z" fill="rgba(99,102,241,0.35)"/><path d="M35 50 L46 61 L68 38" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    name: "Copyright Crest",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="white" stroke-width="5"><circle cx="50" cy="50" r="42" stroke="white" fill="rgba(255,255,255,0.1)"/><text x="50" y="62" font-family="sans-serif" font-size="38" font-weight="bold" fill="white" text-anchor="middle">©</text></svg>`,
  },
  {
    name: "Crown Emblem",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="white" stroke-width="5"><path d="M15 70 L25 35 L50 55 L75 35 L85 70 Z" fill="rgba(245,158,11,0.35)"/><circle cx="25" cy="30" r="5" fill="white"/><circle cx="50" cy="48" r="5" fill="white"/><circle cx="75" cy="30" r="5" fill="white"/><rect x="15" y="70" width="70" height="8" rx="2" fill="white"/></svg>`,
  },
];

export function WatermarkSettings({ config, onChange }: WatermarkSettingsProps) {
  const currentType = config.watermarkType || "text";
  const [activeTab, setActiveTab] = useState<"text" | "logo" | "style" | "spacing" | "advanced">(
    currentType === "logo" ? "logo" : "text"
  );
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof WatermarkConfig>(key: K, value: WatermarkConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  // Hydrate logoImage from logoDataUrl if missing
  useEffect(() => {
    if (config.logoDataUrl && !config.logoImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        onChange({
          ...config,
          logoImage: img,
        });
      };
      img.src = config.logoDataUrl;
    }
  }, [config.logoDataUrl, config.logoImage]);

  // Handle logo file loading
  const handleLogoFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        onChange({
          ...config,
          watermarkType: config.watermarkType === "text" ? "logo" : config.watermarkType,
          logoDataUrl: dataUrl,
          logoName: file.name,
          logoImage: img,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFile(file);
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  };

  const applySampleLogo = (name: string, dataUrl: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      onChange({
        ...config,
        watermarkType: config.watermarkType === "text" ? "logo" : config.watermarkType,
        logoDataUrl: dataUrl,
        logoName: name,
        logoImage: img,
      });
    };
    img.src = dataUrl;
  };

  const handleRemoveLogo = () => {
    onChange({
      ...config,
      logoDataUrl: null,
      logoName: undefined,
      logoImage: null,
    });
  };

  const handleTypeChange = (type: WatermarkType) => {
    update("watermarkType", type);
    if (type === "logo" && activeTab === "text") {
      setActiveTab("logo");
    } else if (type === "text" && activeTab === "logo") {
      setActiveTab("text");
    }
  };

  // Determine available tabs
  const isTextActive = currentType === "text" || currentType === "both";
  const isLogoActive = currentType === "logo" || currentType === "both";

  return (
    <div className="flex flex-col h-full bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Settings Header with Preset Manager & Type Switcher */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex flex-col gap-2.5">
        <PresetManager currentConfig={config} onApplyPreset={onChange} />

        {/* Watermark Type Selector (User Choice: Text, Logo, or Both) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span>Watermark Type</span>
            <span className="text-[10px] text-indigo-400 font-mono">
              {currentType === "both" ? "Text + Logo" : currentType === "logo" ? "Logo Only" : "Text Only"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTypeChange("text")}
              className={`py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                currentType === "text"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text Only</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("logo")}
              className={`py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                currentType === "logo"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Logo Only</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("both")}
              className={`py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                currentType === "both"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Both</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          {isTextActive && (
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "text"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
          )}

          {isLogoActive && (
            <button
              type="button"
              onClick={() => setActiveTab("logo")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "logo"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Logo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("style")}
            className={`flex-1 py-1.5 px-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "style"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Style</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("spacing")}
            className={`flex-1 py-1.5 px-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "spacing"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Tile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className={`flex-1 py-1.5 px-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "advanced"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* Tab Panels Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 max-h-[calc(100vh-360px)] min-h-[300px]">
        {/* ================= TAB: TEXT ================= */}
        {activeTab === "text" && isTextActive && (
          <div className="space-y-4">
            {/* Watermark Text Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white">Watermark Text</label>
                <span className="text-[10px] text-indigo-400 font-medium">Text Protection</span>
              </div>
              <input
                type="text"
                value={config.text}
                onChange={(e) => update("text", e.target.value)}
                placeholder="e.g. WatermarkPro"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
              />
              {/* Text suggestions chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {SAMPLE_TEXTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update("text", s)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Mode (5 Pattern Styles) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white">Watermark Pattern Style</label>
                <span className="text-[10px] text-indigo-400 font-medium">5 Styles Available</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => update("mode", "tiled")}
                  className={`p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center ${
                    config.mode === "tiled"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Repeated Diagonal</span>
                </button>

                <button
                  type="button"
                  onClick={() => update("mode", "cross-hatch")}
                  className={`p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center ${
                    config.mode === "cross-hatch"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cross-Hatch X-Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => update("mode", "ribbon")}
                  className={`p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center ${
                    config.mode === "ribbon"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Minus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Security Ribbon</span>
                </button>

                <button
                  type="button"
                  onClick={() => update("mode", "frame")}
                  className={`p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center ${
                    config.mode === "frame"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Square className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Perimeter Frame</span>
                </button>

                <button
                  type="button"
                  onClick={() => update("mode", "single")}
                  className={`col-span-2 p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                    config.mode === "single"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Single Stamp Mode</span>
                </button>
              </div>
            </div>

            {/* Text Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  Text Opacity
                </label>
                <span className="font-mono text-indigo-400 font-bold">
                  {Math.round(config.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.01"
                value={config.opacity}
                onChange={(e) => update("opacity", parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Subtle (5%)</span>
                <span>Default (25%)</span>
                <span>Strong (80%)</span>
              </div>
            </div>

            {/* Watermark Angle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-white flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                  Angle
                </label>
                <span className="font-mono text-indigo-400 font-bold">{config.angle}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="1"
                value={config.angle}
                onChange={(e) => update("angle", parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ANGLE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => update("angle", p.val)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer border ${
                      config.angle === p.val
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: LOGO ================= */}
        {activeTab === "logo" && isLogoActive && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUploadChange}
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
            />

            {!config.logoImage && !config.logoDataUrl ? (
              /* Logo Upload Dropzone */
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleLogoDrop}
                  className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition cursor-pointer ${
                    isDraggingLogo
                      ? "border-indigo-500 bg-indigo-950/40"
                      : "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Upload Brand Logo or Badge</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG (with transparency), SVG, WebP, JPG</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition"
                  >
                    Browse Logo File
                  </button>
                </div>

                {/* Quick Sample Watermark Badges */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-slate-400">Or pick a sample watermark badge:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SAMPLE_LOGOS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => applySampleLogo(item.name, item.dataUrl)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer flex flex-col items-center gap-1.5 text-center group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center p-1 border border-slate-800 group-hover:scale-105 transition">
                          <img src={item.dataUrl} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-300 truncate w-full">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Logo Uploaded Card */
              <div className="space-y-4">
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    {/* Checkerboard container for transparency preview */}
                    <div
                      className="w-12 h-12 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center p-1"
                      style={{
                        backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                        backgroundSize: "8px 8px",
                        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                        backgroundColor: "#0f172a",
                      }}
                    >
                      <img
                        src={config.logoDataUrl || ""}
                        alt="Watermark Logo"
                        className="max-w-full max-h-full object-contain drop-shadow"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[170px]">
                        {config.logoName || "Custom Logo"}
                      </p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready for watermarking
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-1 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                      title="Remove logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Logo Scale / Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-white">Logo Scale / Size</label>
                    <span className="font-mono text-indigo-400 font-semibold">{config.logoScale ?? 20}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="1"
                    value={config.logoScale ?? 20}
                    onChange={(e) => update("logoScale", Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Small (5%)</span>
                    <span>Default (20%)</span>
                    <span>Large (60%)</span>
                  </div>
                </div>

                {/* Logo Opacity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-white">Logo Opacity</label>
                    <span className="font-mono text-indigo-400 font-semibold">
                      {Math.round((config.logoOpacity ?? 0.35) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={Math.round((config.logoOpacity ?? 0.35) * 100)}
                    onChange={(e) => update("logoOpacity", Number(e.target.value) / 100)}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Subtle (15%)</span>
                    <span>Normal (35%)</span>
                    <span>Solid (100%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Watermark Pattern Style for Logo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white">Logo Pattern Style</label>
                <span className="text-[10px] text-indigo-400 font-medium">5 Styles</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => update("mode", "tiled")}
                  className={`p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center ${
                    config.mode === "tiled"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Repeated Diagonal</span>
                </button>

                <button
                  type="button"
                  onClick={() => update("mode", "cross-hatch")}
                  className={`p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center ${
                    config.mode === "cross-hatch"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cross-Hatch X-Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => update("mode", "ribbon")}
                  className={`p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center ${
                    config.mode === "ribbon"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Minus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Security Ribbon</span>
                </button>

                <button
                  type="button"
                  onClick={() => update("mode", "frame")}
                  className={`p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex flex-col items-center gap-1 text-center ${
                    config.mode === "frame"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Square className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Perimeter Frame</span>
                </button>

                <button
                  type="button"
                  onClick={() => update("mode", "single")}
                  className={`col-span-2 p-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                    config.mode === "single"
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Single Stamp Mode</span>
                </button>
              </div>
            </div>

            {/* Logo Angle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-white flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                  Logo Angle
                </label>
                <span className="font-mono text-indigo-400 font-bold">{config.angle}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="1"
                value={config.angle}
                onChange={(e) => update("angle", parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ANGLE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => update("angle", p.val)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer border ${
                      config.angle === p.val
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: STYLE ================= */}
        {activeTab === "style" && (
          <div className="space-y-4">
            {isTextActive && (
              <>
                {/* Font Family */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white">Font Family</label>
                  <div className="relative">
                    <select
                      value={config.fontFamily}
                      onChange={(e) => update("fontFamily", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 appearance-none pr-8 cursor-pointer"
                    >
                      {FONT_FAMILIES.map((font) => (
                        <option key={font} value={font} className="bg-slate-900 text-white">
                          {font}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Font Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white">Font Weight</label>
                  <div className="grid grid-cols-6 gap-1">
                    {FONT_WEIGHTS.map((weight) => (
                      <button
                        key={weight}
                        type="button"
                        onClick={() => update("fontWeight", weight)}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          config.fontWeight === weight
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {weight}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Responsive Font Size */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-white">Font Size (Responsive Scale)</label>
                    <span className="font-mono text-indigo-400 font-bold">{config.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="80"
                    step="1"
                    value={config.fontSize}
                    onChange={(e) => update("fontSize", parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <p className="text-[10px] text-slate-400">
                    Scales responsively with image resolution for identical density.
                  </p>
                </div>

                {/* Watermark Color */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-white">Color</label>
                    <span className="font-mono text-slate-400 uppercase">{config.color}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.color}
                      onChange={(e) => update("color", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={config.color}
                      onChange={(e) => update("color", e.target.value)}
                      placeholder="#FFFFFF"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {/* Color swatches */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => update("color", swatch.hex)}
                        style={{ backgroundColor: swatch.hex }}
                        className="w-5 h-5 rounded-md border border-slate-600 hover:scale-110 transition cursor-pointer shadow"
                        title={swatch.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {isLogoActive && !isTextActive && (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                You are in <strong className="text-white">Logo Only</strong> mode. Logo appearance is customized via the <button type="button" onClick={() => setActiveTab("logo")} className="text-indigo-400 underline font-semibold cursor-pointer">Logo tab</button>.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: SPACING & DENSITY ================= */}
        {activeTab === "spacing" && (
          <div className="space-y-4">
            {/* Tile Density */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Tile Density</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(["sparse", "normal", "dense", "very-dense"] as const).map((density) => (
                  <button
                    key={density}
                    type="button"
                    onClick={() => update("density", density)}
                    className={`py-2 px-1 rounded-xl border text-xs font-medium capitalize transition cursor-pointer ${
                      config.density === density
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm font-semibold"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {density.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontal Spacing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-white">Horizontal Spacing</label>
                <span className="font-mono text-indigo-400 font-bold">{config.horizontalSpacing}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={config.horizontalSpacing}
                onChange={(e) => update("horizontalSpacing", parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Vertical Spacing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-white">Vertical Spacing</label>
                <span className="font-mono text-indigo-400 font-bold">{config.verticalSpacing}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={config.verticalSpacing}
                onChange={(e) => update("verticalSpacing", parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* ================= TAB: ADVANCED ================= */}
        {activeTab === "advanced" && (
          <div className="space-y-4">
            {/* Position Selector (Single Mode) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-white">Single Stamp Anchor Position</label>
                <span className="text-[10px] text-slate-400 capitalize">{config.position}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 max-w-[200px] mx-auto p-1.5 bg-slate-900 rounded-xl border border-slate-800">
                {[
                  { pos: "top-left", label: "TL" },
                  { pos: "center", label: "Center" },
                  { pos: "top-right", label: "TR" },
                  { pos: "bottom-left", label: "BL" },
                  { pos: "center", label: "Center" },
                  { pos: "bottom-right", label: "BR" },
                ].map((item, idx) => {
                  if (idx === 1) return <div key="empty-1" />;
                  if (idx === 4) {
                    return (
                      <button
                        key="center-btn"
                        type="button"
                        onClick={() => update("position", "center")}
                        className={`py-2 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                          config.position === "center"
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        MID
                      </button>
                    );
                  }
                  return (
                    <button
                      key={item.pos + idx}
                      type="button"
                      onClick={() => update("position", item.pos as any)}
                      className={`py-2 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                        config.position === item.pos
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Randomize Offset */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="pr-3">
                <p className="text-xs font-semibold text-white">Randomize Watermark Offset</p>
                <p className="text-[11px] text-slate-400">
                  Subtly stagger row positions to break rigid alignment without altering angle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => update("randomizeOffset", !config.randomizeOffset)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  config.randomizeOffset ? "bg-indigo-600" : "bg-slate-800"
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform transform mt-1 ml-1 ${
                    config.randomizeOffset ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Add Center Watermark */}
            <div className="space-y-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="pr-3">
                  <p className="text-xs font-semibold text-white">Add Prominent Center Stamp</p>
                  <p className="text-[11px] text-slate-400">
                    Place one larger, prominent center stamp over the tiled pattern.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => update("addCenterWatermark", !config.addCenterWatermark)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    config.addCenterWatermark ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform mt-1 ml-1 ${
                      config.addCenterWatermark ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {config.addCenterWatermark && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">Center Opacity</span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {Math.round(config.centerWatermarkOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.80"
                    step="0.05"
                    value={config.centerWatermarkOpacity}
                    onChange={(e) => update("centerWatermarkOpacity", parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
