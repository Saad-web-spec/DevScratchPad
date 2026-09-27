'use client';

import React, { useEffect, useRef } from 'react';

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{
      x: number;
      y: number;
      size: number;
      depth: number;
      baseAlpha: number;
      alpha: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }> = [];
    
    const numStars = 75;
    const targetOffset = { x: 0, y: 0 };
    const currentOffset = { x: 0, y: 0 };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initStars(rect.width, rect.height);
    };

    const initStars = (width: number, height: number) => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.4 + Math.random() * 0.8,
          depth: 0.2 + Math.random() * 1.2,
          baseAlpha: 0.15 + Math.random() * 0.35,
          alpha: 0,
          twinkleSpeed: 0.003 + Math.random() * 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      targetOffset.x = -(e.clientX - centerX) * 0.04;
      targetOffset.y = -(e.clientY - centerY) * 0.04;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    resizeCanvas();

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      currentOffset.x += (targetOffset.x - currentOffset.x) * 0.08;
      currentOffset.y += (targetOffset.y - currentOffset.y) * 0.08;

      stars.forEach((star) => {
        let sx = (star.x + currentOffset.x * star.depth) % width;
        let sy = (star.y + currentOffset.y * star.depth) % height;

        star.y -= 0.15 * star.depth;
        
        if (sx < 0) sx += width;
        if (sy < 0) sy += height;
        if (star.y < 0) star.y += height;

        star.twinklePhase += star.twinkleSpeed;
        star.alpha = star.baseAlpha * (0.4 + 0.6 * Math.sin(star.twinklePhase));

        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none block opacity-40"
    />
  );
}
