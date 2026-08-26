"use client";

import { useState, useEffect } from "react";
import { MonacoDiffEditor } from "@/components/MonacoEditor";
import { Trash2, Link as LinkIcon } from "lucide-react";
import { addSnapshot } from "@/lib/storage";

export function DiffCheckerTool() {
  const [original, setOriginal] = useState<string>("{\n  \"version\": 1,\n  \"name\": \"DevScratchpad\"\n}");
  const [modified, setModified] = useState<string>("{\n  \"version\": 2,\n  \"name\": \"DevScratchpad\",\n  \"privacy\": \"zero-server\"\n}");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("diff", "Diff Checker", original, modified);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [original, modified]);

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Diff Checker</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Compare text and code side-by-side or inline</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <button
            onClick={() => {
              try {
                window.location.hash = 'data=' + btoa(original);
              } catch {}
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-2xs"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button 
            onClick={() => { setOriginal(""); setModified(""); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-red-600 rounded text-xs font-medium transition-colors border border-slate-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Both</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white w-full max-w-full overflow-x-hidden">
        <div className="flex h-8 bg-[#f8fafc] border-b border-[#e2e8f0] shrink-0 text-xs text-slate-500 font-medium uppercase tracking-wider">
           <div className="flex-1 px-3 flex items-center border-r border-[#e2e8f0]">
             <span className="text-[11px]">Original Text</span>
           </div>
           <div className="flex-1 px-3 flex items-center">
             <span className="text-[11px]">Modified Text</span>
           </div>
        </div>
        <div className="flex-1 relative pt-2 w-full max-w-full overflow-x-hidden">
          <MonacoDiffEditor
            height="100%"
            theme="vs"
            original={original}
            modified={modified}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              renderSideBySide: !isMobile,
              wordWrap: "on",
              readOnly: false,
              originalEditable: true
            }}
          />
        </div>
      </div>
    </div>
  );
}
