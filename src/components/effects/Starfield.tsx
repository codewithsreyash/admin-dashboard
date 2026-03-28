"use client"
import React, { useEffect, useRef } from "react";

/**
 * StarsArea
 * Adapted from Framer Component: https://framer.com/m/Stars-Galaxy-mcPCjY.js
 */

export default function Starfield(props: any) {
  const {
    stars = 800,
    speed = 2,
    spread = 6,
    focal = 2,
    twinkle = 0.35,
    trail = 0.8,
    size = 1.5,
    fadeInRange = 5,
    reverseFly = true,
    followCursor = false,
    background = "transparent", // Use transparent for layering below dashboard components
    starColor = "#ffffff"
  } = props || {};
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const starsRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const DPR = window.devicePixelRatio || 1;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const createStar = () => ({
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: Math.random(),
      tw: Math.random() * Math.PI * 2
    });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * DPR;
      canvas.height = rect.height * DPR;
      canvas.style.width = `100%`;
      canvas.style.height = `100%`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    starsRef.current = Array.from({ length: stars }, createStar);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      mouse.current.y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    };
    window.addEventListener("mousemove", onMouseMove);

    let raf = 0;
    const animate = () => {
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;
      
      ctx.clearRect(0,0, w, h);
      
      if (background !== "transparent") {
        ctx.globalAlpha = 1;
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = starColor;
      const cx = followCursor ? mouse.current.x * w : w / 2;
      const cy = followCursor ? mouse.current.y * h : h / 2;
      
      for (const s of starsRef.current) {
        const depth = s.z * clamp(focal, 0.01, 10) + 0.001;
        const px = cx + (s.x / depth) * w;
        const py = cy + (s.y / depth) * h;
        
        s.z += reverseFly ? clamp(speed, 0, 10) * 0.002 : -clamp(speed, 0, 10) * 0.002;
        
        if (s.z <= 0 || s.z > 1) {
          Object.assign(s, createStar());
        }
        
        s.tw += clamp(twinkle, 0, 1) * 0.05;
        const alpha = Math.max(0, 1 - s.z / clamp(fadeInRange, 0.1, 10));
        const radius = clamp(size, 0.1, 5) * (1 - s.z) * (1 + Math.sin(s.tw) * clamp(twinkle, 0, 1));
        
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      raf = requestAnimationFrame(animate);
    };

    animate();
    
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [stars, speed, spread, focal, twinkle, trail, size, fadeInRange, reverseFly, followCursor, background, starColor]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: "100%", height: "100%", display: "block" }} 
      />
    </div>
  );
}
