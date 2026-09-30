"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  UploadCloud, 
  FolderGit2, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Server,
  Globe,
  BookOpen, 
  FileText, 
  Users, 
  X,
  Lock,
  CheckCircle2,
  Download,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllSkills } from "@/data/skills/skillsData";
import { SkillItem, UserUploadedSkill, SkillCategory, SkillPlatform } from "@/data/skills/skillTypes";
import { loadFromStorageEnvelope } from "@/app/claude-skills/lib/storageEnvelope";
import { copyToClipboard } from "@/app/claude-skills/lib/ruleGenerator";
import { UploadSkillModal } from "@/components/ui/UploadSkillModal";
import { 
  CursorIcon, 
  ClaudeIcon, 
  WindsurfIcon, 
  CopilotIcon, 
  GeminiIcon, 
  OpenAIIcon 
} from "@/components/icons/AssistantBrandIcons";

const USER_SKILLS_STORAGE_KEY = "devscratchpad_user_skills_v1";

export type SortOption = "popular" | "score" | "recent";

export const PLATFORMS: { id: SkillPlatform | "all"; label: string; mobileLabel: string }[] = [
  { id: "all", label: "All Platforms", mobileLabel: "All" },
  { id: "cursor", label: "Cursor Rules (.mdc)", mobileLabel: "Cursor" },
  { id: "claude", label: "Claude Code (SKILL.md)", mobileLabel: "Claude" },
  { id: "gemini", label: "Google Gemini / AGY", mobileLabel: "Gemini" },
  { id: "windsurf", label: "Windsurf Cascade", mobileLabel: "Windsurf" },
  { id: "copilot", label: "GitHub Copilot", mobileLabel: "Copilot" },
  { id: "openai", label: "ChatGPT", mobileLabel: "ChatGPT" },
  { id: "mcp", label: "MCP Server (JSON)", mobileLabel: "MCP" },
  { id: "universal", label: "Universal (Cross-IDE)", mobileLabel: "Universal" }
];

