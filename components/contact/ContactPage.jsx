"use client";

import React, { useState } from "react";
import Link from "next/link";
import WaterWave from "../WaterWaveWrapper";
import Footer from "../Footer";
import DeveloperCard from "../developer/DeveloperCard";
import { staffCoordinators, studentCoordinators } from "../developer/developersData";
import eventsData from "../../data/events.json";

export default function ContactPage() {
  const [imageErrorMap, setImageErrorMap] = useState({});
  const generalRulesData = eventsData.find(e => e.id === "general-rules");

  const handleImageError = (id) => {
    setImageErrorMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#020714] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col justify-between pt-6 sm:pt-8">
      {/* TECHY UNDERWATER BACKGROUND IMAGE WITH RIPPLES */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <WaterWave
          imageUrl="/techy_underwater_bg.png"
          dropRadius={25}
          perturbance={0.03}
          resolution={512}
          className="absolute inset-0 w-full h-full opacity-60"
        >
          {() => <div className="w-full h-full" />}
        </WaterWave>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020714]/80 via-transparent to-[#020714]/95" />
      </div>

      {/* FLOATING ACTION BUTTON */}


      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-grow flex flex-col items-center justify-center">

        {/* ================================================== */}
        {/* CORE TEAM SECTION (Staff & Student Coordinators) */}
        {/* ================================================== */}
        <section className="space-y-8 w-full pt-2 mb-16">
          <div className="text-center space-y-2 mt-4 mb-8 relative z-10">
            <div className="flex items-center justify-center space-x-2 text-cyan-300 text-[11px] font-mono tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(0,219,233,0.5)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9]" />
              <span>LEADERSHIP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9]" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-sans tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 uppercase drop-shadow-[0_0_20px_rgba(0,219,233,0.5)]">
              CORE TEAM
            </h2>
          </div>

          <div className="flex items-center space-x-3 pb-3 border-b border-white/10 mt-4">
            <div className="p-1.5 rounded-xl bg-white/5 border border-white/20 text-cyan-300 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] backdrop-blur-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black font-mono text-white uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              STAFF COORDINATOR
            </h2>
            <div className="flex-grow h-px bg-gradient-to-r from-cyan-400/50 via-cyan-400/10 to-transparent" />
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-5 lg:gap-6 w-full">
            {staffCoordinators.map((dev) => (
              <DeveloperCard key={dev.id} dev={dev} imageErrorMap={imageErrorMap} handleImageError={handleImageError} hideSocials={true} />
            ))}
          </div>

          <div className="flex items-center space-x-3 pb-3 pt-8 border-b border-white/10 mt-12">
            <div className="p-1.5 rounded-xl bg-white/5 border border-white/20 text-cyan-300 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] backdrop-blur-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black font-mono text-white uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              STUDENT COORDINATORS
            </h2>
            <div className="flex-grow h-px bg-gradient-to-r from-cyan-400/50 via-cyan-400/10 to-transparent" />
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-5 lg:gap-6 w-full">
            {studentCoordinators.map((dev) => (
              <DeveloperCard key={dev.id} dev={dev} imageErrorMap={imageErrorMap} handleImageError={handleImageError} hideSocials={true} />
            ))}
          </div>
        </section>

        <section className="space-y-6 w-full pt-4">
          <div className="text-center space-y-2 mb-6">
            <div className="flex items-center justify-center space-x-2 text-cyan-300 text-[11px] font-mono tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(0,219,233,0.5)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9]" />
              <span>COMMAND CENTER</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9]" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-sans tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 uppercase drop-shadow-[0_0_20px_rgba(0,219,233,0.5)]">
              HEADQUARTER
            </h2>

            <a
              href="https://maps.google.com/?q=NMAMIT+Nitte+Karkala"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-mono text-cyan-200 hover:text-white hover:bg-white/10 tracking-widest uppercase transition-all shadow-sm mt-2"
            >
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-bold">NMAMIT NITTE, KARKALA</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="relative w-full h-[280px] sm:h-[350px] md:h-[400px] rounded-[2rem] border border-white/10 border-t-white/20 border-l-white/20 bg-white/5 backdrop-blur-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(255,255,255,0.03)] group [perspective:1000px]">
            <div className="w-full h-full [transform-style:preserve-3d] transition-transform duration-1000 group-hover:[transform:rotateX(2deg)_rotateY(-1deg)_scale(1.02)]">
              <iframe
                title="NMAMIT Nitte Location Map"
                src="https://maps.google.com/maps?q=NMAMIT+Nitte+Karkala+Karnataka&t=k&z=16&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 filter brightness-[0.5] contrast-[1.4] saturate-[0.8] hue-rotate-[15deg] mix-blend-luminosity group-hover:mix-blend-normal group-hover:brightness-[0.8] transition-all duration-1000 pointer-events-auto"
                loading="lazy"
                allowFullScreen
              />

              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#020714] via-transparent to-[#020714]/80 opacity-80" />
              <div className="absolute inset-0 pointer-events-none bg-cyan-900/10 mix-blend-overlay" />

              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 max-w-[220px] sm:max-w-[260px] bg-white/10 backdrop-blur-xl border border-white/10 border-t-white/20 border-l-white/20 rounded-2xl p-3 sm:p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.6)] z-10 pointer-events-auto [transform:translateZ(30px)] transition-transform duration-700">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-white text-[11px] sm:text-xs leading-tight tracking-wide drop-shadow-md">
                    NMAMIT - Nitte Institute of Technology
                  </h3>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <a
                      href="https://maps.google.com/?q=NMAMIT+Nitte+Karkala"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Maps"
                      className="w-6 h-6 rounded-full bg-white/10 border border-white/20 hover:bg-cyan-400 hover:border-cyan-300 text-cyan-200 hover:text-slate-900 transition-all flex items-center justify-center backdrop-blur-md shadow-sm"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <p className="text-[10px] text-cyan-100/80 font-sans mt-1.5 leading-snug font-light">
                  Nitte, SH1, Karkala, Karnataka 574110
                </p>

                <div className="flex items-center space-x-1.5 mt-2 pt-2 border-t border-white/10 text-[10px] font-mono">
                  <span className="font-bold text-amber-300 text-[11px]">4.4</span>
                  <div className="flex text-amber-400 text-[9px] drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]">
                    {'★'.repeat(4)}{'☆'.repeat(1)}
                  </div>
                  <span className="text-white/50 text-[9px]">(1,625)</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/10 backdrop-blur-xl border border-white/10 border-t-white/20 border-l-white/20 rounded-2xl p-2.5 sm:p-3 text-left font-mono text-[9px] space-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.6)] z-10 pointer-events-auto min-w-[140px] sm:min-w-[155px] [transform:translateZ(20px)] transition-transform duration-700">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold tracking-widest pb-1 border-b border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span>LOCATION_SYNCED</span>
                </div>
                <div className="text-cyan-200 font-medium space-y-0.5 pt-1">
                  <p><span className="text-white/50">LAT :</span> 13.2088°N</p>
                  <p><span className="text-white/50">LON :</span> 74.9320°E</p>
                  <p className="text-white font-bold pt-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">NMAMIT NITTE</p>
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto [transform:translateZ(40px)] transition-transform duration-700">
                <div className="inline-flex items-center space-x-2 px-5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 border-t-white/30 text-cyan-200 font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 flex items-center justify-center shadow-[0_0_10px_#00dbe9]">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  </span>
                  <span>AQUASAGA NEURAL HQ</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* General Rules Section */}
        {generalRulesData && (
          <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 z-20 mb-20 font-mono">
            <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center space-x-2 bg-cyan-900/30 border border-cyan-400/30 px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9]" />
                <span className="text-[10px] font-bold text-cyan-300 tracking-[0.2em] uppercase">
                  {generalRulesData.category}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9]" />
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-sans tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 uppercase drop-shadow-[0_0_20px_rgba(0,219,233,0.5)] mb-4">
                {generalRulesData.name}
              </h2>
              <p className="text-cyan-200/80 text-sm max-w-2xl mx-auto">
                {generalRulesData.description}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(255,255,255,0.03)] mx-auto max-w-4xl">
              <ul className="space-y-4 text-white/80 list-none">
                {generalRulesData.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start space-x-3 text-sm sm:text-base leading-relaxed tracking-wide">
                    <span className="text-cyan-400 mt-0.5">▹</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
