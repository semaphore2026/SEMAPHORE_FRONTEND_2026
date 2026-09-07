"use client";

import React, { useEffect, useState } from "react";
import Footer from "./Footer";
import WaterWave from "./WaterWaveWrapper";


export default function RulePage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch("https://api.semaphore2k26.in/api/teamrules");

        if (!response.ok) {
          throw new Error("Failed to fetch team rules");
        }

        const result = await response.json();
        console.log("Team Rules API Response:", result);

        if (result.success && result.data && Array.isArray(result.data.rules)) {
          setRules(result.data.rules);
        } else {
          throw new Error("Invalid rules data received from server");
        }
      } catch (err) {
        console.error("Error fetching team rules:", err);
        setError("Unable to load rules. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  return (
    <div className="min-h-screen bg-[#020714] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col justify-between pt-24 sm:pt-32">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <WaterWave
          imageUrl="/techy_underwater_bg.png"
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
      <main className="flex-grow flex flex-col items-center w-full pb-10 pointer-events-none">
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 z-20 mb-20 font-mono pointer-events-auto">
          <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center space-x-2 bg-cyan-900/30 border border-cyan-400/30 px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9]" />
              <span className="text-[10px] font-bold text-cyan-300 tracking-[0.2em] uppercase">
                SEMAPHORE 2K26
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9]" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-sans tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 uppercase drop-shadow-[0_0_20px_rgba(0,219,233,0.5)] mb-4">
              TEAM RULES
            </h2>
            <p className="text-cyan-200/80 text-sm max-w-2xl mx-auto">
              Please read through the general guidelines and rules for participation in Semaphore 2026.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(255,255,255,0.03)] mx-auto max-w-4xl min-h-[300px] flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center flex-grow space-y-4 py-20">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <p className="text-cyan-300 font-mono text-sm tracking-widest animate-pulse">LOADING RULES...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center flex-grow space-y-4 text-center py-20">
                <span className="text-4xl">⚠️</span>
                <p className="text-red-400 font-mono text-sm tracking-widest uppercase max-w-sm">{error}</p>
              </div>
            ) : rules.length > 0 ? (
              <ul className="space-y-4 text-white/80 list-none">
                {rules.map((rule, idx) => {
                  const isLast = idx === rules.length - 1;
                  return (
                    <li
                      key={idx}
                      className={`flex items-start space-x-3 text-sm sm:text-base leading-relaxed tracking-wide ${isLast ? 'font-bold text-cyan-50 mt-6 pt-4 border-t border-white/10' : ''}`}
                    >
                      <span className="text-cyan-400 mt-0.5">{isLast ? '⚠️' : '▹'}</span>
                      <span>{rule}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center flex-grow space-y-4 text-center py-20">
                <p className="text-cyan-300/60 font-mono text-sm tracking-widest uppercase">No rules available.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
