"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, CheckCircle2, RefreshCw, Zap } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [swRegistered, setSwRegistered] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    // Initial online state
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setToastMessage("Back online. Connected to network.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastMessage("Offline mode active. All tools & cached CSS working 100% locally.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check service worker readiness
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setSwRegistered(true);
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefreshCache = async () => {
    if (!("serviceWorker" in navigator)) return;
    setIsUpdating(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
      }
      setToastMessage("Offline cache updated successfully!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.warn("Failed to update cache:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Visual Status Badge in Navigation */}
      <div className="flex items-center gap-1.5">
        {!isOnline ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm animate-pulse"
            title="You are currently offline. WatermarkPro is operating 100% client-side with cached CSS & assets."
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Offline Mode Active</span>
            <span className="sm:hidden">Offline</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRefreshCache}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 transition cursor-pointer"
            title={
              swRegistered
                ? "Offline caching active: CSS, scripts, and fonts are stored locally in your browser. Click to refresh cache."
                : "Service worker initializing offline cache..."
            }
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">
              {isUpdating ? "Updating Cache..." : "Offline Ready"}
            </span>
            {isUpdating && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />}
          </button>
        )}
      </div>

      {/* Floating Offline / Online Status Toast */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md max-w-sm ${
              isOnline
                ? "bg-slate-900/95 border-emerald-500/40 text-slate-100"
                : "bg-slate-950/95 border-amber-500/50 text-slate-100 shadow-amber-500/10"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isOnline
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-white">
                {isOnline ? "Network Connected" : "Working 100% Offline"}
              </p>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">{toastMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
