"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { Download, X, Image as ImageIcon } from "lucide-react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { cn } from "@/lib/utils";

interface ExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

const GRADIENTS = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-cyan-400",
  "from-rose-400 to-red-500",
  "from-amber-200 to-yellow-500",
  "from-slate-800 to-zinc-900" // dark
];

export function ExportImageModal({ isOpen, onClose, code, language }: ExportImageModalProps) {
  const [activeGradient, setActiveGradient] = useState(GRADIENTS[0]);
  const [isExporting, setIsExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!captureRef.current) return;
    try {
      setIsExporting(true);
      
      // We wait a tiny bit to ensure Monaco is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(captureRef.current, {
        quality: 1,
        pixelRatio: 2, // High resolution
        skipFonts: true,
      });
      
      const link = document.createElement("a");
      link.download = `devscratchpad-snippet.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Export as Image</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Main Preview Area */}
          <div className="flex-1 p-6 md:p-10 bg-zinc-100 dark:bg-zinc-950 overflow-auto flex flex-col items-center justify-center">
            
            {/* Capture Target */}
            <div
              ref={captureRef}
              className={cn(
                "p-10 md:p-16 w-full max-w-2xl rounded-sm shadow-xl flex flex-col items-center justify-center transition-all duration-300 relative bg-gradient-to-br",
                activeGradient
              )}
            >
              {/* macOS Window */}
              <div className="w-full rounded-xl shadow-2xl overflow-hidden bg-[#09090B] border border-white/10">
                {/* Window Header */}
                <div className="h-10 px-4 flex items-center gap-2 bg-[#09090B]">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                </div>
                
                {/* Editor Area */}
                <div className="p-4 pt-0">
                  <div className="pointer-events-none" style={{ height: `${Math.min(code.split('\n').length * 21 + 40, 400)}px` }}>
                    <MonacoEditor
                      language={language}
                      value={code}
                      theme="devscratchpad-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        lineNumbers: "off",
                        folding: false,
                        scrollBeyondLastLine: false,
                        renderLineHighlight: "none",
                        hideCursorInOverviewRuler: true,
                        overviewRulerBorder: false,
                        scrollbar: {
                          vertical: 'hidden',
                          horizontal: 'hidden'
                        },
                        fontSize: 15,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Watermark */}
              <div className="absolute bottom-4 right-6 text-white/80 font-medium text-sm drop-shadow-md">
                tools.saadengineer.works
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-6 bg-white dark:bg-zinc-900">
            <div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">Theme</h3>
              <div className="grid grid-cols-2 gap-2">
                {GRADIENTS.map((grad, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGradient(grad)}
                    className={cn(
                      "h-12 rounded-lg bg-gradient-to-br transition-transform hover:scale-105 active:scale-95",
                      grad,
                      activeGradient === grad ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900" : ""
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? "Exporting..." : "Download Image"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
