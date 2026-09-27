/**
 * PromptCraft Studio — Reactive Zustand State Store
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

import { create } from 'zustand';
import {
  AspectRatio,
  CinematographyMatrix,
  StudioMode,
  EngineTarget,
  GenerationMetrics,
  HardwareBackend,
  ModelStatus,
  DownloadProgressInfo,
  PromptPreset,
  ShotBeat,
  MoERouterTelemetry,
} from '../types';
import { CURATED_PRESETS } from '../lib/promptCompiler';

export function computeMoETelemetry(
  mode: StudioMode,
  engine: EngineTarget,
  idea: string,
  cinematics: CinematographyMatrix
): MoERouterTelemetry {
  const isVideo = mode === 'video';
  const lower = (idea || '').toLowerCase();

  const hasPhysics = /rain|water|puddle|metal|sparks|steam|smoke|dust|glass|skin|cloth|cybernetic|drops|fluid/.test(
    lower
  );
  const physicsWeight = hasPhysics ? 0.88 : 0.35;
  const hasDirector = cinematics.directorStyle && cinematics.directorStyle !== 'none';
  const dirWeight = hasDirector ? 0.92 : 0.30;

  return {
    activeMode: mode,
    targetEngine: engine,
    neuralModelName: 'SmolLM2-135M-Instruct',
    neuralModelSizeMB: 45,
    experts: [
      {
        id: 'optics',
        name: 'Photographic Optics & Glass Science',
        status: isVideo ? 'idle' : 'active',
        weight: isVideo ? 0.0 : 0.95,
        summary: isVideo
          ? 'Weights Idle (0% activation overhead — sits inactive)'
          : `Active (95%): Prime ${cinematics.focalLength}, aperture depth`,
      },
      {
        id: 'kinematics',
        name: 'Spatio-Temporal 3D Kinematics',
        status: isVideo ? 'active' : 'idle',
        weight: isVideo ? 0.98 : 0.0,
        summary: isVideo
          ? `Active (98%): Vector ${cinematics.cameraMovement}, ${cinematics.motionStrength}/10 intensity`
          : 'Weights Idle (0% activation overhead — sits inactive)',
      },
      {
        id: 'material-physics',
        name: 'Material & Atmospheric Physics',
        status: hasPhysics ? 'active' : 'idle',
        weight: physicsWeight,
        summary: hasPhysics
          ? `Active (${Math.round(physicsWeight * 100)}%): Surface shaders & particle collisions`
          : 'Idle (Low environmental turbulence)',
      },
      {
        id: 'directorial',
        name: 'Directorial Aesthetic Grammar',
        status: hasDirector ? 'active' : 'idle',
        weight: dirWeight,
        summary: hasDirector
          ? `Active (${Math.round(dirWeight * 100)}%): ${cinematics.directorStyle}`
          : 'Idle (Naturalistic balanced default)',
      },
      {
        id: 'neural-slm',
        name: 'Local Neural Synthesizer',
        status: 'active',
        weight: 1.0,
        summary: 'SmolLM2-135M (~45 MB) • On-Demand In-Browser',
      },
    ],
  };
}

const DEFAULT_CINEMATICS: CinematographyMatrix = {
  cameraMovement: 'orbit',
  focalLength: '24mm-cinematic-wide',
  lightingScheme: 'volumetric-rays',
  colorPalette: 'teal-orange-bleach',
  aspectRatio: '16:9',
  motionStrength: 7,
  fps: 24,
  stylize: 250,
  rawMode: true,
};

const DEFAULT_BEATS: ShotBeat[] = [
  {
    id: 'beat-1',
    timestamp: '00:00 - 00:03',
    cameraMotion: 'Dolly in, slow push toward subject',
    focalSubject: "Courier's weathered tactile cybernetic fingers",
    action: 'Micro-arc welding sparks fly as drone titanium chassis is sealed',
    environmentReaction: 'Rain streaks down frosted window, neon Kanji reflections shimmering',
  },
  {
    id: 'beat-2',
    timestamp: '00:03 - 00:06',
    cameraMotion: 'Rack focus to deep background skyline',
    focalSubject: 'Looming megacity holographic towers through dense smog',
    action: 'A massive commercial aerodyne glides silently through low clouds',
    environmentReaction: 'Cyan searchlights cut through falling rain, wet asphalt reflections ripple',
  },
  {
    id: 'beat-3',
    timestamp: '00:06 - 00:10',
    cameraMotion: 'Crane up and tilt down',
    focalSubject: 'Reactivated drone with illuminated glowing sensor eye',
    action: 'Drone thrusters hum to life, gently lifting into a hovering state',
    environmentReaction: 'Rooftop puddle water ripples outward from micro-thruster exhaust',
  },
];

interface PromptStudioState {
  // Mode Layer: Video vs Image
  studioMode: StudioMode;
  selectedEngine: EngineTarget;
  userIdea: string;
  cinematics: CinematographyMatrix;
  timelineBeats: ShotBeat[];
  totalDurationSeconds: number; // 5 or 10

  // Sparse MoE Router State
  moeTelemetry: MoERouterTelemetry;

  // Real WebGPU Model Lifecycle (SmolLM2 ~45MB)
  modelStatus: ModelStatus;
  downloadInfo: DownloadProgressInfo;
  hardwareBackend: HardwareBackend;
  gpuInfo: string;
  isGenerating: boolean;

  // Output & Export Layer
  activeOutputEngine: EngineTarget;
  outputPrompt: string;
  previousPrompt: string;
  metrics: GenerationMetrics | null;
  errorMessage: string | null;
  activeView: 'prompt' | 'diff' | 'json';

  // Actions
  setStudioMode: (mode: StudioMode) => void;
  setSelectedEngine: (engine: EngineTarget) => void;
  setUserIdea: (idea: string) => void;
  setAspectRatio: (ar: AspectRatio) => void;
  setCinematics: (partial: Partial<CinematographyMatrix>) => void;
  setTotalDuration: (seconds: number) => void;
  setMoETelemetry: (telemetry: MoERouterTelemetry) => void;

  // Timeline Beat Actions
  addBeat: () => void;
  updateBeat: (id: string, updates: Partial<ShotBeat>) => void;
  removeBeat: (id: string) => void;
  reorderBeats: (beats: ShotBeat[]) => void;

  // Presets
  loadPreset: (preset: PromptPreset) => void;

  // Model & Execution Actions
  setModelStatus: (status: ModelStatus) => void;
  setDownloadInfo: (info: Partial<DownloadProgressInfo>) => void;
  setHardwareBackend: (backend: HardwareBackend, gpuInfo?: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setOutputPrompt: (prompt: string) => void;
  appendStreamToken: (token: string) => void;
  setPreviousPrompt: (prompt: string) => void;
  setActiveOutputEngine: (engine: EngineTarget) => void;
  setMetrics: (metrics: GenerationMetrics | null) => void;
  setErrorMessage: (err: string | null) => void;
  setActiveView: (view: 'prompt' | 'diff' | 'json') => void;
  resetToDefaults: () => void;
}

const INITIAL_IDEA = 'A cybernetic courier repairing a broken drone on a rain-slicked neo-Tokyo rooftop at dusk';

export const usePromptStore = create<PromptStudioState>((set) => ({
  studioMode: 'video',
  selectedEngine: 'runway-gen3',
  userIdea: INITIAL_IDEA,
  cinematics: DEFAULT_CINEMATICS,
  timelineBeats: DEFAULT_BEATS,
  totalDurationSeconds: 10,

  moeTelemetry: computeMoETelemetry('video', 'runway-gen3', INITIAL_IDEA, DEFAULT_CINEMATICS),

  modelStatus: 'unloaded',
  downloadInfo: {
    progress: 0,
    loadedBytes: 0,
    totalBytes: 45 * 1024 * 1024, // SmolLM2-135M ~45 MB
    file: '',
    statusText: '',
  },
  hardwareBackend: 'webgpu',
  gpuInfo: '',
  isGenerating: false,

  activeOutputEngine: 'runway-gen3',
  outputPrompt: '',
  previousPrompt: '',
  metrics: null,
  errorMessage: null,
  activeView: 'prompt',

  setStudioMode: (studioMode) => {
    const defaultEngine = studioMode === 'video' ? 'runway-gen3' : 'midjourney-v6';
    set((state) => ({
      studioMode,
      selectedEngine: defaultEngine,
      activeOutputEngine: defaultEngine,
      moeTelemetry: computeMoETelemetry(studioMode, defaultEngine, state.userIdea, state.cinematics),
    }));
  },

  setSelectedEngine: (selectedEngine) => {
    const isVideo = selectedEngine === 'runway-gen3' || selectedEngine === 'sora' || selectedEngine === 'kling';
    const newMode: StudioMode = isVideo ? 'video' : 'image';
    set((state) => ({
      selectedEngine,
      studioMode: newMode,
      activeOutputEngine: selectedEngine,
      moeTelemetry: computeMoETelemetry(newMode, selectedEngine, state.userIdea, state.cinematics),
    }));
  },

  setUserIdea: (userIdea) =>
    set((state) => ({
      userIdea,
      moeTelemetry: computeMoETelemetry(state.studioMode, state.selectedEngine, userIdea, state.cinematics),
    })),

  setAspectRatio: (aspectRatio) =>
    set((state) => {
      const cinematics = { ...state.cinematics, aspectRatio };
      return {
        cinematics,
        moeTelemetry: computeMoETelemetry(state.studioMode, state.selectedEngine, state.userIdea, cinematics),
      };
    }),

  setCinematics: (partial) =>
    set((state) => {
      const cinematics = { ...state.cinematics, ...partial };
      return {
        cinematics,
        moeTelemetry: computeMoETelemetry(state.studioMode, state.selectedEngine, state.userIdea, cinematics),
      };
    }),

  setTotalDuration: (totalDurationSeconds) => set({ totalDurationSeconds }),
  setMoETelemetry: (moeTelemetry) => set({ moeTelemetry }),

  addBeat: () =>
    set((state) => {
      const beatIndex = state.timelineBeats.length + 1;
      const startSec = (beatIndex - 1) * 2;
      const endSec = startSec + 2;
      const pad = (n: number) => String(n).padStart(2, '0');
      const newBeat: ShotBeat = {
        id: `beat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: `00:${pad(startSec)} - 00:${pad(endSec)}`,
        cameraMotion: 'Tracking shot, slow dynamic horizontal translation',
        focalSubject: 'Secondary narrative environmental subject',
        action: 'Subtle motion occurs as scene elements dynamically interact',
        environmentReaction: 'Atmospheric light shift across surrounding surfaces',
      };
      return { timelineBeats: [...state.timelineBeats, newBeat] };
    }),

  updateBeat: (id, updates) =>
    set((state) => ({
      timelineBeats: state.timelineBeats.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  removeBeat: (id) =>
    set((state) => ({
      timelineBeats: state.timelineBeats.filter((b) => b.id !== id),
    })),

  reorderBeats: (timelineBeats) => set({ timelineBeats }),

  loadPreset: (preset) => {
    set({
      studioMode: preset.mode,
      selectedEngine: preset.engineTarget,
      activeOutputEngine: preset.engineTarget,
      userIdea: preset.idea,
      cinematics: preset.cinematics,
      timelineBeats: preset.beats,
      errorMessage: null,
      moeTelemetry: computeMoETelemetry(
        preset.mode,
        preset.engineTarget,
        preset.idea,
        preset.cinematics
      ),
    });
  },

  setModelStatus: (modelStatus) => set({ modelStatus }),
  setDownloadInfo: (info) =>
    set((state) => ({ downloadInfo: { ...state.downloadInfo, ...info } })),
  setHardwareBackend: (hardwareBackend, gpuInfo = '') =>
    set({ hardwareBackend, gpuInfo }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setOutputPrompt: (outputPrompt) => set({ outputPrompt }),
  appendStreamToken: (token) =>
    set((state) => ({ outputPrompt: state.outputPrompt + token })),
  setPreviousPrompt: (previousPrompt) => set({ previousPrompt }),
  setActiveOutputEngine: (activeOutputEngine) => set({ activeOutputEngine }),
  setMetrics: (metrics) => set({ metrics }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setActiveView: (activeView) => set({ activeView }),

  resetToDefaults: () =>
    set({
      studioMode: 'video',
      selectedEngine: 'runway-gen3',
      activeOutputEngine: 'runway-gen3',
      userIdea: CURATED_PRESETS[0].idea,
      cinematics: DEFAULT_CINEMATICS,
      timelineBeats: DEFAULT_BEATS,
      moeTelemetry: computeMoETelemetry(
        'video',
        'runway-gen3',
        CURATED_PRESETS[0].idea,
        DEFAULT_CINEMATICS
      ),
      outputPrompt: '',
      previousPrompt: '',
      metrics: null,
      errorMessage: null,
    }),
}));

