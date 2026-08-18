import React, { useEffect, useState } from 'react';

interface LoaderProps {
  loading: boolean;
  progress: number;
}

export default function Loader({ loading, progress }: LoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [shouldHide, setShouldHide] = useState(false);

  // Smoothly animate the progress number 1 by 1 without skipping
  useEffect(() => {
    // If Scene says loading is false, the absolute target is 100.
    const target = loading ? progress : 100;

    if (displayProgress < target) {
      const timeout = setTimeout(() => {
        setDisplayProgress(prev => prev + 1);
      }, 10); // 10ms interval gives a smooth 1-second counting animation from 0-100 without skipping
      return () => clearTimeout(timeout);
    }
  }, [progress, displayProgress, loading]);

  // Wait exactly 1 second after hitting 100% before fading out
  useEffect(() => {
    if (!loading && displayProgress === 100) {
      const timer = setTimeout(() => {
        setShouldHide(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, displayProgress]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0908] transition-opacity duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${!shouldHide ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
    >
      <div
        className={`w-full max-w-lg px-8 transition-all duration-1000 transform ${!shouldHide ? "translate-y-0 opacity-100 delay-300" : "-translate-y-8 opacity-0"
          }`}
      >
        {/* Equalizer Animation */}
        <div className="flex items-end justify-center gap-[3px] mb-12 h-8">
          {[0.1, 0.3, 0.5, 0.7, 0.5, 0.3, 0.1].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 bg-blue-500 rounded-full shadow-[blue]"
              style={{
                height: '100%',
                animation: `eq 1.2s ease-in-out infinite`,
                animationDelay: `${delay}s`
              }}
            />
          ))}
        </div>

        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-sm md:text-base tracking-[0.6em] font-medium uppercase text-[#eae5de] ml-[0.6em]">
            SEMAPHORE 2K26
          </h1>
        </div>

        {/* Progress Line */}
        <div className="w-full h-[1px] bg-[#2f2c28] mb-6">
          <div
            className="h-full bg-[#eae5de] transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#8f8a84] font-medium">
            DEPLOYING INTO THE DEEP
          </span>
          <span className="text-xs md:text-sm font-bold text-[#eae5de] tracking-wider">
            {displayProgress}%
          </span>
        </div>
      </div>
    </div>
  );
}
