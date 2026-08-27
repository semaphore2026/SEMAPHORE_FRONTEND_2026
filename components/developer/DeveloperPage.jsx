"use client";

import React, { useState } from "react";
import Link from "next/link";
import WaterWave from "../WaterWaveWrapper";
import { developmentTeam } from "./developersData";
import DeveloperCard from "./DeveloperCard";
import Footer from "../Footer";

export default function DeveloperPage() {
  const [imageErrorMap, setImageErrorMap] = useState({});

  const handleImageError = (id) => {
    setImageErrorMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#020714] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col justify-between pt-6 sm:pt-8">

      {/* ================================================== */}
      {/* TECHY UNDERWATER BACKGROUND IMAGE WITH RIPPLES */}
      {/* ================================================== */}
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

        {/* Deep ocean gradient overlay to ensure text readability */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020714]/80 via-transparent to-[#020714]/95" />
      </div>

      {/* Decorative HUD Side Depth Indicators */}
      <aside className="hidden 2xl:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col space-y-4 text-[9px] font-mono text-cyan-400/50 tracking-[0.3em] pointer-events-none z-20">
        <span>[ LAT: 12.91° N ]</span>
        <span>[ LON: 74.85° E ]</span>
        <span className="w-px h-10 bg-cyan-500/30 my-1 mx-auto" />
        <span>[ DEPTH: 026M ]</span>
        <span>[ UNIT: DEV_LAB ]</span>
      </aside>

      <aside className="hidden 2xl:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col space-y-4 text-[9px] font-mono text-cyan-400/50 tracking-[0.3em] text-right pointer-events-none z-20">
        <span>[ SYSTEM: ONLINE ]</span>
        <span>[ NODE: AQUASAGA ]</span>
        <span className="w-px h-10 bg-cyan-500/30 my-1 mx-auto" />
        <span>[ STATUS: ACTIVE ]</span>
        <span>[ VER: 2026.1.0 ]</span>
      </aside>

      {/* Bottom Right Decorative Starburst HUD Crosshair */}
      <div className="fixed bottom-8 right-8 hidden lg:flex items-center justify-center text-cyan-400/40 pointer-events-none z-20">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" />
        </svg>
      </div>

      {/* ================================================== */}
      {/* FLOATING ACTION BUTTON: BACK TO SURFACE */}
      {/* ================================================== */}


      {/* ================================================== */}
      {/* MAIN CONTENT AREA - ULTRA COMPACT MAX-W-5XL */}
      {/* ================================================== */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 flex-grow">

        {/* ================================================== */}
        {/* HERO SECTION */}
        {/* ================================================== */}
        {false && (
          <section className="text-center space-y-4 max-w-4xl mx-auto relative z-10">

            {/* Glassmorphic Hero Plate */}
            <div className="relative p-8 sm:p-12 rounded-[2rem] bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.02)] overflow-hidden">
              {/* Glowing Orbs behind the plate */}
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />


              <div className="relative z-10 space-y-5 flex flex-col items-center">
                {/* AQUASAGA Winged Emblem Icon Motif */}
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 flex items-center justify-center text-cyan-300 drop-shadow-[0_0_15px_rgba(0,219,233,0.8)]">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L4.5 20.5L12 17L19.5 20.5L12 2ZM12 6.5L16.2 17L12 15L7.8 17L12 6.5Z" />
                    </svg>
                  </div>
                </div>

                {/* Futuristic Label Badge */}
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-[0.25em] uppercase shadow-[0_0_15px_rgba(0,219,233,0.2)] backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_6px_#00dbe9]" />
                  <span>AQUASAGA 2026 // DEVELOPMENT UNIT</span>
                </div>

                {/* AQUASAGA Styled Main Title */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-blue-500 filter drop-shadow-[0_0_20px_rgba(0,219,233,0.4)]">
                  DEVELOPERS
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-base font-mono tracking-[0.28em] uppercase text-cyan-200 font-semibold drop-shadow-[0_0_10px_rgba(0,219,233,0.5)]">
                  THE TEAM BEHIND THE EXPERIENCE
                </p>

                {/* Description */}
                <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed font-light mt-2 drop-shadow-md">
                  Meet the engineering and design minds powering AQUASAGA 2026. A collective of developers forging immersive realities and deep-sea cyber experiences.
                </p>
              </div>
            </div>

            {/* HUD Tech Lines Decorator */}
            {/* <div className="flex items-center justify-center space-x-3 pt-6 text-cyan-400/60 text-[10px] font-mono tracking-widest">
              <span className="h-px w-20 bg-gradient-to-r from-transparent to-cyan-500/50" />
              <span>LOC // AQUASAGA_CORE_NODE</span>
              <span className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-500/50" />
            </div> */}
          </section>
        )}



        {/* ================================================== */}
        {/* DEVELOPMENT TEAM SECTION */}
        {/* ================================================== */}
        <section className="space-y-8 w-full pt-16">
          <div className="text-center space-y-2 mb-10 relative z-10">
            <div className="flex items-center justify-center space-x-2 text-cyan-300 text-[11px] font-mono tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(0,219,233,0.5)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9] animate-pulse" />
              <span>ENGINEERING</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00dbe9] animate-pulse" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-sans tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 uppercase drop-shadow-[0_0_20px_rgba(0,219,233,0.5)]">
              DEVELOPMENT TEAM
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-5 lg:gap-6 w-full">
            {developmentTeam.map((dev) => (
              <DeveloperCard key={dev.id} dev={dev} imageErrorMap={imageErrorMap} handleImageError={handleImageError} hideAllContacts={false} />
            ))}
          </div>
        </section>

      </main>

      {/* ================================================== */}
      {/* SHARED MAIN FOOTER */}
      {/* ================================================== */}
      <div className="mt-12 w-full z-20 relative">
        <Footer />
      </div>

    </div>
  );
}
