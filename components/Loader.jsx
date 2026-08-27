'use client';

// The loader's visual content. The full-screen overlay that hosts it, and the exit
// choreography, both belong to <PreloadProvider> — that way there is exactly one
// timeline running the hand-off instead of two fades fighting each other, and the
// overlay can sit there as a plain colour for the first few hundred milliseconds
// without flashing a progress bar on a warm cache.

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Loader({ contentRef, progress, error, onRetry }) {
  const [displayProgress, setDisplayProgress] = useState(0);

  const localRef = useRef(null);
  const rootRef = contentRef || localRef;
  const progressBarRef = useRef(null);
  const eqBarsRef = useRef([]);
  const tweenObj = useRef({ value: 0 });

  // GSAP Entrance Animation on Mount
  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [rootRef]);

  // GSAP Smooth Progress Bar & Counter Tween
  useEffect(() => {
    gsap.to(tweenObj.current, {
      value: progress,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => {
        const rounded = Math.floor(tweenObj.current.value);
        setDisplayProgress(rounded);
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${tweenObj.current.value}%`;
        }
      },
    });
  }, [progress]);

  return (
    <div ref={rootRef} className="w-full max-w-lg px-8">
      <div className="flex items-end justify-center gap-[3px] mb-12 h-8">
        {[0.1, 0.3, 0.5, 0.7, 0.5, 0.3, 0.1].map((delay, i) => (
          <div
            key={i}
            ref={(el) => (eqBarsRef.current[i] = el)}
            className="w-1.5 bg-blue-500 rounded-full shadow-[blue]"
            style={{
              height: '100%',
              animation: 'eq 1.2s ease-in-out infinite',
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      <div className="text-center mb-16">
        <h1 className="text-sm md:text-base tracking-[0.6em] font-medium uppercase text-[#eae5de] ml-[0.6em]">
          SEMAPHORE 2K26
        </h1>
      </div>

      {error ? (
        <div className="text-center">
          <p className="text-[11px] md:text-xs tracking-[0.25em] uppercase text-[#c8b9a6] mb-3">
            {error}
          </p>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#6f6a64] mb-6">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="px-8 py-2.5 text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#eae5de] border border-[#3d3832] hover:border-[#eae5de] hover:bg-[#eae5de]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eae5de] transition-all duration-500"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="w-full h-[1px] bg-[#2f2c28] mb-6 overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-[#eae5de]"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#8f8a84] font-medium">
              DEPLOYING INTO THE DEEP NOW!
            </span>
            <span className="text-xs md:text-sm font-bold text-[#eae5de] tracking-wider">
              {displayProgress}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
