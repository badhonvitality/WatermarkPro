"use client";

import { useState, useEffect } from "react";
import { WatermarkConfig, WatermarkPreset } from "@/types/watermark";
import { loadSavedPresets, saveUserPreset, deleteUserPreset } from "@/lib/watermark/presets";
import { Bookmark, Plus, Trash2, Check, Sparkles } from "lucide-react";

interface PresetManagerProps {
  currentConfig: WatermarkConfig;
  onApplyPreset: (config: WatermarkConfig) => void;
}

export function PresetManager({ currentConfig, onApplyPreset }: PresetManagerProps) {
  const [presets, setPresets] = useState<WatermarkPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("default-sikkabuilds");
  const [isSaving, setIsSaving] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  useEffect(() => {
    setPresets(loadSavedPresets());
  }, []);

  const handleSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      onApplyPreset(found.config);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const updated = saveUserPreset(newPresetName, currentConfig);
    setPresets(updated);
    const created = updated[updated.length - 1];
    if (created) setSelectedPresetId(created.id);
    setNewPresetName("");
    setIsSaving(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteUserPreset(id);
    setPresets(updated);
    if (selectedPresetId === id) {
      setSelectedPresetId("default-sikkabuilds");
      const def = updated.find((p) => p.id === "default-sikkabuilds");
      if (def) onApplyPreset(def.config);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
          Watermark Presets
        </label>
        <button
          type="button"
          onClick={() => setIsSaving(!isSaving)}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
        >
          <Plus className="w-3 h-3" />
          Save Current
        </button>
      </div>

      {isSaving && (
        <form onSubmit={handleSave} className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            placeholder="Preset Name (e.g. My Style)"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Preset Pills / Select */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {presets.map((preset) => {
          const active = preset.id === selectedPresetId;
          return (
            <div
              key={preset.id}
              onClick={() => handleSelect(preset.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                active
                  ? "bg-indigo-600/30 text-indigo-200 border-indigo-500/60 shadow-sm"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
              }`}
            >
              {active && <Check className="w-3 h-3 text-indigo-400" />}
              {preset.isBuiltIn && !active && <Sparkles className="w-2.5 h-2.5 text-slate-500" />}
              <span>{preset.name}</span>
              {!preset.isBuiltIn && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(preset.id, e)}
                  className="ml-1 text-slate-500 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                  title="Delete preset"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
