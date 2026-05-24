import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Core Particle System Component
 */
const ParticleSystem = ({ count = 6000 }) => {
  const pointsRef = useRef();
  const { mouse, viewport } = useThree();

  // Create an off-screen canvas to sample positions for the "TFC" text
  const particles = useMemo(() => {
    try {
      const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      if (!canvas) return new Float32Array(count * 3);

      const ctx = canvas.getContext('2d');
      if (!ctx) return new Float32Array(count * 3);

      canvas.width = 1000;
      canvas.height = 400;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw "TFC" text
      ctx.fillStyle = 'white';
      ctx.font = '900 320px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TFC', canvas.width / 2, canvas.height / 2);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const sampledPositions = [];

      for (let i = 0; i < count; i++) {
        sampledPositions.push((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 5);
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

      canvas.width = 1000;
      canvas.height = 400;
      ctx.fillStyle = 'white';
      ctx.font = '900 320px sans-serif';
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
        targets[i * 3] = (x - canvas.width / 2) * 0.02;
        targets[i * 3 + 1] = (canvas.height / 2 - y) * 0.02;
        targets[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
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

      if (dist < 2.5) {
        const force = (2.5 - dist) / 2.5;
        velocities[i3] += dx * force * 0.15;
        velocities[i3 + 1] += dy * force * 0.15;
      }

      // 2. Idle Motion (Subtle drift)
      velocities[i3] += Math.sin(time * 0.5 + i) * 0.001;
      velocities[i3 + 1] += Math.cos(time * 0.4 + i) * 0.001;

      // 3. Return Force (Magnetic convergence)
      // We use a stronger factor early on for the initial converge
      const convergenceStrength = time < 2 ? 0.08 : 0.045;
      velocities[i3] += (tx - px) * convergenceStrength;
      velocities[i3 + 1] += (ty - py) * convergenceStrength;
      velocities[i3 + 2] += (tz - pz) * convergenceStrength;

      // 4. Damping (Smoothness)
      velocities[i3] *= 0.88;
      velocities[i3 + 1] *= 0.88;
      velocities[i3 + 2] *= 0.88;

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
        size={0.038}
        color="#FF3131"
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

/**
 * Main Hero Wrapper Component
 */
const TfcParticleHero = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
      {/* 3D Scene Container */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: false, alpha: true }}
          style={{ background: 'transparent' }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0a0a0a', 1)
          }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <Suspense fallback={null}>
            <ParticleSystem />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none text-center px-6">
        <AnimatePresence>
          {mounted && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 1 }}
              className="space-y-6"
            >
              <div className="h-40" /> {/* Spacer for the 3D "TFC" position */}

              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 100 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  className="h-px bg-primary mb-6"
                />

                <p className="text-white font-black text-sm uppercase tracking-[0.6em] mb-2 drop-shadow-2xl">
                  The Future of Content
                </p>

                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.4em] opacity-50">
                  Premium Global Streaming Infrastructure
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cinematic Vignette & Grain */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] opacity-80" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </section>
  );
};

export default TfcParticleHero;
