"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  X,
  Check,
  AlertCircle,
  Container,
  ShieldCheck,
  Server,
  Layers,
} from "lucide-react";
import {
  inspectDockerCompose,
  ParsedDockerCompose,
} from "../lib/dockerParser";
import { OutputFormat } from "../lib/ruleGenerator";

interface DockerInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (compose: ParsedDockerCompose, targetFormat?: OutputFormat) => void;
  initialFormat?: OutputFormat;
}

const SAMPLE_FULLSTACK_COMPOSE = `version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:secret@db:5432/app
      - REDIS_URL=redis://cache:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - cache

  db:
    image: postgres:16-alpine
    restart: always
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=app
    volumes:
      - pgdata:/var/lib/postgresql/data

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:`;

const SAMPLE_PYTHON_COMPOSE = `version: '3.9'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:secret@db:5432/fastapi_db
    volumes:
      - ./app:/code/app
    depends_on:
      - db

  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=fastapi_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`;

const SAMPLE_DOCKERFILE = `FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]`;

export function DockerInspectModal({
  isOpen,
  onClose,
  onApply,
  initialFormat = "claude_md",
}: DockerInspectModalProps) {
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState<ParsedDockerCompose | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(
    initialFormat === "mcp_json" ? "claude_md" : initialFormat
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedFormat(initialFormat === "mcp_json" ? "claude_md" : initialFormat);
    }
  }, [isOpen, initialFormat]);

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setInputText(text);
    setError(null);
    if (!text.trim()) {
      setParsed(null);
      return;
    }

    try {
      const result = inspectDockerCompose(text);
      setParsed(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse Docker configuration.";
      setError(msg);
      setParsed(null);
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    onApply(parsed, selectedFormat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full overflow-hidden space-y-3.5 sm:space-y-4 p-4 sm:p-5 text-zinc-900 animate-in zoom-in-95 duration-150 transition-all max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between border-b border-zinc-100 pb-3 shrink-0 gap-2">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-900 font-sans tracking-tight">
                  Introspect Docker Compose &amp; Containers
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-orange-600" />
                  <span>100% Client-Side Private</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                Paste docker-compose.yml or Dockerfile to extract services, ports, and containerized pair programming rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1 sm:mr-0 sm:mt-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-3.5 pr-1">
          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[10px] text-zinc-400 font-medium">Load Sample:</span>
            <button
              type="button"
              onClick={() => handleParse(SAMPLE_FULLSTACK_COMPOSE)}
              className="text-[10px] font-mono px-2 py-1 sm:py-0.5 rounded-md bg-zinc-100 hover:bg-orange-50 text-zinc-700 hover:text-orange-700 border border-zinc-200 hover:border-orange-200 transition-colors cursor-pointer min-h-[28px] sm:min-h-0 flex items-center"
            >
              Next.js + Postgres + Redis
            </button>
            <button
              type="button"
              onClick={() => handleParse(SAMPLE_PYTHON_COMPOSE)}
              className="text-[10px] font-mono px-2 py-1 sm:py-0.5 rounded-md bg-zinc-100 hover:bg-orange-50 text-zinc-700 hover:text-orange-700 border border-zinc-200 hover:border-orange-200 transition-colors cursor-pointer min-h-[28px] sm:min-h-0 flex items-center"
            >
              FastAPI + Postgres
            </button>
            <button
              type="button"
              onClick={() => handleParse(SAMPLE_DOCKERFILE)}
              className="text-[10px] font-mono px-2 py-1 sm:py-0.5 rounded-md bg-zinc-100 hover:bg-orange-50 text-zinc-700 hover:text-orange-700 border border-zinc-200 hover:border-orange-200 transition-colors cursor-pointer min-h-[28px] sm:min-h-0 flex items-center"
            >
              Dockerfile
            </button>
          </div>

          {/* Input Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Docker Configuration (YAML / Dockerfile)</label>
            <textarea
              rows={7}
              value={inputText}
              onChange={(e) => handleParse(e.target.value)}
              placeholder="Paste docker-compose.yml or Dockerfile contents here..."
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-y"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Output Card */}
          {parsed && (
            <div className="space-y-2.5 bg-zinc-50 border border-zinc-200 rounded-xl p-3 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-zinc-900 px-2 py-0.5 rounded bg-zinc-200 flex items-center gap-1">
                    <Container className="w-3 h-3 text-zinc-700" />
                    <span>{parsed.totalServices} Services</span>
                  </span>
                  {parsed.exposedPorts.length > 0 && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700">
                      Ports: {parsed.exposedPorts.slice(0, 4).join(", ")}
                    </span>
                  )}
                  {parsed.detectedVolumes.length > 0 && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700">
                      Volumes: {parsed.detectedVolumes.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                {parsed.services.map((svc) => (
                  <div key={svc.name} className="p-2 bg-white rounded-lg border border-zinc-200/80 space-y-1">
                    <div className="font-bold text-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-1 truncate">
                        <Server className="w-3 h-3 text-zinc-600 shrink-0" />
                        <span className="truncate">{svc.name}</span>
                      </div>
                      {svc.ports.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                          {svc.ports[0]}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {svc.image ? `image: ${svc.image}` : svc.buildPath ? `build: ${svc.buildPath}` : "custom"}
                    </div>
                    {svc.dependsOn.length > 0 && (
                      <div className="text-[10px] text-zinc-600 truncate">
                        depends on: {svc.dependsOn.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Synthesized Directives */}
              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200/80 text-xs text-zinc-700">
                <div className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-zinc-600" />
                  <span>Synthesized Container Rules</span>
                </div>
                <ul className="space-y-0.5 pt-0.5 text-[11px] text-zinc-700 list-disc list-inside leading-relaxed">
                  {parsed.synthesizedDirectives.slice(0, 3).map((dir, i) => (
                    <li key={i} className="truncate">
                      {dir}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Target Format Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 text-xs">
                <span className="text-[11px] font-medium text-zinc-600">Synthesize To:</span>
                <div className="grid grid-cols-2 sm:flex items-center gap-1 w-full sm:w-auto">
                  {[
                    { label: "CLAUDE.md", value: "claude_md" as const },
                    { label: "cursor.mdc", value: "cursor_mdc" as const },
                    { label: "AGENTS.md", value: "agents_md" as const },
                    { label: "SKILL.md", value: "skill_md" as const },
                  ].map((fmt) => (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.value)}
                      className={`px-2.5 py-1.5 sm:py-0.5 rounded text-[11px] font-mono text-center transition-colors cursor-pointer min-h-[30px] sm:min-h-0 flex items-center justify-center ${
                        selectedFormat === fmt.value
                          ? "bg-zinc-900 text-white font-semibold"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors cursor-pointer min-h-[38px] flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!parsed}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:via-orange-400 hover:to-amber-500 disabled:from-zinc-200 disabled:via-zinc-200 disabled:to-zinc-200 text-white disabled:text-zinc-400 text-xs font-semibold rounded-lg shadow-sm hover:shadow-[0_4px_14px_rgba(234,88,12,0.35)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:shadow-none min-h-[38px] active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Apply &amp; Generate {selectedFormat === "claude_md" ? "CLAUDE.md" : selectedFormat === "cursor_mdc" ? "cursor.mdc" : selectedFormat === "agents_md" ? "AGENTS.md" : "SKILL.md"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