export function SkillsLibraryClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SkillCategory | "All">("All");
  const [activeSource, setActiveSource] = useState<string>("All");
  const [activePlatform, setActivePlatform] = useState<SkillPlatform | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [inspectSkill, setInspectSkill] = useState<SkillItem | null>(null);
  const [userSkills, setUserSkills] = useState<UserUploadedSkill[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Skill Uploaded!");

  useEffect(() => {
    setMounted(true);
    const stored = loadFromStorageEnvelope<{ skills: UserUploadedSkill[] }>(USER_SKILLS_STORAGE_KEY);
    if (stored?.skills) {
      setUserSkills(stored.skills);
    }
  }, []);

  const allSkills = useMemo(() => {
    return [...getAllSkills(), ...userSkills];
  }, [userSkills]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allSkills.length };
    allSkills.forEach(s => {
      counts[s.primaryPlatform] = (counts[s.primaryPlatform] || 0) + 1;
    });
    return counts;
  }, [allSkills]);

  const sourceCounts = useMemo(() => {
    return {
      All: allSkills.length,
      Official: allSkills.filter(s => s.isOfficial).length,
      Community: allSkills.filter(s => !s.isOfficial).length,
      "My Uploads": userSkills.length,
    };
  }, [allSkills, userSkills]);

  const filteredSkills = useMemo(() => {
    const list = allSkills.filter(skill => {
      // Source Filter
      if (activeSource === "My Uploads" && !skill.isCustom) return false;
      if (activeSource === "Official" && !skill.isOfficial) return false;
      if (activeSource === "Community" && skill.isOfficial) return false;
      
      // Platform Filter (Strictly filter to the selected model/platform)
      if (activePlatform !== "all") {
        if (skill.primaryPlatform !== activePlatform) {
          return false;
        }
      }

      // Category Filter
      if (activeCategory !== "All" && skill.category !== activeCategory) return false;

      // Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          skill.title.toLowerCase().includes(query) ||
          skill.description.toLowerCase().includes(query) ||
          skill.tags.some(t => t.toLowerCase().includes(query)) ||
          skill.triggers.some(t => t.toLowerCase().includes(query))
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "popular") {
        return (b.stars || 0) - (a.stars || 0);
      }
      if (sortBy === "score") {
        return b.auditScore - a.auditScore;
      }
      if (sortBy === "recent") {
        if (a.uploadedAt && b.uploadedAt) {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        }
        if (a.uploadedAt) return -1;
        if (b.uploadedAt) return 1;
        return (b.stars || 0) - (a.stars || 0);
      }
      return 0;
    });
  }, [allSkills, searchQuery, activeCategory, activeSource, activePlatform, sortBy]);

  const handleCopyCommand = (slug: string) => {
    copyToClipboard(`npx devscratchpad add ${slug}`);
    setCopiedId(slug);
    setToastMessage(`Copied: npx devscratchpad add ${slug}`);
    setShowToast(true);
    setTimeout(() => {
      setCopiedId(null);
      setShowToast(false);
    }, 2500);
  };

  const handleDownloadSkill = (skill: SkillItem) => {
    let filename = skill.fileTarget ? skill.fileTarget.split("/").pop() || `${skill.slug}.md` : `${skill.slug}.md`;
    if (!skill.fileTarget) {
      if (skill.primaryPlatform === "cursor") filename = `${skill.slug}.mdc`;
      else if (skill.primaryPlatform === "windsurf") filename = ".windsurfrules";
      else if (skill.primaryPlatform === "copilot") filename = "copilot-instructions.md";
      else if (skill.primaryPlatform === "mcp") filename = "claude_desktop_config.json";
      else if (skill.primaryPlatform === "openai") filename = `chatgpt-${skill.slug}.txt`;
      else if (skill.primaryPlatform === "claude" || skill.primaryPlatform === "gemini") filename = "SKILL.md";
    }

    const blob = new Blob([skill.rawContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedId(skill.id);
    setToastMessage(`Downloaded ${filename} successfully!`);
    setShowToast(true);
    setTimeout(() => {
      setDownloadedId(null);
      setShowToast(false);
    }, 2500);
  };

  const handleOpenInStudio = (skill: SkillItem) => {
    router.push(`/ai-skill-studio?preset=${skill.slug}`);
  };

  const getPlatformTheme = (platform: SkillPlatform) => {
    switch (platform) {
      case "gemini":
        return {
          hoverText: "group-hover:text-blue-600",
          bullet: "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400",
          downloadHover: "hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/80 hover:to-indigo-50/80 hover:text-blue-700",
          checkText: "text-blue-600",
          badge: "bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-sky-50/90 text-blue-900 border-blue-200/80",
          iconBg: "bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 border-blue-200 shadow-xs",
          cardHover: "hover:border-blue-300 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]",
        };
      case "cursor":
        return {
          hoverText: "group-hover:text-sky-600",
          bullet: "bg-gradient-to-r from-blue-600 to-cyan-500",
          downloadHover: "hover:border-sky-400 hover:bg-gradient-to-br hover:from-blue-50/80 hover:to-cyan-50/80 hover:text-sky-700",
          checkText: "text-sky-600",
          badge: "bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 text-sky-950 border-sky-200/80",
          iconBg: "bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-100 border-sky-200 shadow-xs",
          cardHover: "hover:border-sky-300 hover:shadow-[0_8px_30px_rgba(2,132,199,0.08)]",
        };
      case "openai":
        return {
          hoverText: "group-hover:text-zinc-950",
          bullet: "bg-zinc-800",
          downloadHover: "hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-950",
          checkText: "text-zinc-950",
          badge: "bg-zinc-100 text-zinc-800 border-zinc-200",
          iconBg: "bg-zinc-100 border-zinc-200",
          cardHover: "hover:border-zinc-400 hover:shadow-sm",
        };
      case "claude":
        return {
          hoverText: "group-hover:text-[#d9653b]",
          bullet: "bg-[#d9653b]",
          downloadHover: "hover:border-[#d9653b] hover:bg-orange-50/60 hover:text-[#d9653b]",
          checkText: "text-[#d9653b]",
          badge: "bg-orange-50 text-orange-700 border-orange-200",
          iconBg: "bg-orange-50/80 border-orange-200",
          cardHover: "hover:border-orange-300 hover:shadow-[0_8px_30px_rgba(234,88,12,0.08)]",
        };
      case "windsurf":
        return {
          hoverText: "group-hover:text-[#0d9488]",
          bullet: "bg-[#0d9488]",
          downloadHover: "hover:border-[#0d9488] hover:bg-teal-50/60 hover:text-[#0d9488]",
          checkText: "text-[#0d9488]",
          badge: "bg-teal-50 text-teal-700 border-teal-200",
          iconBg: "bg-teal-50/80 border-teal-200",
          cardHover: "hover:border-teal-300 hover:shadow-[0_8px_30px_rgba(13,148,136,0.08)]",
        };
      case "copilot":
        return {
          hoverText: "group-hover:text-[#6366f1]",
          bullet: "bg-[#6366f1]",
          downloadHover: "hover:border-[#6366f1] hover:bg-indigo-50/60 hover:text-[#6366f1]",
          checkText: "text-[#6366f1]",
          badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
          iconBg: "bg-indigo-50/80 border-indigo-200",
          cardHover: "hover:border-indigo-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)]",
        };
      case "mcp":
        return {
          hoverText: "group-hover:text-zinc-950",
          bullet: "bg-zinc-800",
          downloadHover: "hover:border-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
          checkText: "text-zinc-950",
          badge: "bg-zinc-100 text-zinc-800 border-zinc-200",
          iconBg: "bg-zinc-100/90 border-zinc-200 shadow-xs",
          cardHover: "hover:border-zinc-400 hover:shadow-[0_8px_30px_rgba(24,24,27,0.06)]",
        };
      case "universal":
      default:
        return {
          hoverText: "group-hover:text-zinc-950",
          bullet: "bg-zinc-600",
          downloadHover: "hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-950",
          checkText: "text-zinc-950",
          badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
          iconBg: "bg-zinc-100 border-zinc-200",
          cardHover: "hover:border-zinc-300 hover:shadow-sm",
        };
    }
  };

  const getPlatformActiveClasses = (platformId: string) => {
    switch (platformId) {
      case "cursor":
        return "bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 text-sky-950 border-sky-300 font-semibold shadow-xs";
      case "gemini":
        return "bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-indigo-950 border-indigo-300 font-semibold shadow-xs";
      case "claude":
        return "bg-orange-50 text-orange-900 border-orange-200 font-semibold shadow-xs";
      case "windsurf":
        return "bg-teal-50 text-teal-900 border-teal-200 font-semibold shadow-xs";
      case "copilot":
        return "bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold shadow-xs";
      case "mcp":
        return "bg-zinc-100 text-zinc-950 border-zinc-300 font-semibold shadow-xs";
      default:
        return "bg-zinc-100 text-zinc-950 border-zinc-300 font-semibold shadow-xs";
    }
  };

  const getPlatformActiveBadgeClasses = (platformId: string) => {
    switch (platformId) {
      case "cursor":
        return "bg-sky-100 text-sky-800";
      case "gemini":
        return "bg-indigo-100 text-indigo-800";
      case "claude":
        return "bg-orange-100 text-orange-800";
      case "windsurf":
        return "bg-teal-100 text-teal-800";
      case "copilot":
        return "bg-indigo-100 text-indigo-800";
      case "mcp":
        return "bg-zinc-200 text-zinc-800";
      default:
        return "bg-zinc-200 text-zinc-800";
    }
  };

  const renderPlatformBrandIcon = (platform: SkillPlatform, className = "w-4 h-4") => {
    switch (platform) {
      case "cursor":
        return <CursorIcon className={className} />;
      case "claude":
        return <ClaudeIcon className={className} />;
      case "windsurf":
        return <WindsurfIcon className={cn("text-[#0d9488]", className)} />;
      case "copilot":
        return <CopilotIcon className={cn("text-[#6366f1]", className)} />;
      case "gemini":
        return <GeminiIcon className={className} />;
      case "openai":
        return <OpenAIIcon className={cn("text-[#10a37f]", className)} />;
      case "mcp":
        return <Server className={cn("text-zinc-700", className)} />;
      case "universal":
        return <Globe className={cn("text-zinc-500", className)} />;
      default:
        return <FileText className={cn("text-zinc-500", className)} />;
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-gemini selection:bg-orange-500/20 selection:text-orange-950">
      
      {/* Front-Side Hero Banner */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Minimalist AI Skill Studio Logo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-zinc-200 bg-white flex items-center justify-center shrink-0">
              <img 
                src="/ai-skill-icon.png" 
                alt="AI Skill Studio Logo" 
                className="w-10 h-8 sm:w-11 sm:h-9 object-contain" 
              />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-gemini leading-none">
                  Skill
                </h1>
                <span className="bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-gemini">
                  HUB
                </span>
              </div>
              <p className="text-sm font-semibold text-zinc-700 mt-1 font-gemini">
                Multi-Platform Agent Skills
              </p>
              <p className="text-xs text-zinc-500 max-w-xl mt-0.5 font-gemini">
                Curated, production-grade rules and skills across Cursor, Claude, Windsurf, Copilot, ChatGPT & Gemini.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-medium py-2.5 px-5 rounded-xl border border-zinc-900 transition-colors text-sm cursor-pointer active:scale-98 font-gemini shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-white" />
              Upload Custom Skill
            </button>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-gemini">
              <Lock className="w-3.5 h-3.5 text-zinc-400" /> 100% Local Browser Privacy
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Layout */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Clean Minimalist Left Sidebar (Desktop) */}
        <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col gap-6">
          
          {/* Sources Filter */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-3 font-gemini">Sources</h3>
            <div className="flex flex-col gap-0.5">
              {["All", "Official", "Community", "My Uploads"].map((src) => (
                <button
                  key={src}
                  onClick={() => setActiveSource(activeSource === src ? "All" : src)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer font-gemini",
                    activeSource === src 
                      ? "bg-orange-50 text-orange-800 border border-orange-200 font-semibold" 
                      : "text-zinc-600 hover:text-black hover:bg-zinc-100 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {src === "All" && <Layers className="w-3.5 h-3.5 opacity-60 text-zinc-500" />}
                      {src === "Official" && <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />}
                      {src === "Community" && <Users className="w-3.5 h-3.5 opacity-60 text-zinc-500" />}
                      {src === "My Uploads" && <FolderGit2 className="w-3.5 h-3.5 text-orange-600" />}
                    </div>
                    <span className="truncate">{src}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-1.5",
                    activeSource === src ? "bg-orange-100 text-orange-800" : "bg-zinc-100 text-zinc-500"
                  )}>
                    {sourceCounts[src as keyof typeof sourceCounts] || 0}
                  </span>
                </button>
              ))}
            </div>
            <div className="px-3 pt-1 text-[11px] text-zinc-400 font-gemini">
              No account required • 100% local
            </div>
          </div>

          {/* Target Platform Filter */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-3 font-gemini">Target Platform</h3>
            <div className="flex flex-col gap-0.5">
              {PLATFORMS.map((plat) => {
                const isActive = activePlatform === plat.id;
                return (
                  <button
                    key={plat.id}
                    onClick={() => setActivePlatform(activePlatform === plat.id ? "all" : (plat.id as SkillPlatform | "all"))}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer font-gemini border",
                      isActive 
                        ? getPlatformActiveClasses(plat.id)
                        : "text-zinc-600 hover:text-black hover:bg-zinc-100 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {plat.id === "all" ? (
                          <Layers className="w-3.5 h-3.5 opacity-60 text-zinc-500" />
                        ) : (
                          renderPlatformBrandIcon(plat.id as SkillPlatform, "w-3.5 h-3.5")
                        )}
                      </div>
                      <span className="truncate">{plat.label}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-1.5",
                      isActive 
                        ? getPlatformActiveBadgeClasses(plat.id)
                        : "bg-zinc-100 text-zinc-500"
                    )}>
                      {platformCounts[plat.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories Filter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-gemini">Categories</h3>
              {(activeSource !== "All" || activePlatform !== "all" || activeCategory !== "All" || searchQuery.trim() !== "") && (
                <button
                  onClick={() => {
                    setActiveSource("All");
                    setActivePlatform("all");
                    setActiveCategory("All");
                    setSearchQuery("");
                  }}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {["All", "Frontend & UI", "Backend & APIs", "Database & SQL", "DevOps & Cloud", "Mobile & Apps", "Testing & QA", "AI & Agents", "Security & Auth", "Architecture & Governance"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? "All" : (cat as SkillCategory | "All"))}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer font-gemini",
                    activeCategory === cat 
                      ? "bg-orange-50 text-orange-800 border border-orange-200 font-semibold" 
                      : "text-zinc-600 hover:text-black hover:bg-zinc-100 border border-transparent"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content: Search + Cards Grid */}
        <main className="flex-1 flex flex-col gap-5 min-w-0">
          
          {/* Mobile-Only Platform Selector Carousel */}
          <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-1 scrollbar-none flex items-center gap-1.5">
            {PLATFORMS.map((plat) => {
              const isActive = activePlatform === plat.id;
              return (
                <button
                  key={plat.id}
                  onClick={() => setActivePlatform(activePlatform === plat.id ? "all" : (plat.id as SkillPlatform | "all"))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all border cursor-pointer font-gemini",
                    isActive
                      ? getPlatformActiveClasses(plat.id)
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-black shadow-2xs"
                  )}
                >
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                    {plat.id === "all" ? (
                      <Layers className="w-3 h-3 opacity-60 text-zinc-500" />
                    ) : (
                      renderPlatformBrandIcon(plat.id as SkillPlatform, "w-3 h-3")
                    )}
                  </div>
                  <span>{plat.mobileLabel}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isActive ? getPlatformActiveBadgeClasses(plat.id) : "bg-zinc-100 text-zinc-500"
                  )}>
                    {platformCounts[plat.id] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Top Search Bar + Mobile Filter Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-orange-600 transition-colors" />
              </div>
              <input
                type="text"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 pl-12 pr-10 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-gemini"
                placeholder="Search skills, procedures, tags, or trigger keywords (Cmd+K)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <kbd className="hidden sm:inline-flex items-center gap-1 bg-zinc-100 border border-zinc-200 text-zinc-500 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium">
                    <span className="text-[12px]">⌘</span>K
                  </kbd>
                </div>
              )}
            </div>

            {/* Mobile Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className={cn(
                "lg:hidden flex items-center gap-1.5 px-3 py-3 rounded-2xl border text-xs font-semibold transition-all shrink-0 cursor-pointer font-gemini shadow-xs",
                (activeSource !== "All" || activeCategory !== "All" || isMobileFiltersOpen)
                  ? "bg-orange-50 text-orange-900 border-orange-300"
                  : "bg-zinc-50 hover:bg-white text-zinc-700 border-zinc-200"
              )}
            >
              <SlidersHorizontal className="w-4 h-4 text-zinc-600" />
              <span className="hidden xs:inline">Filters</span>
              {(activeSource !== "All" || activeCategory !== "All") && (
                <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
              )}
            </button>
          </div>

          {/* Mobile Collapsible Filters Panel */}
          {isMobileFiltersOpen && (
            <div className="lg:hidden p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 font-gemini">Filters & Sources</span>
                {(activeSource !== "All" || activeCategory !== "All" || activePlatform !== "all" || searchQuery !== "") && (
                  <button
                    onClick={() => {
                      setActiveSource("All");
                      setActiveCategory("All");
                      setActivePlatform("all");
                      setSearchQuery("");
                    }}
                    className="text-xs text-orange-600 font-bold hover:underline cursor-pointer font-gemini"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Sources */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5 font-gemini">Source</span>
                <div className="flex flex-wrap gap-1.5">
                  {["All", "Official", "Community", "My Uploads"].map((src) => (
                    <button
                      key={src}
                      onClick={() => setActiveSource(activeSource === src ? "All" : src)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer font-gemini",
                        activeSource === src
                          ? "bg-orange-50 text-orange-900 border-orange-300 font-semibold"
                          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      {src} ({sourceCounts[src as keyof typeof sourceCounts] || 0})
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5 font-gemini">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {["All", "Frontend & UI", "Backend & APIs", "Database & SQL", "DevOps & Cloud", "Mobile & Apps", "Testing & QA", "AI & Agents", "Security & Auth", "Architecture & Governance"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? "All" : (cat as SkillCategory | "All"))}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer font-gemini",
                        activeCategory === cat
                          ? "bg-orange-50 text-orange-900 border-orange-300 font-semibold"
                          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Stats + Custom Sleek Sort Dropdown */}
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-xs sm:text-sm font-medium text-zinc-500 font-gemini">
              Showing <span className="text-zinc-950 font-bold">{filteredSkills.length}</span> battle-tested skills
            </h2>

            {/* Custom Sleek Dropdown (Zero Native Blue Highlight) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:text-black transition-colors cursor-pointer shadow-2xs font-gemini"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400 hidden xs:inline">Sort:</span>
                <span className="font-semibold text-zinc-900">
                  {sortBy === "score" ? "Highest Score" : sortBy === "popular" ? "Most Popular" : "Recently Added"}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform duration-150", isSortOpen && "rotate-180")} />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-40 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {[
                      { id: "popular", label: "Most Popular" },
                      { id: "score", label: "Highest Score" },
                      { id: "recent", label: "Recently Added" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id as SortOption);
                          setIsSortOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer font-gemini",
                          sortBy === opt.id
                            ? "bg-zinc-100 font-semibold text-zinc-900"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        )}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-orange-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Minimalistic Non-Slop Skill Cards Grid */}
          {filteredSkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-zinc-200 shadow-xs">
                <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2 font-gemini">No skills found</h3>
              <p className="text-zinc-500 max-w-sm text-sm font-gemini">
                We couldn&apos;t find any skills matching &ldquo;{searchQuery}&rdquo;. Try adjusting your search query or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredSkills.map((skill) => {
                const theme = getPlatformTheme(skill.primaryPlatform);
                return (
                  <div 
                    key={skill.id} 
                    className={cn(
                      "bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 group relative",
                      theme.cardHover
                    )}
                  >
                    <div>
                      {/* Top Row: Platform Badge + Target Filename + Direct Download Icon */}
                      <div className="flex items-center justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center shrink-0", theme.iconBg)}>
                            {renderPlatformBrandIcon(skill.primaryPlatform, "w-3 h-3")}
                          </div>
                          <span className="text-xs font-semibold text-zinc-800 font-gemini shrink-0">
                            {skill.primaryPlatform === "cursor" ? "Cursor .mdc" :
                             skill.primaryPlatform === "claude" ? "Claude Code" :
                             skill.primaryPlatform === "windsurf" ? "Windsurf" :
                             skill.primaryPlatform === "copilot" ? "GitHub Copilot" :
                             skill.primaryPlatform === "gemini" ? "Google Gemini" :
                             skill.primaryPlatform === "openai" ? "ChatGPT" :
                             skill.primaryPlatform === "mcp" ? "MCP Server" : "Universal"}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[110px] xs:max-w-[160px] sm:max-w-none">
                            {skill.fileTarget ? skill.fileTarget.split("/").pop() : `${skill.slug}.md`}
                          </span>
                        </div>

                        {/* Prominent Direct Download Icon Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSkill(skill);
                          }}
                          className={cn(
                            "w-8 h-8 rounded-lg border border-zinc-200 text-zinc-600 flex items-center justify-center transition-all cursor-pointer shrink-0",
                            theme.downloadHover
                          )}
                          title={`Download native file (${skill.fileTarget || skill.slug})`}
                        >
                          {downloadedId === skill.id ? (
                            <Check className={cn("w-4 h-4", theme.checkText)} />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Skill Title - Matches Model Icon Color On Hover */}
                      <h3 
                        className={cn(
                          "text-[15px] font-bold text-zinc-950 transition-colors leading-snug tracking-tight mb-1.5 font-gemini line-clamp-2",
                          theme.hoverText
                        )} 
                        title={skill.title}
                      >
                        {skill.title}
                      </h3>

                      {/* Description (Full natural text flow without truncation) */}
                      <p className="text-xs text-zinc-600 leading-relaxed mb-3 font-gemini">
                        {skill.description}
                      </p>

                      {/* Minimalistic Prominent Capability Highlight (Matches Model Color) */}
                      {skill.capabilities && skill.capabilities.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-zinc-700 mb-4 font-gemini">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", theme.bullet)} />
                          <span className="font-medium leading-relaxed">{skill.capabilities[0].replace(/^[✅•\s-]+/, "")}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Row: Clean Open in Studio (No Lightning Logo) + Copy CLI + Inspect */}
                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 mt-auto">
                      <button 
                        onClick={() => handleOpenInStudio(skill)}
                        className="flex-1 flex items-center justify-center bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer font-gemini"
                      >
                        Open in Studio
                      </button>
                      
                      <button 
                        onClick={() => handleCopyCommand(skill.slug)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 transition-colors cursor-pointer"
                        title="Copy CLI command"
                      >
                        {copiedId === skill.slug ? (
                          <Check className={cn("w-3.5 h-3.5", theme.checkText)} />
                        ) : (
                          <Terminal className="w-3.5 h-3.5" />
                        )}
                      </button>
                      
                      <button 
                        onClick={() => setInspectSkill(skill)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 transition-colors cursor-pointer"
                        title="Inspect rule code"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Success Notification Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-white border border-zinc-200 text-zinc-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-900">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Upload Custom Skill Modal */}
      <UploadSkillModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={(newSkill) => {
          setUserSkills([newSkill, ...userSkills]);
          setIsUploadModalOpen(false);
          setActiveSource("My Uploads");
          setToastMessage("Custom skill uploaded and saved!");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
        }}
      />

      {/* Inspect Skill Drawer / Modal */}
      {inspectSkill && (() => {
        const inspectTheme = getPlatformTheme(inspectSkill.primaryPlatform);
        return (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setInspectSkill(null)}
          >
            <div 
              className="w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm", inspectTheme.iconBg)}>
                    {renderPlatformBrandIcon(inspectSkill.primaryPlatform, "w-5 h-5")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-zinc-900">{inspectSkill.title}</h2>
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold uppercase border", inspectTheme.badge)}>
                        {inspectSkill.primaryPlatform}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {inspectSkill.sourceOrganization} • {inspectSkill.category} • Audit Score: <span className="text-zinc-900 font-bold">{inspectSkill.auditScore}/100</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadSkill(inspectSkill)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-zinc-200", inspectTheme.downloadHover)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      copyToClipboard(inspectSkill.rawContent);
                      setCopiedRaw(true);
                      setTimeout(() => setCopiedRaw(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-zinc-200"
                  >
                    {copiedRaw ? <Check className={cn("w-3.5 h-3.5", inspectTheme.checkText)} /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRaw ? "Copied!" : "Copy Code"}
                  </button>
                  <button
                    onClick={() => {
                      handleOpenInStudio(inspectSkill);
                      setInspectSkill(null);
                    }}
                    className="flex items-center justify-center px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer font-gemini"
                  >
                    Open in Studio
                  </button>
                  <button
                    onClick={() => setInspectSkill(null)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Raw Code */}
              <div className="p-6 overflow-y-auto bg-zinc-50/50 font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap select-text">
                <pre className="p-4 rounded-xl bg-white border border-zinc-200 overflow-x-auto text-[13px] text-zinc-800 shadow-2xs">
                  {inspectSkill.rawContent}
                </pre>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50/80 flex items-center justify-between text-xs text-zinc-500">
                <span>Supports formats: {inspectSkill.targetFormats.join(", ")}</span>
                <span className="font-mono text-[11px] text-zinc-400">Target: {inspectSkill.fileTarget || `${inspectSkill.slug}.md`}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
