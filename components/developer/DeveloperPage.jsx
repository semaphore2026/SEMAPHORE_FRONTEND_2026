"use client";
import Footer from "@/components/Footer";
import React, { useState } from "react";
import Link from "next/link";
import WaterWave from "../WaterWaveWrapper";
import { developmentTeam } from "./developersData";
import DeveloperCard from "./DeveloperCard";

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
              <DeveloperCard key={dev.id} dev={dev} imageErrorMap={imageErrorMap} handleImageError={handleImageError} hideAllContacts={true} />
            ))}
          </div>
        </section>

      </main>

      {/* ================================================== */}
      {/* FOOTER - MATCHING AQUASAGA OCEAN COLORS & SLEEK DESIGN */}
      {/* ================================================== */}
      <footer className="border-t border-white/10 bg-gradient-to-b from-white/5 to-[#00030a] py-12 relative z-10 text-center space-y-6 backdrop-blur-lg">

        {/* Matching AQUASAGA Social Pill Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* Instagram SAMCA */}
          <a
            href="https://www.instagram.com/samca_nitte_mca"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 border-t-white/20 text-cyan-200 hover:text-white hover:border-cyan-300 hover:bg-white/10 backdrop-blur-lg font-mono text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_25px_rgba(0,219,233,0.3)] hover:-translate-y-1 group"
          >
            <svg className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>SAMCA</span>
          </a>

          {/* Instagram SEMAPHORE.26 */}
          <a
            href="https://www.instagram.com/samca_nitte_mca"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 border-t-white/20 text-cyan-200 hover:text-white hover:border-cyan-300 hover:bg-white/10 backdrop-blur-lg font-mono text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_25px_rgba(0,219,233,0.3)] hover:-translate-y-1 group"
          >
            <svg className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>SEMAPHORE.26</span>
          </a>

          {/* YouTube SAMCA */}
          <a
            href="https://www.youtube.com/@SAMCANMAMIT"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 border-t-white/20 text-cyan-200 hover:text-white hover:border-cyan-300 hover:bg-white/10 backdrop-blur-lg font-mono text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_25px_rgba(0,219,233,0.3)] hover:-translate-y-1 group"
          >
            <svg className="w-4 h-4 fill-currentColor text-cyan-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>SAMCA</span>
          </a>
        </div>

        {/* Thin Accent Line Divider */}
        <div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

        {/* Cyber Interface Telemetry Badge Bar */}
        <div className="space-y-2 pt-2">
          <div className="inline-flex items-center space-x-2 px-6 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-cyan-200 font-mono text-[10px] sm:text-xs font-bold tracking-[0.16em] uppercase shadow-sm">
            <span>AQUASAGA_DEVELOPMENT_INTERFACE_v2K26.47</span>
            <span className="text-white/30">|</span>
            <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>NEURAL_LINK_ESTABLISHED</span>
          </div>

          <p className="text-[10px] sm:text-xs text-slate-400/80 font-mono tracking-wider pt-1">
            Built with dedication by the Semaphore 2K26 Development Team
          </p>
        </div>

      </footer>
<div className="mt-12">
  <Footer />
</div>
    </div>
  );
}
