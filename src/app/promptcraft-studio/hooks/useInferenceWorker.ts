/**
 * PromptCraft Studio — Web Worker Hook & Bridge
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePromptStore } from '../store/usePromptStore';
import {
  WorkerIncomingMessage,
  WorkerOutgoingMessage,
} from '../types';

export function useInferenceWorker() {
  const workerRef = useRef<Worker | null>(null);

  const {
    studioMode,
    userIdea,
    selectedEngine,
    cinematics,
    timelineBeats,
    outputPrompt,
    isGenerating,
    modelStatus,
    setIsGenerating,
    setOutputPrompt,
    appendStreamToken,
    setPreviousPrompt,
    setModelStatus,
    setDownloadInfo,
    setHardwareBackend,
    setMetrics,
    setErrorMessage,
  } = usePromptStore();

  // Initialize Web Worker once on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const worker = new Worker(
        new URL('../worker/inference.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'WEBGPU_STATUS': {
            if (payload?.supported) {
              setHardwareBackend('webgpu', payload.gpuInfo);
            } else {
              setHardwareBackend('wasm', payload?.gpuInfo || 'WASM Fallback');
            }
            break;
          }

          case 'MODEL_DOWNLOADING': {
            setModelStatus('downloading');
            if (payload?.progress !== undefined) {
              const fileBasename = payload.file ? payload.file.split('/').pop() || '' : '';
              const loadedMB = ((payload.loadedBytes || 0) / (1024 * 1024)).toFixed(1);
              const totalMB = ((payload.totalBytes || 45 * 1024 * 1024) / (1024 * 1024)).toFixed(1);
              const text = fileBasename
                ? `${fileBasename} (${Math.round(payload.progress)}% • ${loadedMB}MB / ${totalMB}MB)`
                : `${Math.round(payload.progress)}% • ${loadedMB}MB / ${totalMB}MB`;

              setDownloadInfo({
                progress: payload.progress,
                loadedBytes: payload.loadedBytes || 0,
                totalBytes: payload.totalBytes || 45 * 1024 * 1024,
                file: fileBasename,
                statusText: text,
              });
            }
            break;
          }

          case 'MODEL_READY': {
            setModelStatus('ready');
            setDownloadInfo({
              progress: 100,
              statusText: 'SmolLM2-135M-Instruct Ready (~45 MB Cached)',
            });
            if (payload?.supported !== undefined) {
              setHardwareBackend(payload.supported ? 'webgpu' : 'wasm', payload.gpuInfo);
            }
            break;
          }

          case 'STREAM_TOKEN': {
            if (payload?.token) {
              appendStreamToken(payload.token);
            }
            break;
          }

          case 'GENERATION_COMPLETE': {
            setIsGenerating(false);
            if (payload?.fullText) {
              setOutputPrompt(payload.fullText);
            }
            if (payload?.metrics) {
              setMetrics(payload.metrics);
            }
            break;
          }

          case 'ERROR': {
            setIsGenerating(false);
            setModelStatus('error');
            setErrorMessage(payload?.errorMessage || 'An error occurred during WebGPU inference.');
            break;
          }

          default:
            break;
        }
      };

      worker.onerror = (err) => {
        console.warn('[PromptCraft Worker Error]', err);
        setHardwareBackend('wasm', 'WASM Fallback');
      };

      workerRef.current = worker;

      // Check WebGPU capabilities
      worker.postMessage({ type: 'CHECK_WEBGPU' } as WorkerIncomingMessage);

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      console.warn('[PromptCraft] Worker initialization fallback:', err);
    }
  }, [
    setHardwareBackend,
    setModelStatus,
    setDownloadInfo,
    appendStreamToken,
    setIsGenerating,
    setOutputPrompt,
    setMetrics,
    setErrorMessage,
  ]);

  const loadNeuralModel = useCallback(() => {
    if (workerRef.current) {
      setModelStatus('downloading');
      setDownloadInfo({
        progress: 0,
        statusText: 'Contacting Hugging Face CDN...',
      });
      workerRef.current.postMessage({ type: 'LOAD_MODEL' } as WorkerIncomingMessage);
    }
  }, [setModelStatus, setDownloadInfo]);

  // Trigger real prompt compilation
  const compile = useCallback(async () => {
    // Save previous prompt for diff inspector
    if (outputPrompt) {
      setPreviousPrompt(outputPrompt);
    }

    setOutputPrompt('');
    setIsGenerating(true);
    setErrorMessage(null);

    // If model is not ready, initialize model first
    if (modelStatus === 'unloaded') {
      loadNeuralModel();
    }

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'GENERATE',
        payload: {
          userIdea,
          cinematics,
          timelineBeats,
          engine: selectedEngine,
          studioMode,
        },
      } as WorkerIncomingMessage);
    }
  }, [
    outputPrompt,
    setPreviousPrompt,
    setOutputPrompt,
    setIsGenerating,
    setErrorMessage,
    modelStatus,
    loadNeuralModel,
    userIdea,
    cinematics,
    timelineBeats,
    selectedEngine,
    studioMode,
  ]);

  const abort = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'ABORT' } as WorkerIncomingMessage);
    }
    setIsGenerating(false);
  }, [setIsGenerating]);

  return {
    compile,
    loadNeuralModel,
    abort,
    isGenerating,
  };
}
