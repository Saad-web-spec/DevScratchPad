/**
 * PromptCraft Studio — Cinematography Matrix (Minimalist Light Theme)
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

'use client';

import React from 'react';
import { Camera, Eye, Sun, Palette } from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';
import {
  CameraMovement,
  FocalLength,
  LightingScheme,
  ColorPalette,
} from '../types';
import {
  CAMERA_MOVEMENT_LABELS,
  FOCAL_LENGTH_LABELS,
  LIGHTING_SCHEME_LABELS,
  COLOR_PALETTE_LABELS,
} from '../lib/promptCompiler';

export function CinematographyMatrix() {
  const { cinematics, setCinematics } = usePromptStore();

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shadow-[0_0_6px_rgba(234,88,12,0.8)]" />
          <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
            2. Cinematography Matrix
          </h2>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          Optical Specifications
        </span>
      </div>

      <div className="space-y-3">
        {/* Row 1: Camera Movement */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-orange-600" />
              <span>Camera Movement</span>
            </label>
            <span className="text-[10px] text-orange-700 font-mono font-medium">
              {CAMERA_MOVEMENT_LABELS[cinematics.cameraMovement]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(Object.keys(CAMERA_MOVEMENT_LABELS) as CameraMovement[]).map((camKey) => {
              const item = CAMERA_MOVEMENT_LABELS[camKey];
              const isSelected = cinematics.cameraMovement === camKey;
              return (
                <button
                  key={camKey}
                  onClick={() => setCinematics({ cameraMovement: camKey })}
                  className={`py-1.5 px-2 rounded-lg text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-xs'
                      : 'bg-zinc-50 border-zinc-200/80 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                  title={item.desc}
                >
                  <span className="block font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Focal Length & Lens Glass */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-orange-600" />
              <span>Lens & Focal Glass</span>
            </label>
            <span className="text-[10px] text-orange-700 font-mono font-medium">
              {FOCAL_LENGTH_LABELS[cinematics.focalLength]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {(Object.keys(FOCAL_LENGTH_LABELS) as FocalLength[]).map((lensKey) => {
              const item = FOCAL_LENGTH_LABELS[lensKey];
              const isSelected = cinematics.focalLength === lensKey;
              return (
                <button
                  key={lensKey}
                  onClick={() => setCinematics({ focalLength: lensKey })}
                  className={`py-1.5 px-2 rounded-lg text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-xs'
                      : 'bg-zinc-50 border-zinc-200/80 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                  title={item.desc}
                >
                  <span className="block font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Lighting Scheme */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-orange-600" />
              <span>Lighting Scheme</span>
            </label>
            <span className="text-[10px] text-orange-700 font-mono font-medium">
              {LIGHTING_SCHEME_LABELS[cinematics.lightingScheme]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {(Object.keys(LIGHTING_SCHEME_LABELS) as LightingScheme[]).map((lightKey) => {
              const item = LIGHTING_SCHEME_LABELS[lightKey];
              const isSelected = cinematics.lightingScheme === lightKey;
              return (
                <button
                  key={lightKey}
                  onClick={() => setCinematics({ lightingScheme: lightKey })}
                  className={`py-1.5 px-2 rounded-lg text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-xs'
                      : 'bg-zinc-50 border-zinc-200/80 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                  title={item.desc}
                >
                  <span className="block font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 4: Color Palette */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-orange-600" />
              <span>Color Timing & Film Stock</span>
            </label>
            <span className="text-[10px] text-orange-700 font-mono font-medium">
              {COLOR_PALETTE_LABELS[cinematics.colorPalette]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(COLOR_PALETTE_LABELS) as ColorPalette[]).map((paletteKey) => {
              const item = COLOR_PALETTE_LABELS[paletteKey];
              const isSelected = cinematics.colorPalette === paletteKey;
              return (
                <button
                  key={paletteKey}
                  onClick={() => setCinematics({ colorPalette: paletteKey })}
                  className={`py-1.5 px-2 rounded-lg text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-xs'
                      : 'bg-zinc-50 border-zinc-200/80 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                  title={item.desc}
                >
                  <span className="block font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
