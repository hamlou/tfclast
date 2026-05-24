import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * TfcSafeParticleHero
 * A high-performance, crash-proof 2D Canvas particle system.
 * Renders the "TFC" brand mark using interactive particles.
 */
const TfcSafeParticleHero = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      setIsError(true);
      return;
    }

    let animationFrameId;
    let particles = null;

    // Performance optimized interaction constants
    const interactRadius = 140;
    const interactRadiusSq = interactRadius * interactRadius;
    const returnSpeed = 0.15; // Faster return speed for more dynamic movement

    // Grid-based spatial partitioning
    let grid = null;
    const gridSize = 60;
    const mousePos = { x: -1000, y: -1000 };

    const init = () => {
      try {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        canvas.width = w;
        canvas.height = h;

        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        offCanvas.width = w;
        offCanvas.height = h;

        const fontSize = Math.min(w * 0.5, h * 0.6, 650);
        offCtx.fillStyle = 'white';
        offCtx.font = `900 ${fontSize}px "Inter", "system-ui", sans-serif`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText('TFC', w / 2, h / 2);

        const imageData = offCtx.getImageData(0, 0, w, h);
        const data = imageData.data;

        let gap = 5; // Slightly larger gap for 1000-1500 target
        let points = [];
        for (let y = 0; y < h; y += gap) {
          for (let x = 0; x < w; x += gap) {
            const index = (y * w + x) * 4;
            if (data[index + 3] > 100) {
              points.push({ x, y });
            }
          }
        }

        const targetCount = 800; // Reduced density for cleaner appearance
        let finalPoints = points.length > targetCount ?
          Array.from({ length: targetCount }, (_, i) => points[Math.floor(i * (points.length / targetCount))]) :
          points;

        const count = finalPoints.length;
        particles = {
          count,
          x: new Float32Array(count),
          y: new Float32Array(count),
          homeX: new Float32Array(count),
          homeY: new Float32Array(count),
          size: new Float32Array(count),
          opacity: new Float32Array(count)
        };

        const cols = Math.ceil(w / gridSize);
        const rows = Math.ceil(h / gridSize);
        grid = Array.from({ length: cols * rows }, () => []);

        for (let i = 0; i < count; i++) {
          const p = finalPoints[i];
          particles.homeX[i] = p.x;
          particles.homeY[i] = p.y;

          // INITIAL ANIMATION: Particles start scattered anywhere off-screen or random
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.max(w, h) * (1 + Math.random());
          particles.x[i] = w / 2 + Math.cos(angle) * dist;
          particles.y[i] = h / 2 + Math.sin(angle) * dist;

          particles.size[i] = 1.2 + Math.random() * 1.8;
          particles.opacity[i] = 0.4 + Math.random() * 0.6;

          const gx = Math.floor(p.x / gridSize);
          const gy = Math.floor(p.y / gridSize);
          const gIdx = gy * cols + gx;
          if (grid[gIdx]) grid[gIdx].push(i);
        }
      } catch (err) {
        console.error("Particle init failed:", err);
        setIsError(true);
      }
    };

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mousePos.x = -9999;
      mousePos.y = -9999;
    };

    const animate = () => {
      if (!particles) return;

      ctx.fillStyle = '#111'; // Requested background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mousePos.x;
      const my = mousePos.y;

      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);

      const count = particles.count;
      const time = Date.now() * 0.002; // Time variable for continuous motion
      const randomOffset = Math.sin(Date.now() * 0.0005) * 0.3; // Random movement factor

      // Reset all to follow home position by default
      const targetsX = new Float32Array(particles.homeX);
      const targetsY = new Float32Array(particles.homeY);

      // Modify targets for particles near mouse (Stationary support + continuous motion)
      if (mx > 0) {
        const startCol = Math.max(0, Math.floor((mx - interactRadius) / gridSize));
        const endCol = Math.min(cols - 1, Math.floor((mx + interactRadius) / gridSize));
        const startRow = Math.max(0, Math.floor((my - interactRadius) / gridSize));
        const endRow = Math.min(rows - 1, Math.floor((my + interactRadius) / gridSize));

        for (let gy = startRow; gy <= endRow; gy++) {
          for (let gx = startCol; gx <= endCol; gx++) {
            const bucket = grid[gy * cols + gx];
            if (!bucket) continue;
            for (let b = 0; b < bucket.length; b++) {
              const i = bucket[b];
              const dx = mx - particles.homeX[i];
              const dy = my - particles.homeY[i];
              const distSq = dx * dx + dy * dy;

              if (distSq < interactRadiusSq) {
                const dist = Math.sqrt(distSq);
                const ratio = (interactRadius - dist) / interactRadius;

                // Add subtle continuous orbital/noise motion while hovering
                const offsetX = Math.sin(time + i) * 15 * ratio;
                const offsetY = Math.cos(time + i) * 15 * ratio;

                // Apply repulsion + continuous motion
                // The particles can now move "outside" the letter shape due to offset
                targetsX[i] = particles.homeX[i] - (dx * ratio * 0.8) + offsetX;
                targetsY[i] = particles.homeY[i] - (dy * ratio * 0.8) + offsetY;
              }
            }
          }
        }
      }

      for (let i = 0; i < count; i++) {
        // Smooth snap toward target (home or repelled)
        const dx = targetsX[i] - particles.x[i];
        const dy = targetsY[i] - particles.y[i];

        particles.x[i] += dx * returnSpeed;
        particles.y[i] += dy * returnSpeed;

        // Add continuous random movement even when mouse is not hovering (faster)
        const randomX = Math.sin(time * 1.2 + i * 0.15) * 3.5 * randomOffset;
        const randomY = Math.cos(time * 0.9 + i * 0.2) * 3.5 * randomOffset;
        
        const finalX = particles.x[i] + randomX;
        const finalY = particles.y[i] + randomY;

        const op = particles.opacity[i];
        ctx.globalAlpha = op;
        ctx.fillStyle = '#808080';

        // Make particles slightly larger
        const largerSize = particles.size[i] * 1.3;
        ctx.beginPath();
        ctx.arc(finalX, finalY, largerSize, 0, 6.28);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    window.addEventListener('resize', handleResize);
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousemove', handleMouseMove);
      canvasRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (isError) {
    return (
      <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center">
        <h1 className="text-6xl font-black text-gray-400 italic tracking-tighter drop-shadow-2xl">TFC</h1>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0a] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        style={{
          zIndex: 1000,
          background: 'transparent'
        }}
      />



      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />


    </div>
  );
};

export default TfcSafeParticleHero;
