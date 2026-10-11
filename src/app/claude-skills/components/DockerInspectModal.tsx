"use client";

import React, { useState } from "react";
import { Box, Container } from "lucide-react";
import {
  inspectDockerCompose,
  ParsedDockerCompose,
} from "../lib/dockerParser";
import { OutputFormat } from "../lib/ruleGenerator";
import {
  IntakeError,
  IntakeFormatSwitch,
  IntakeModal,
  IntakeRow,
  initialIntakeFormat,
  intakeFormatLabel,
  intakePanelClass,
  intakePillClass,
  type IntakeFormat,
} from "./IntakeModal";

interface DockerInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (compose: ParsedDockerCompose, targetFormat?: OutputFormat) => void;
  initialFormat?: OutputFormat;
}

const PLACEHOLDER = `services:
  web:
    build: .
    ports: ["3000:3000"]
    depends_on: [db]
  db:
    image: postgres:16-alpine

# or a Dockerfile`;

/** Mounted only while open, so each opening starts from the studio's current format. */
export function DockerInspectModal(props: DockerInspectModalProps) {
  if (!props.isOpen) return null;
  return <DockerInspectModalBody {...props} />;
}

function DockerInspectModalBody({ onClose, onApply, initialFormat }: DockerInspectModalProps) {
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState<ParsedDockerCompose | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<IntakeFormat>(() => initialIntakeFormat(initialFormat));

  const handleParse = (text: string) => {
    setInputText(text);
    setError(null);
    if (!text.trim()) {
      setParsed(null);
      return;
    }
    try {
      setParsed(inspectDockerCompose(text));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse Docker configuration.");
      setParsed(null);
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    onApply(parsed, selectedFormat);
    onClose();
  };

  return (
    <IntakeModal
      icon={<Container className="size-4" />}
      title="Import Docker setup"
      subtitle="Paste docker-compose.yml or a Dockerfile to draft service and port rules."
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmLabel={`Generate ${intakeFormatLabel(selectedFormat)}`}
      confirmDisabled={!parsed}
    >
      <textarea
        rows={8}
        autoFocus
        value={inputText}
        onChange={(e) => handleParse(e.target.value)}
        placeholder={PLACEHOLDER}
        aria-label="docker-compose.yml or Dockerfile"
        spellCheck={false}
        className="w-full p-3 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 resize-y"
      />

      {error && <IntakeError message={error} />}

      {parsed && (
        <div className={intakePanelClass}>
          <div className="flex items-center gap-2 px-3 py-2 text-xs flex-wrap">
            <span className={intakePillClass}>
              {parsed.totalServices} {parsed.totalServices === 1 ? "service" : "services"}
            </span>
            {parsed.exposedPorts.length > 0 && <span className="text-zinc-500 font-mono">ports {parsed.exposedPorts.slice(0, 4).join(", ")}</span>}
            {parsed.detectedVolumes.length > 0 && <span className="text-zinc-500">· {parsed.detectedVolumes.length} volumes</span>}
          </div>

          {parsed.services.length > 0 && (
            <IntakeRow label="Services">
              <ul className="space-y-0.5 font-mono text-[11px] text-zinc-700">
                {parsed.services.map((svc) => (
                  <li key={svc.name} className="flex items-center gap-1.5 min-w-0">
                    <Box className="size-3 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-900 shrink-0">{svc.name}</span>
                    <span className="text-zinc-400 truncate">
                      {svc.image ? svc.image : svc.buildPath ? `build ${svc.buildPath}` : "custom"}
                      {svc.ports.length > 0 && ` · ${svc.ports[0]}`}
                      {svc.dependsOn.length > 0 && ` · needs ${svc.dependsOn.join(", ")}`}
                    </span>
                  </li>
                ))}
              </ul>
            </IntakeRow>
          )}

          <IntakeRow label="Draft rules">
            <ul className="space-y-0.5 text-xs text-zinc-700 leading-relaxed">
              {parsed.synthesizedDirectives.slice(0, 3).map((dir, i) => (
                <li key={i} className="truncate">
                  {dir.replace(/^- /, "")}
                </li>
              ))}
            </ul>
          </IntakeRow>

          <IntakeFormatSwitch value={selectedFormat} onChange={setSelectedFormat} />
        </div>
      )}
    </IntakeModal>
  );
}
