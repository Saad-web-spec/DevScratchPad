"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "./theme";

const CONTROL = cn(
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-[12.5px] font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950",
  FOCUS_RING,
);

/**
 * The 33-second studio tour (promo_assets/skill-graph-video, trimmed to the four scenes). It plays muted
 * while it is on screen and loops; Sound on restarts it once so the narration is heard from its first line.
 * With reduced motion it waits for Play.
 */
export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedByUser = useRef(false);
  const heardFromStart = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pausedByUser.current)
          void video.play().catch(() => {});
        else if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      pausedByUser.current = false;
      void video.play().catch(() => {});
    } else {
      pausedByUser.current = true;
      video.pause();
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (!next) {
      if (!heardFromStart.current) {
        heardFromStart.current = true;
        video.currentTime = 0;
      }
      pausedByUser.current = false;
      void video.play().catch(() => {});
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-[#f4f4f5]">
      <video
        ref={videoRef}
        className="block aspect-video w-full cursor-pointer"
        src="/videos/skill-graph-demo.mp4"
        poster="/videos/skill-graph-demo-poster.jpg"
        width={1920}
        height={1080}
        loop={muted}
        playsInline
        muted
        preload="metadata"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        aria-label="Skill Graph tour: lay out a graph skill, edit a step, walk through the plan, export the Claude Code and Cursor kit"
      />
      <div className="absolute bottom-3 left-3 flex gap-2 sm:bottom-4 sm:left-4">
        <button
          type="button"
          onClick={togglePlay}
          className={CONTROL}
          aria-label={playing ? "Pause the tour" : "Play the tour"}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
        </button>
        <button
          type="button"
          onClick={toggleSound}
          className={CONTROL}
          aria-pressed={!muted}
        >
          {muted ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-orange-600" />
          )}
          {muted ? "Sound on" : "Sound off"}
        </button>
      </div>
    </div>
  );
}
