import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MMA-Optimized Particle System Component
 */
const MmaParticleSystem = ({ count = 8000 }) => {
  const pointsRef = useRef();
  const { mouse, viewport } = useThree();

  // Create particles for "TFC" text with MMA aesthetic
  const particles = useMemo(() => {
    try {
      const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      if (!canvas) return new Float32Array(count * 3);

      const ctx = canvas.getContext('2d');
      if (!ctx) return new Float32Array(count * 3);

      canvas.width = 1200;
      canvas.height = 500;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw "TFC" with bold font
      ctx.fillStyle = 'white';
      ctx.font = '900 380px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TFC', canvas.width / 2, canvas.height / 2);

      const sampledPositions = [];

      for (let i = 0; i < count; i++) {
        sampledPositions.push((Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 8);
      }

      return new Float32Array(sampledPositions);
    } catch (e) {
      return new Float32Array(count * 3);
    }
  }, [count]);

  // Target positions (the actual "TFC" shape)
  const targetPositions = useMemo(() => {
    try {
      const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      if (!canvas) return new Float32Array(count * 3);

      const ctx = canvas.getContext('2d');
      if (!ctx) return new Float32Array(count * 3);

      canvas.width = 1200;
      canvas.height = 500;
      ctx.fillStyle = 'white';
      ctx.font = '900 380px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TFC', canvas.width / 2, canvas.height / 2);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const targets = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        let x, y, found = false, attempts = 0;
        while (!found && attempts < 100) {
          x = Math.floor(Math.random() * canvas.width);
          y = Math.floor(Math.random() * canvas.height);
          if (imageData.data[(y * canvas.width + x) * 4 + 3] > 128) found = true;
          attempts++;
        }
        targets[i * 3] = (x - canvas.width / 2) * 0.025;
        targets[i * 3 + 1] = (canvas.height / 2 - y) * 0.025;
        targets[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
      return targets;
    } catch (e) {
      return new Float32Array(count * 3);
    }
  }, [count]);

  // Physics state
  const velocities = useMemo(() => new Float32Array(count * 3).fill(0), [count]);

  useFrame((state) => {
    if (!pointsRef.current || !pointsRef.current.geometry.attributes.position) return;

    const positions = pointsRef.current.geometry.attributes.position.array;
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Current positions
      let px = positions[i3];
      let py = positions[i3 + 1];
      let pz = positions[i3 + 2];

      // Target (TFC shape)
      const tx = targetPositions[i3];
      const ty = targetPositions[i3 + 1];
      const tz = targetPositions[i3 + 2];

      // 1. Mouse Interaction (Repulsion)
      const dx = px - mx;
      const dy = py - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3.0) {
        const force = (3.0 - dist) / 3.0;
        velocities[i3] += dx * force * 0.2;
        velocities[i3 + 1] += dy * force * 0.2;
      }

      // 2. Idle Motion (Aggressive drift)
      velocities[i3] += Math.sin(time * 0.7 + i * 0.1) * 0.003;
      velocities[i3 + 1] += Math.cos(time * 0.6 + i * 0.1) * 0.003;

      // 3. Return Force (Strong magnetic convergence)
      const convergenceStrength = time < 2.5 ? 0.12 : 0.06;
      velocities[i3] += (tx - px) * convergenceStrength;
      velocities[i3 + 1] += (ty - py) * convergenceStrength;
      velocities[i3 + 2] += (tz - pz) * convergenceStrength;

      // 4. Damping (Smooth but aggressive)
      velocities[i3] *= 0.85;
      velocities[i3 + 1] *= 0.85;
      velocities[i3 + 2] *= 0.85;

      // Apply updates
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#FFFFFF"
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

/**
 * Premium MMA Hero Component
 */
const MmaHero = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Component mounted');
  }, []);

  const handleImageLoad = (e) => {
    console.log('Image loaded successfully:', e);
    setImageLoaded(true);
    setError(null);
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', e);
    setError('Failed to load image');
    setImageLoaded(false);
  };

  return (
    <div className="relative w-full min-h-screen bg-black overflow-y-auto">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/Screenshot 2026-01-30 231135.png"
          alt="MMA Platform"
          className="w-full h-full object-cover"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {!imageLoaded && (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <p className="text-white text-xl">Loading screenshot...</p>
          </div>
        )}
        {error && (
          <div className="w-full h-full bg-red-900 flex items-center justify-center">
            <p className="text-white text-xl">Error: {error}</p>
          </div>
        )}
      </div>

      {/* Simple Overlay Text */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-white text-8xl font-black italic tracking-tighter drop-shadow-2xl">TFC</h1>
        </div>
      </div>
    </div>
  );
};

export default MmaHero;
