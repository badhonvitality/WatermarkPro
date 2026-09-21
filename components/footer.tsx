import Link from "next/link";
import { ShieldCheck, Lock, Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm text-slate-400 text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-base">WatermarkPro</span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              The high-performance bulk text watermarking platform. Protect hundreds of images with repeated, diagonal copyright watermarks in seconds—directly in your browser.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero server uploads. 100% client-side local browser processing.</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/watermark" className="hover:text-white transition">
                  Watermark Studio
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white transition">
                  Features & Coverage
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition">
                  Batch Workflow
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Supported Formats</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">PNG</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">JPEG / JPG</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">WEBP</span>
              <span className="px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 font-medium">MP4 Video</span>
              <span className="px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 font-medium">WEBM Video</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">ZIP Export</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Original dimensions & quality preserved.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} WatermarkPro. Built for high-volume creator and template protection.</p>
          <div className="flex gap-6">
            <Link href="/#privacy" className="hover:text-slate-300 transition">
              Privacy Policy
            </Link>
            <Link href="/#faq" className="hover:text-slate-300 transition">
              FAQ
            </Link>
            <Link href="/watermark" className="hover:text-slate-300 transition">
              Launch App
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
