"use client";

import React, { useEffect, useState } from 'react';
import WaterWave from '@/components/WaterWaveWrapper';

export default function RulePage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch('https://api.semaphore2k26.in/api/teamrules');

        if (!response.ok) {
          throw new Error('Failed to fetch team rules');
        }

        const result = await response.json();

        if (
          result.success &&
          result.data &&
          Array.isArray(result.data.rules)
        ) {
          setRules(result.data.rules);
        } else {
          throw new Error('Invalid rules data received from server');
        }
      } catch (err) {
        console.error('Error fetching team rules:', err);
        setError('Unable to load rules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  return (
    <div className="min-h-screen bg-[#020714] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col relative">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <WaterWave
          imageUrl="/login_bg.png"
          dropRadius={25}
          perturbance={0.03}
          resolution={512}
          className="absolute inset-0 w-full h-full opacity-60 bg-no-repeat bg-cover bg-center"
        >
          {() => <div className="w-full h-full" />}
        </WaterWave>

        {/* Deep ocean gradient overlay to ensure text readability */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020714]/80 via-transparent to-[#020714]/95" />
      </div>

<main className="relative z-10 w-full max-w-3xl mx-auto px-4 py-12 flex-grow flex items-center justify-center">        <div className="w-full relative p-8 sm:p-12 rounded-[2rem] bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.02)] overflow-hidden">
          {/* Glowing Orbs behind the plate */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 space-y-6 flex flex-col items-center w-full">
            {/* Futuristic Label Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-[0.25em] uppercase shadow-[0_0_15px_rgba(0,219,233,0.2)] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_6px_#00dbe9]" />
              <span>SEMAPHORE 2K26 // RULES</span>
            </div>

            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.1em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_25px_rgba(0,219,233,0.8)]">
                Team Rules
              </h2>
              <p className="text-xs sm:text-sm font-mono tracking-[0.15em] text-cyan-200/80 mt-2">
                READ CAREFULLY BEFORE YOU DIVE IN
              </p>
            </div>

            {/* LOADING */}
            {loading && (
              <p className="flex items-center justify-center space-x-2 text-xs text-cyan-300 font-mono py-6">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>LOADING RULES…</span>
              </p>
            )}

            {/* ERROR */}
            {!loading && error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-center w-full">
                ⚠ {error}
              </p>
            )}

            {/* RULES LIST */}
            {!loading && !error && rules.length > 0 && (
              <ol className="w-full space-y-4 pt-2">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 bg-cyan-500 text-black px-1.5 py-0.5 rounded text-[9px] font-black font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                      {rule}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {/* NO RULES */}
            {!loading && !error && rules.length === 0 && (
              <p className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-mono py-6">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>No rules available.</span>
              </p>
            )}

            <div className="w-full flex justify-between items-center text-[9px] font-mono tracking-widest text-slate-400 pt-6 border-t border-cyan-500/20 uppercase mt-4">
              <span>DEPTH: RULES</span>
              <span className="flex items-center space-x-1.5">
                <span>STATUS:</span>
                <span
                  className={
                    loading
                      ? 'text-cyan-400 animate-pulse'
                      : error
                      ? 'text-red-400'
                      : 'text-green-400'
                  }
                >
                  {loading ? 'FETCHING' : error ? 'ERROR' : 'LOADED'}
                </span>
              </span>
            </div>

            <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase text-center pt-2">
              National Level MCA Tech Fest · NMAMIT Nitte
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
