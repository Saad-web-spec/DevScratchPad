import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Image as ImageIcon,
  Film,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  Terminal,
  Zap,
} from 'lucide-react';
import { PromptCraftHeader } from './components/PromptCraftHeader';

export const metadata: Metadata = {
  title: 'PromptCraft Studio — In-Browser MoE Generative Prompt Compiler',
  description:
    'High-craft client-side prompt compiler targeting Midjourney v6.1, Flux.1, Runway Gen-3, Sora, and Kling 2.0. Powered by Sparse MoE routing and in-browser neural execution.',
  alternates: {
    canonical: 'https://www.devscratchpad.tech/promptcraft',
  },
  icons: {
    icon: '/promptcraft-fox-clean.png',
    shortcut: '/promptcraft-fox-clean.png',
    apple: '/promptcraft-fox-clean.png',
  },
};

export default function PromptCraftHubPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col selection:bg-orange-600 selection:text-white relative overflow-hidden">
      {/* Impressive Ambient Light & Architectural Micro-Grid Background */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1200px] h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(255,107,0,0.07),rgba(255,255,255,0)_70%)] pointer-events-none -z-10" 
        aria-hidden="true" 
      />
      <div 
        className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 -z-10" 
        aria-hidden="true" 
      />

      {/* High-Craft Header: Single AI Skill Studio Link on Top-Left (No Background), Fox Logo, White Action Button */}
      <PromptCraftHeader activeTab="overview" />

      {/* Main Infographic Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16 sm:space-y-20">
        
        {/* =========================================================================
            SECTION 1: HERO SECTION (Minimalist, Product-First, Distraction-Free)
        ========================================================================= */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8 pb-2">
          {/* Subtle Minimalist Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-[11px] font-mono font-medium text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            <span>In-Browser Sparse MoE Compiler</span>
          </div>

          {/* Clean Authoritative Headline (No floating icon) */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-950 leading-[1.06]">
              PromptCraft <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">Studio</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal max-w-2xl mx-auto">
              High-precision prompt compiler for generative image and video engines. Synthesizes optical camera glass, motivated lighting schemas, and multi-beat kinematics with zero server latency.
            </p>
          </div>

          {/* White & Black Pill Action Buttons (Google Antigravity reference style) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/promptcraft/images"
              className="group flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-950 text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-orange-600 transition-transform group-hover:scale-110" />
              <span>Get Started with Images</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/promptcraft/video"
              className="group flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-zinc-950 hover:bg-zinc-900 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Film className="w-4 h-4 text-orange-500 transition-transform group-hover:scale-110" />
              <span>Open Video Studio</span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: DUAL STUDIO WORKSPACE GATEWAYS
            (Specialized Image & Video Studio Gateways)
        ========================================================================= */}
        <section className="space-y-8">
          <div className="text-center space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-orange-600 font-bold">
              Dedicated Workspaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Two Specialized Studios. Zero Bloat.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
              Purpose-built environments structured specifically for photographic still optics or multi-beat kinematic temporal sequences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Studio Card: Mainly White with Orange & Black accents */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03),0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-orange-400/80 hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] transition-all duration-300 space-y-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shadow-2xs">
                    <ImageIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                  </div>
                  {/* Black pill badge on white card */}
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-950 text-white font-medium shadow-xs">
                    Midjourney v6.1 & Flux.1
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
                    Dedicated Image Studio
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    IDE-style 3-panel workspace for photographic prompt synthesis. Select focal glass, aperture depth, studio lighting schemas, aspect ratios, and raw stylize parameters with real-time monospace output.
                  </p>
                </div>

                {/* Live AST Syntax Preview Mockup */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 font-mono text-[11px] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-1 border-b border-zinc-200/60 font-semibold">
                    <span>TARGET: MIDJOURNEY v6.1</span>
                    <span className="text-orange-600">COMPILED SYNTAX</span>
                  </div>
                  <p className="text-zinc-800 leading-relaxed">
                    <span className="text-orange-600 font-semibold">/imagine prompt:</span> cinematic 35mm photo of architectural pavilion, anamorphically compressed, f/1.4 Leica glass, Kodak Vision3 500T grain <span className="text-zinc-950 font-bold bg-zinc-200/80 px-1 py-0.5 rounded text-[10px]">--v 6.1</span> <span className="text-zinc-950 font-bold bg-zinc-200/80 px-1 py-0.5 rounded text-[10px]">--style raw</span> <span className="text-zinc-950 font-bold bg-zinc-200/80 px-1 py-0.5 rounded text-[10px]">--ar 16:9</span>
                  </p>
                </div>

                {/* Feature Chips with Orange & Black styling */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-800 pt-1">
                  <div className="p-2.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Prime Optics (14-85mm)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Volumetric Lighting</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Film Chemistry Stocks</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Native `--style raw`</span>
                  </div>
                </div>
              </div>

              {/* White Pill Button from Google Antigravity reference */}
              <Link
                href="/promptcraft/images"
                className="w-full py-2.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-200 hover:border-zinc-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
              >
                <span>Get Started with Image Studio</span>
                <ArrowRight className="w-4 h-4 text-zinc-700 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Video Studio Card: Mainly White with Orange & Black accents */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03),0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-orange-400/80 hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] transition-all duration-300 space-y-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shadow-2xs">
                    <Film className="w-6 h-6 transition-transform group-hover:scale-110" />
                  </div>
                  {/* Black pill badge on white card */}
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-950 text-white font-medium shadow-xs">
                    Runway Gen-3, Sora & Kling
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
                    Dedicated Video Studio
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Temporal workspace designed for narrative multi-beat motion. Coordinate horizontal timeline tracks, camera flight paths, motion intensity (1-10), frame rates, and spatio-temporal coherence.
                  </p>
                </div>

                {/* Live AST Timeline Syntax Preview Mockup */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 font-mono text-[11px] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-1 border-b border-zinc-200/60 font-semibold">
                    <span>TARGET: RUNWAY GEN-3 / SORA</span>
                    <span className="text-orange-600">TIMELINE AST</span>
                  </div>
                  <p className="text-zinc-800 leading-relaxed">
                    <span className="text-orange-600 font-semibold">[0.0s-2.5s:</span> Orbit dolly push-in, 24fps<span className="text-orange-600 font-semibold">]</span> <span className="text-zinc-400">→</span> <span className="text-orange-600 font-semibold">[2.5s-5.0s:</span> Chiaroscuro volumetric shift, motion: +3.2<span className="text-orange-600 font-semibold">]</span> <span className="text-zinc-950 font-bold bg-zinc-200/80 px-1 py-0.5 rounded text-[10px]">--motion 5</span>
                  </p>
                </div>

                {/* Feature Chips with Orange & Black styling */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-800 pt-1">
                  <div className="p-2.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Timeline Multi-Beat Track</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Flight Paths (Dolly/Orbit)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Motion Dynamics (1-10)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50/80 border border-zinc-200/70 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Temporal Brackets</span>
                  </div>
                </div>
              </div>

              {/* White Pill Button from Google Antigravity reference */}
              <Link
                href="/promptcraft/video"
                className="w-full py-2.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-200 hover:border-zinc-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
              >
                <span>Get Started with Video Studio</span>
                <ArrowRight className="w-4 h-4 text-zinc-700 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: HOW IT WORKS — PURE TEXT WITH NO BACKGROUND
        ========================================================================= */}
        <section className="space-y-8">
          <div className="text-center space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-orange-600 font-bold">
              Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
              Sparse MoE neural routing orchestrates optical physics and temporal kinematics with zero server roundtrips.
            </p>
          </div>

          {/* Clean Text Grid with NO Background (Per user request: pure text, zero background) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-600">01</span>
                <span className="text-xs font-mono font-medium text-zinc-400">/</span>
                <h3 className="text-sm font-semibold text-zinc-950">NLP Scene Ingestion</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Extracts focal subjects, material micro-textures, spatial geometry, and kinematic verbs from human concept prompts.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-600">02</span>
                <span className="text-xs font-mono font-medium text-zinc-400">/</span>
                <h3 className="text-sm font-semibold text-zinc-950">Sparse MoE Gating</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Dynamically activates Photographic Optics for still images or Kinematic Vectors for video while unneeded weights draw 0% memory.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-600">03</span>
                <span className="text-xs font-mono font-medium text-zinc-400">/</span>
                <h3 className="text-sm font-semibold text-zinc-950">Directorial Optics</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Synthesizes prime glass optics, motivated chiaroscuro illumination, volumetric particulates, and film emulsion calibration.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-600">04</span>
                <span className="text-xs font-mono font-medium text-zinc-400">/</span>
                <h3 className="text-sm font-semibold text-zinc-950">Syntax Compilation</h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Compiles directly into native target grammar: Midjourney flags (`--v 6.1 --style raw`), Flux shaders, or Kling bracketed motion.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: ZERO-SERVER PRIVACY GUARANTEE
            (Mainly White Card with Orange & Black accents)
        ========================================================================= */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03),0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-zinc-950">
                  Zero-Server Privacy Guarantee
                </h3>
                <p className="text-xs text-zinc-600">
                  Every byte of your creative concepts, API specs, and prompt history stays inside your browser sandbox.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-zinc-950 text-white border border-zinc-800">
              Audit-Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200 space-y-1.5">
              <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-600" />
                <span>Zero Payload APIs</span>
              </div>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                No backend route accepts or records prompt text. Open your browser DevTools Network tab to audit.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200 space-y-1.5">
              <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-600" />
                <span>Local GPU Direct</span>
              </div>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                Neural weights run in an isolated Web Worker thread directly against your local GPU adapter.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200 space-y-1.5">
              <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-orange-600" />
                <span>Permanent Offline Cache</span>
              </div>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                SmolLM2 weights cache in IndexedDB after first load for instant offline subsequent startups.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200 space-y-1.5">
              <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-orange-600" />
                <span>BSL 1.1 Source-Available</span>
              </div>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                Transparent client-side architecture verified by the developer community.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Clean Cohesive White & Zinc Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/promptcraft-fox-clean.png"
              alt="PromptCraft Fox"
              width={20}
              height={20}
              className="object-contain"
            />
            <span className="font-semibold text-zinc-950">PromptCraft Studio</span>
            <span>•</span>
            <span>Part of the DevScratchpad Suite</span>
          </div>

          <div className="flex items-center gap-5 font-medium text-zinc-600">
            <Link href="/promptcraft/images" className="hover:text-orange-600 transition-colors">
              Image Studio
            </Link>
            <Link href="/promptcraft/video" className="hover:text-orange-600 transition-colors">
              Video Studio
            </Link>
            <Link href="/ai-skill-studio" className="hover:text-orange-600 transition-colors">
              AI Skill Studio
            </Link>
            <Link href="/" className="hover:text-orange-600 transition-colors">
              Developer Tools
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
