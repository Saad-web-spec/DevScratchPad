/**
 * PromptCraft Studio — Core Type Definitions
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

export type StudioMode = 'video' | 'image';

export type VideoEngine = 'runway-gen3' | 'sora' | 'kling';
export type ImageEngine = 'midjourney-v6' | 'flux-1';

export type EngineTarget = VideoEngine | ImageEngine;

export type AspectRatio = '16:9' | '2.39:1' | '9:16' | '1:1' | '4:3' | '4:5' | '2:3';

export type CameraMovement =
  | 'dolly-in'
  | 'dolly-out'
  | 'tracking-shot'
  | 'crane-pedestal'
  | 'orbit'
  | 'whip-pan'
  | 'static-tripod';

export type FocalLength =
  | '14mm-ultra-wide'
  | '24mm-cinematic-wide'
  | '50mm-standard'
  | '85mm-portrait'
  | 'anamorphic-bokeh';

export type LightingScheme =
  | 'volumetric-rays'
  | 'chiaroscuro'
  | 'practical-neon'
  | 'golden-hour'
  | 'overcast-diffused';

export type ColorPalette =
  | 'teal-orange-bleach'
  | 'kodachrome-64'
  | 'monochromatic-noir'
  | 'muted-cyberpunk';

export type DirectorStyle =
  | 'none'
  | 'roger-deakins'
  | 'denis-villeneuve'
  | 'christopher-nolan'
  | 'ridley-scott'
  | 'david-fincher'
  | 'wong-kar-wai';

export interface ParsedSceneIntelligence {
  primarySubject: string;
  subjectDetails: string;
  actionKinematics: string;
  environmentSetting: string;
  atmosphericPhysics: string;
  lightingScheme: string;
  opticsProfile: string;
  colorGrading: string;
  directorAesthetic: string;
  cinematographyScore: number; // 0 to 100
  modelResonanceScore: number; // 0 to 100
  suggestedNegativePrompt: string;
  detectedEntities: string[];
  optimizationTips: string[];
}

export interface ShotBeat {
  id: string;
  timestamp: string; // e.g., "00:00 - 00:02"
  cameraMotion: string; // e.g., "Dolly in, slow push towards subject"
  focalSubject: string; // e.g., "Cybernetic courier's gloved fingers"
  action: string; // e.g., "Soldering microchip, sparks flying in zero-g"
  environmentReaction: string; // e.g., "Rain streaks on glass, neon bokeh shimmering"
}

export interface CinematographyMatrix {
  cameraMovement: CameraMovement;
  focalLength: FocalLength;
  lightingScheme: LightingScheme;
  colorPalette: ColorPalette;
  aspectRatio: AspectRatio;
  motionStrength: number; // 1 - 10 (Video)
  fps: 24 | 30 | 60; // (Video)
  stylize: number; // 0 - 1000 (Midjourney)
  rawMode: boolean; // (Midjourney/Flux)
  directorStyle?: DirectorStyle;
  microTextures?: boolean;
  atmosphericParticles?: boolean;
  opticalFlares?: boolean;
  filmGrain?: boolean;
}

export interface PromptPreset {
  id: string;
  name: string;
  mode: StudioMode;
  category: 'Sci-Fi' | 'Cinematic' | 'Atmospheric' | 'Action' | 'Fantasy';
  description: string;
  idea: string;
  engineTarget: EngineTarget;
  cinematics: CinematographyMatrix;
  beats: ShotBeat[];
}

export type HardwareBackend = 'webgpu' | 'wasm';

export type ModelStatus = 'unloaded' | 'downloading' | 'ready' | 'error';

export type MoEExpertId =
  | 'optics'
  | 'kinematics'
  | 'material-physics'
  | 'directorial'
  | 'neural-slm';

export interface MoEExpertInfo {
  id: MoEExpertId;
  name: string;
  status: 'active' | 'idle';
  weight: number; // 0.0 to 1.0
  summary: string;
}

export interface MoERouterTelemetry {
  activeMode: StudioMode;
  targetEngine: EngineTarget;
  experts: MoEExpertInfo[];
  neuralModelName: string;
  neuralModelSizeMB: number;
}

export interface DownloadProgressInfo {
  progress: number; // 0 to 100
  loadedBytes: number;
  totalBytes: number;
  file: string;
  statusText?: string;
}

export interface GenerationMetrics {
  charCount: number;
  tokenCount: number;
  tokensPerSecond: number;
  elapsedMs: number;
}

export interface WorkerIncomingMessage {
  type: 'CHECK_WEBGPU' | 'LOAD_MODEL' | 'GENERATE' | 'ABORT' | 'ROUTE_MOE';
  payload?: {
    userIdea?: string;
    cinematics?: CinematographyMatrix;
    timelineBeats?: ShotBeat[];
    engine?: EngineTarget;
    aspectRatio?: AspectRatio;
    studioMode?: StudioMode;
  };
}

export interface WorkerOutgoingMessage {
  type:
    | 'WEBGPU_STATUS'
    | 'MODEL_DOWNLOADING'
    | 'MODEL_READY'
    | 'STREAM_TOKEN'
    | 'GENERATION_COMPLETE'
    | 'MOE_ROUTER_STATE'
    | 'ERROR';
  payload?: {
    supported?: boolean;
    gpuInfo?: string;
    progress?: number; // 0 to 100
    file?: string;
    loadedBytes?: number;
    totalBytes?: number;
    token?: string;
    fullText?: string;
    metrics?: GenerationMetrics;
    errorMessage?: string;
    moeTelemetry?: MoERouterTelemetry;
  };
}

