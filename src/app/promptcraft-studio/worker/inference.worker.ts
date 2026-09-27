/**
 * PromptCraft Studio — Dedicated Web Worker Inference Engine
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

import {
  WorkerIncomingMessage,
  WorkerOutgoingMessage,
  CinematographyMatrix,
  ShotBeat,
  EngineTarget,
  StudioMode,
} from '../types';
import {
  buildMoESmolLMPrompt,
  compilePromptAlgorithmic,
} from '../lib/promptCompiler';

// Web Worker global scope
/* eslint-disable @typescript-eslint/no-explicit-any */
const ctx: Worker = self as any;

let pipelineInstance: any = null;
let isModelLoading = false;
let abortRequested = false;

/**
 * Detect WebGPU capability in Worker thread
 */
async function checkWebGPU(): Promise<{ supported: boolean; gpuInfo: string }> {
  try {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        const info = adapter.info || {};
        const gpuDescription = `${info.vendor || 'Hardware'} ${info.architecture || ''} ${info.description || 'WebGPU Adapter'}`.trim();
        return { supported: true, gpuInfo: gpuDescription };
      }
    }
  } catch (err) {
    console.warn('[PromptCraft Worker] WebGPU probe failed:', err);
  }
  return { supported: false, gpuInfo: 'WASM / Algorithmic Engine' };
}

/**
 * Loads ultra-compact SmolLM2-135M-Instruct (~45 MB) using @huggingface/transformers
 * Runs 100% in-browser via WebGPU with WASM fallback.
 */
async function loadModel() {
  if (pipelineInstance) {
    ctx.postMessage({
      type: 'MODEL_READY',
      payload: { progress: 100 },
    } as WorkerOutgoingMessage);
    return;
  }

  if (isModelLoading) return;
  isModelLoading = true;

  try {
    const { supported, gpuInfo } = await checkWebGPU();
    const device = supported ? 'webgpu' : 'wasm';

    // Dynamically import @huggingface/transformers to keep initial worker thread ultra-light
    const { pipeline, env } = await import('@huggingface/transformers');

    if (env) {
      env.allowLocalModels = false;
    }

    pipelineInstance = await pipeline(
      'text-generation',
      'onnx-community/SmolLM2-135M-Instruct',
      {
        dtype: 'q4',
        device: device as any,
        progress_callback: (progressInfo: any) => {
          if (progressInfo.status === 'progress') {
            ctx.postMessage({
              type: 'MODEL_DOWNLOADING',
              payload: {
                progress: progressInfo.progress ?? 0,
                file: progressInfo.file,
                loadedBytes: progressInfo.loaded,
                totalBytes: progressInfo.total || 45 * 1024 * 1024,
              },
            } as WorkerOutgoingMessage);
          }
        },
      }
    );

    isModelLoading = false;
    ctx.postMessage({
      type: 'MODEL_READY',
      payload: {
        supported,
        gpuInfo,
      },
    } as WorkerOutgoingMessage);
  } catch (error: any) {
    isModelLoading = false;
    console.error('[PromptCraft Worker] Failed to load SmolLM2 model:', error);
    ctx.postMessage({
      type: 'ERROR',
      payload: {
        errorMessage: error?.message || 'Failed to download or initialize SmolLM2 WebGPU model.',
      },
    } as WorkerOutgoingMessage);
  }
}

/**
 * Generates prompt output (Neural via Qwen2.5 or Algorithmic Fallback)
 */
async function handleGenerate(payload: {
  userIdea?: string;
  cinematics?: CinematographyMatrix;
  timelineBeats?: ShotBeat[];
  engine?: EngineTarget;
  studioMode?: StudioMode;
}) {
  const idea = payload.userIdea || '';
  const cinematics = payload.cinematics!;
  const beats = payload.timelineBeats || [];
  const engine = payload.engine || 'runway-gen3';
  const mode = payload.studioMode || (engine === 'midjourney-v6' || engine === 'flux-1' ? 'image' : 'video');

  abortRequested = false;
  const startTime = performance.now();

  // If pipeline is loaded and ready, execute neural generation
  if (pipelineInstance) {
    try {
      const prompt = buildMoESmolLMPrompt(idea, cinematics, beats, engine, mode);
      let accumulated = '';
      let tokenCount = 0;

      const output = await pipelineInstance(prompt, {
        max_new_tokens: 380,
        temperature: 0.65,
        top_p: 0.9,
        do_sample: true,
        callback_function: (beams: any[]) => {
          if (abortRequested) return false;
          if (beams && beams[0]) {
            tokenCount++;
            const chunk = pipelineInstance.tokenizer.decode([beams[0].output_token_id], {
              skip_special_tokens: true,
            });
            accumulated += chunk;
            ctx.postMessage({
              type: 'STREAM_TOKEN',
              payload: { token: chunk },
            } as WorkerOutgoingMessage);
          }
          return !abortRequested;
        },
      });

      const fullOutput =
        accumulated ||
        (Array.isArray(output) && output[0]?.generated_text
          ? output[0].generated_text.replace(prompt, '').trim()
          : '');

      const elapsedMs = Math.max(1, performance.now() - startTime);
      const tokensPerSecond = parseFloat(((tokenCount / elapsedMs) * 1000).toFixed(1));

      ctx.postMessage({
        type: 'GENERATION_COMPLETE',
        payload: {
          fullText: fullOutput.trim(),
          metrics: {
            charCount: fullOutput.length,
            tokenCount,
            tokensPerSecond,
            elapsedMs: Math.round(elapsedMs),
          },
        },
      } as WorkerOutgoingMessage);
      return;
    } catch (err: any) {
      console.warn('[PromptCraft Worker] Neural generation error, falling back to algorithmic engine:', err);
    }
  }

  // Algorithmic instant compilation fallback with simulated streaming chunks
  const compiled = compilePromptAlgorithmic(idea, cinematics, beats, engine);
  const words = compiled.split(' ');
  let simulatedText = '';

  for (let i = 0; i < words.length; i++) {
    if (abortRequested) break;
    const chunk = (i === 0 ? '' : ' ') + words[i];
    simulatedText += chunk;
    ctx.postMessage({
      type: 'STREAM_TOKEN',
      payload: { token: chunk },
    } as WorkerOutgoingMessage);
    // Micro-delay for natural typing feel
    await new Promise((resolve) => setTimeout(resolve, 14));
  }

  const elapsedMs = Math.max(1, performance.now() - startTime);
  const tokenCount = Math.round(compiled.length / 4);
  const tokensPerSecond = parseFloat(((tokenCount / elapsedMs) * 1000).toFixed(1));

  ctx.postMessage({
    type: 'GENERATION_COMPLETE',
    payload: {
      fullText: compiled,
      metrics: {
        charCount: compiled.length,
        tokenCount,
        tokensPerSecond,
        elapsedMs: Math.round(elapsedMs),
      },
    },
  } as WorkerOutgoingMessage);
}

// Incoming message router
ctx.addEventListener('message', async (event: MessageEvent<WorkerIncomingMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'CHECK_WEBGPU': {
      const { supported, gpuInfo } = await checkWebGPU();
      ctx.postMessage({
        type: 'WEBGPU_STATUS',
        payload: { supported, gpuInfo },
      } as WorkerOutgoingMessage);
      break;
    }

    case 'LOAD_MODEL': {
      await loadModel();
      break;
    }

    case 'GENERATE': {
      if (payload) {
        await handleGenerate(payload);
      }
      break;
    }

    case 'ABORT': {
      abortRequested = true;
      break;
    }

    default:
      break;
  }
});
