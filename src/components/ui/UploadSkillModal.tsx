"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  UploadCloud, 
  FileCode2, 
  CheckCircle2, 
  AlertCircle,
  Wand2,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserUploadedSkill, SkillPlatform } from "@/data/skills/skillTypes";
import { auditRuleQuality } from "@/app/claude-skills/lib/ruleAuditor";
import { saveToStorageEnvelope, loadFromStorageEnvelope } from "@/app/claude-skills/lib/storageEnvelope";

const USER_SKILLS_STORAGE_KEY = "devscratchpad_user_skills_v1";

interface UploadSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (newSkill: UserUploadedSkill) => void;
}

export function UploadSkillModal({ isOpen, onClose, onUploadComplete }: UploadSkillModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Frontend & UI");
  const [primaryPlatform, setPrimaryPlatform] = useState<SkillPlatform>("cursor");
  const [tags, setTags] = useState("");
  
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFileContent = (content: string, name: string) => {
    setFileContent(content);
    setFileName(name);
    setIsParsing(true);
    setError(null);
    
    // Auto-detect platform from filename and content
    const lowerName = name.toLowerCase();
    const lowerContent = content.toLowerCase();
    let detectedPlatform: SkillPlatform = "universal";
    
    if (lowerName.endsWith(".mdc") || lowerName.includes("cursor")) {
      detectedPlatform = "cursor";
    } else if (lowerName.endsWith(".windsurfrules") || lowerName.includes("windsurf")) {
      detectedPlatform = "windsurf";
    } else if (lowerName.includes("copilot")) {
      detectedPlatform = "copilot";
    } else if (lowerName.endsWith(".json") || lowerName.includes("mcp")) {
      detectedPlatform = "mcp";
    } else if (lowerContent.includes("gemini") || lowerContent.includes("antigravity")) {
      detectedPlatform = "gemini";
    } else if (lowerContent.includes("openai") || lowerContent.includes("gpt")) {
      detectedPlatform = "openai";
    } else if (lowerName.includes("claude") || lowerName === "skill.md" || lowerContent.includes("claude")) {
      detectedPlatform = "claude";
    }

    setPrimaryPlatform(detectedPlatform);

    // Auto-parsing YAML frontmatter
    setTimeout(() => {
      const nameMatch = content.match(/name:\s*([^\r\n]+)/);
      const descMatch = content.match(/description:\s*([^\r\n]+)/);
      
      if (nameMatch) setTitle(nameMatch[1].trim().replace(/^['"]|['"]$/g, ""));
      else setTitle(name.replace(/\.(mdc|md|json|txt|windsurfrules)$/, ""));
      
      if (descMatch) setDescription(descMatch[1].trim().replace(/^['"]|['"]$/g, ""));
      
      setIsParsing(false);
    }, 400);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          processFileContent(evt.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          processFileContent(evt.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !fileContent.trim()) {
      setError("Title and file content are required.");
      return;
    }

    let format = "skill_md" as any;
    if (primaryPlatform === "cursor" || fileName.endsWith(".mdc")) format = "cursor_mdc";
    else if (primaryPlatform === "windsurf" || fileName.endsWith(".windsurfrules")) format = "windsurf_cascade";
    else if (primaryPlatform === "copilot" || fileName.includes("copilot")) format = "copilot_instructions";
    else if (primaryPlatform === "openai") format = "openai_instructions";
    else if (primaryPlatform === "gemini") format = "gemini_prompts";
    else if (primaryPlatform === "mcp" || fileName.endsWith(".json")) format = "mcp_json";

    const auditReport = auditRuleQuality({
      content: fileContent,
      format,
    });

    const newSkill: UserUploadedSkill = {
      id: `custom-${Date.now()}`,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: title.trim(),
      description: description.trim() || "User uploaded custom skill.",
      sourceType: "user-uploaded",
      sourceOrganization: "User Upload",
      primaryPlatform,
      author: "Me",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      category: category as any,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      triggers: [title.toLowerCase()],
      targetFormats: [format, "skill_md"],
      rawContent: fileContent,
      auditScore: auditReport.overallScore,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auditGrade: auditReport.gradeLabel as any,
      stars: 0,
      isPopular: false,
      isOfficial: false,
      isCustom: true,
      uploadedAt: new Date().toISOString(),
    };

    const stored = loadFromStorageEnvelope<{ skills: UserUploadedSkill[] }>(USER_SKILLS_STORAGE_KEY) || { skills: [] };
    const updatedSkills = [newSkill, ...(stored.skills || [])];
    
    saveToStorageEnvelope(USER_SKILLS_STORAGE_KEY, { skills: updatedSkills });
    
    onUploadComplete(newSkill);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-zinc-900" />
            Upload Custom Skill
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          {/* Dropzone */}
          {!fileContent ? (
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                dragActive ? "border-orange-500 bg-orange-50/50" : "border-zinc-300 hover:border-orange-400 bg-zinc-50/60"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".md,.mdc,.json,.txt,.windsurfrules"
              />
              <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center mb-4 shadow-sm">
                <FileCode2 className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Drag & Drop Skill File</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm">
                Upload a Cursor <span className="font-mono text-xs font-semibold text-zinc-700">.mdc</span>, Claude <span className="font-mono text-xs font-semibold text-zinc-700">.md</span>, Windsurf, or MCP config file.
              </p>
              <button className="bg-zinc-900 hover:bg-black text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition-colors">
                Browse Files
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* File Info Banner */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                    <FileCode2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">{fileName}</h4>
                    <p className="text-xs text-zinc-500">
                      {isParsing ? "Analyzing frontmatter..." : `Parsed successfully (${fileContent.length} chars)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isParsing ? (
                    <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  )}
                  <button 
                    onClick={() => { setFileContent(""); setFileName(""); setTitle(""); setDescription(""); }}
                    className="text-xs text-zinc-600 hover:text-black underline underline-offset-2 ml-2"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 gap-4">
                {error && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-orange-600" />
                    {error}
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Skill Title *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                      placeholder="e.g. Next.js App Router Strict"
                    />
                    {!isParsing && (
                      <div className="absolute right-3 top-2.5 pointer-events-none" title="Auto-filled from frontmatter">
                        <Wand2 className="w-4 h-4 text-orange-600" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Description</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none text-sm"
                    placeholder="Describe what this skill enforces..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Target Platform *</label>
                    <select 
                      value={primaryPlatform}
                      onChange={e => setPrimaryPlatform(e.target.value as SkillPlatform)}
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    >
                      <option value="cursor">Cursor Rules (.mdc)</option>
                      <option value="claude">Claude Code (SKILL.md)</option>
                      <option value="gemini">Google Gemini / Antigravity</option>
                      <option value="windsurf">Windsurf Cascade (.windsurfrules)</option>
                      <option value="copilot">GitHub Copilot (.md)</option>
                      <option value="openai">OpenAI Instructions</option>
                      <option value="mcp">MCP Config (JSON)</option>
                      <option value="universal">Universal / Polyglot</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Category</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    >
                      <option>Frontend & UI</option>
                      <option>Backend & APIs</option>
                      <option>Fullstack & DB</option>
                      <option>DevOps & Cloud</option>
                      <option>Mobile & Apps</option>
                      <option>Database & SQL</option>
                      <option>Security & Auth</option>
                      <option>Testing & QA</option>
                      <option>Architecture & Governance</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Tags</label>
                    <input 
                      type="text" 
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                      placeholder="react, typescript, ui"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3 flex gap-3 mt-4">
                <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0" />
                <div className="text-xs text-zinc-700">
                  <span className="font-semibold text-zinc-900 block mb-0.5">100% Local Browser Privacy</span>
                  Your skill files never leave your device. They are parsed, audited, and saved locally in your browser storage.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/60 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!fileContent || isParsing}
            onClick={handleSave}
            className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-950 text-white font-semibold px-6 py-2 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 cursor-pointer"
          >
            Save to My Skills
          </button>
        </div>
      </div>
    </div>
  );
}
