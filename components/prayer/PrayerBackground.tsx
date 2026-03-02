'use client';

import { useEffect, useRef } from 'react';
import { usePrayer } from './PrayerContext';

export function PrayerBackground() {
  const { state } = usePrayer();
  const particlesRef = useRef<HTMLDivElement>(null);

  // Generate particles
  useEffect(() => {
    if (!particlesRef.current) return;

    const container = particlesRef.current;
    const particleCount = 15;

    // Clear existing particles
    container.innerHTML = '';

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'prayer-particle';

      // Random properties
      const size = 3 + Math.random() * 6;
      const left = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = 15 + Math.random() * 20;
      const driftX = -30 + Math.random() * 60;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        bottom: -10px;
        --drift-x: ${driftX}px;
        animation: particleFloat ${duration}s ease-in-out ${delay}s infinite;
      `;

      container.appendChild(particle);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [state.theme]);

  return (
    <div className={`prayer-background theme-${state.theme}`}>
      {/* Gradient Layers */}
      <div className="prayer-gradient-layer prayer-gradient-layer-1" />
      <div className="prayer-gradient-layer prayer-gradient-layer-2" />
      <div className="prayer-gradient-layer prayer-gradient-layer-3" />

      {/* Light Rays */}
      <div className="prayer-light-rays" />

      {/* Particles */}
      <div className="prayer-particles" ref={particlesRef} />

      {/* Film Grain */}
      <div className="prayer-grain" />
    </div>
  );
}
