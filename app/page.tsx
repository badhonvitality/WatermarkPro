"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { renderWatermark } from "@/lib/watermark/renderer";
import { DEFAULT_WATERMARK_CONFIG } from "@/lib/watermark/presets";
import {
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Repeat,
  Sliders,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function LandingPage() {
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Render hero visual showcase canvas showing the diagonal text watermark
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;

    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a sleek backdrop gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 675);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.5, "#1e1b4b");
    grad.addColorStop(1, "#312e81");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 675);

    // Subtle grid texture
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 675);
      ctx.stroke();
    }
    for (let y = 0; y < 675; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    // Modern card shape in center
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.roundRect(200, 100, 800, 475, [24]);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render the repeating diagonal text watermark
    renderWatermark(canvas, DEFAULT_WATERMARK_CONFIG, canvas);
  }, []);

  const features = [
    {
      icon: <Repeat className="w-6 h-6 text-indigo-400" />,
      title: "Bulk Processing",
      desc: "Watermark hundreds or thousands of images at once without bogging down your system.",
    },
    {
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      title: "Text Only Protection",
      desc: "Create clean, difficult-to-remove text-based copyright patterns without logos or icons.",
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      title: "Full Image Coverage",
      desc: "Automatically calculate diagonal bounding coverage so every corner and edge is protected.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: "Privacy First",
      desc: "Process images locally in your browser. Zero cloud uploads, zero bandwidth costs, zero leaks.",
    },
    {
      icon: <Sliders className="w-6 h-6 text-cyan-400" />,
      title: "Custom Positioning",
      desc: "Precise control over angle, spacing, opacity, responsive font scaling, and row offsets.",
    },
    {
      icon: <Cpu className="w-6 h-6 text-rose-400" />,
      title: "Fast Processing",
      desc: "Leverages modern HTML5 Canvas, OffscreenCanvas, and multithreaded browser workers.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Upload Images",
      desc: "Drag & drop single photos, entire folders, or paste directly from your clipboard.",
    },
    {
      num: "02",
      title: "Configure Watermark",
      desc: "Enter your text (e.g., 'WatermarkPro'), adjust angle (-30°), opacity (25%), font, and density.",
    },
    {
      num: "03",
      title: "Live Preview",
      desc: "Inspect before/after split sliders in real time with pixel-perfect accuracy.",
    },
    {
      num: "04",
      title: "Download ZIP",
      desc: "Apply the watermark across the entire batch and export as a single compressed ZIP file.",
    },
  ];

  const faqs = [
    {
      q: "Are my images uploaded to any server?",
      a: "No! WatermarkPro operates 100% client-side inside your web browser. Your images never leave your computer or touch an external server, guaranteeing total privacy and unmatched speed.",
    },
    {
      q: "Can I watermark hundreds of images at the same time?",
      a: "Yes. WatermarkPro is built specifically for batch processing. Our concurrency engine handles large image queues gracefully with memory management and object URL disposal.",
    },
    {
      q: "Does watermarking degrade my image quality?",
      a: "No. Original image dimensions are strictly preserved. PNG images are exported losslessly, while JPEG and WEBP files use a high-fidelity 90% quality compression by default (customizable up to 100%).",
    },
    {
      q: "Can I save my custom watermark presets?",
      a: "Yes! You can save as many custom presets as you like. They are stored securely in your browser's localStorage for instant re-use.",
    },
    {
      q: "Does it work offline?",
      a: "Yes. WatermarkPro is designed as an installable Progressive Web App (PWA) with complete offline image processing capability.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800/80">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-indigo-300 shadow-md mb-8">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Text-Only Repeated Diagonal Protection</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
            Bulk Watermark <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Your Images & Videos
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Protect hundreds of photos, graphics, and video clips with clean, repeated diagonal text watermarks. Processed 100% client-side in your browser.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/watermark"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Start Watermarking</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Visual Showcase: Repeated Watermark Display */}
          <div className="relative max-w-5xl mx-auto rounded-3xl p-2 bg-gradient-to-b from-slate-700/40 via-slate-800/40 to-slate-900/60 border border-slate-700/60 shadow-2xl">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[16/9] shadow-inner">
              <canvas
                ref={heroCanvasRef}
                className="w-full h-full object-cover block"
              />

              {/* Overlay labels */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs font-semibold text-white shadow">
                Diagonal Repeated Watermark: "WatermarkPro" (-30°, 25% Opacity)
              </div>

              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Link
                  href="/watermark"
                  className="px-4 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md text-white text-xs font-semibold shadow-lg transition flex items-center gap-1.5"
                >
                  <span>Open Watermark Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" className="py-24 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Features
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for Creators, Photographers & Template Builders
            </p>
            <p className="text-slate-400 text-sm sm:text-base mt-3">
              Everything you need to safeguard digital assets at scale without sacrificing visual clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS SECTION ================= */}
      <section id="how-it-works" className="py-24 border-b border-slate-800/80 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Simple 4-Step Workflow
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How WatermarkPro Works
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st) => (
              <div
                key={st.num}
                className="relative p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col"
              >
                <span className="text-3xl font-black text-indigo-500/40 font-mono mb-4">
                  {st.num}
                </span>
                <h3 className="text-base font-bold text-white mb-2">{st.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRIVACY SECTION ================= */}
      <section id="privacy" className="py-24 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900/80 border border-emerald-800/40 shadow-2xl flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-3 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white">
                Your images stay on your device. Always.
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Images are processed locally in your browser and are never uploaded to our servers. Because your device handles the rendering, your intellectual property remains private, secure, and immune to cloud breaches.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 100% Offline Capable
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> No Account Required
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Zero Bandwidth Limits
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-24 border-b border-slate-800/80 bg-slate-900/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Common Questions
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white pr-4">{faq.q}</h4>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                  {isOpen && (
                    <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950/40">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Ready to Protect Your Images?
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8">
            Upload your images now and configure the diagonal text watermark in seconds. No sign-up required.
          </p>
          <Link
            href="/watermark"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/40 transition hover:scale-105 active:scale-95"
          >
            <span>Launch WatermarkPro Studio</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
