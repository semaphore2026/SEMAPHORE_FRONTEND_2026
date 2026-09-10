"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Eye,
  Camera,
  Layers,
  ArrowRight,
} from "lucide-react";
import WaterWave from "../WaterWaveWrapper";
import { memoriesData } from "@/data/memoriesData";
import Footer from "@/components/Footer";

// Register ScrollTrigger safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Cloudinary URL optimizer for blazing fast performance
const optimizeImg = (url, width = 800) => {
  if (!url || typeof url !== "string") return url;
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
  }
  return url;
};

export default function MemoriesPage() {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const containerRef = useRef(null);
  const horizontalSectionRef = useRef(null);
  const horizontalTrackRef = useRef(null);

  // Exactly 10 highlight photos for horizontal scroll
  const highlightPhotos = memoriesData.slice(0, 10);

  // Lightbox handlers
  const openLightbox = (index) => {
    setActiveLightboxIndex(index);
    setIsZoomed(false);
  };

  const closeLightbox = useCallback(() => {
    setActiveLightboxIndex(null);
    setIsZoomed(false);
  }, []);

  const nextLightbox = useCallback(() => {
    setActiveLightboxIndex((prev) => {
      if (prev === null) return null;
      return (prev + 1) % memoriesData.length;
    });
    setIsZoomed(false);
  }, []);

  const prevLightbox = useCallback(() => {
    setActiveLightboxIndex((prev) => {
      if (prev === null) return null;
      return (prev - 1 + memoriesData.length) % memoriesData.length;
    });
    setIsZoomed(false);
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeLightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxIndex, closeLightbox, nextLightbox, prevLightbox]);

  // Lock body scroll only when Lightbox is open
  useEffect(() => {
    if (activeLightboxIndex !== null) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeLightboxIndex]);

  // High-performance GSAP Horizontal Scroll with Lenis sync
  useEffect(() => {
    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 768;

      if (isDesktop && horizontalSectionRef.current && horizontalTrackRef.current) {
        const track = horizontalTrackRef.current;
        const section = horizontalSectionRef.current;

        const getScrollDistance = () => {
          return track.scrollWidth - window.innerWidth + 120;
        };

        gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getScrollDistance() * 1.15 + window.innerHeight * 0.3}`,
            pin: true,
            pinSpacing: true,
            scrub: 0.8, // Snappy & low-latency scrub
            invalidateOnRefresh: true,
            anticipatePin: 1,
            fastScrollEnd: true,
          },
        });
      }
    }, containerRef);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  const currentLightboxItem =
    activeLightboxIndex !== null ? memoriesData[activeLightboxIndex] : null;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#020714] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col justify-between"
    >
      {/* ================================================== */}
      {/* TECHY UNDERWATER BACKGROUND (OPTIMIZED RESOLUTION) */}
      {/* ================================================== */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <WaterWave
          imageUrl="/techy_underwater_bg.png"
          dropRadius={20}
          perturbance={0.02}
          resolution={256}
          className="absolute inset-0 w-full h-full opacity-50 bg-no-repeat bg-cover bg-center pointer-events-auto"
        >
          {() => <div className="w-full h-full" />}
        </WaterWave>

        {/* Deep ocean gradient overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020714]/85 via-transparent to-[#020714]/95" />
      </div>

      {/* Decorative HUD Lateral Depth Indicators */}
      <aside className="hidden 2xl:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col space-y-4 text-[9px] font-mono text-cyan-400/50 tracking-[0.3em] pointer-events-none z-20">
        <span>[ ARCHIVE: VOYAGE_2026 ]</span>
        <span>[ LAT: 12.91° N ]</span>
        <span className="w-px h-10 bg-cyan-500/30 my-1 mx-auto" />
        <span>[ DEPTH: CHRONICLES ]</span>
        <span>[ STATUS: ACTIVE ]</span>
      </aside>

      <aside className="hidden 2xl:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col space-y-4 text-[9px] font-mono text-cyan-400/50 tracking-[0.3em] text-right pointer-events-none z-20">
        <span>[ SYSTEM: ONLINE ]</span>
        <span>[ NODE: MEMORIES_VAULT ]</span>
        <span className="w-px h-10 bg-cyan-500/30 my-1 mx-auto" />
        <span>[ COUNT: {memoriesData.length} ARTIFACTS ]</span>
        <span>[ VER: 2026.1.0 ]</span>
      </aside>

      {/* Starburst Crosshair Decorator */}
      <div className="fixed bottom-8 right-8 hidden lg:flex items-center justify-center text-cyan-400/40 pointer-events-none z-20">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" />
        </svg>
      </div>

      {/* ================================================== */}
      {/* 1. HERO SECTION */}
      {/* ================================================== */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/50 border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>AQUASAGA 2026</span>
        </div>
 
        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-blue-500 mb-4">
          MEMORIES
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base font-mono tracking-[0.28em] uppercase text-cyan-200 font-semibold mb-2">
          CHRONICLES OF SEMAPHORE 2026
        </p>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-light">
          Submerge into the visual tapestry of the national-level IT fest. Explore historic moments and captures across our voyage.
        </p>

        {/* Total Count Pill */}
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#021329] border border-cyan-500/30 text-cyan-300 font-mono text-xs tracking-wider">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>{memoriesData.length} PHOTOGRAPHS</span>
        </div>
      </section>

      {/* ================================================== */}
      {/* 2. PINNED GSAP HORIZONTAL SCROLL (EXACTLY 10 IMAGES, 6:4 SIZE) */}
      {/* ================================================== */}
      <section
        ref={horizontalSectionRef}
        className="relative z-10 w-full min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-b from-transparent via-[#021020]/70 to-transparent border-y border-cyan-500/20 py-8"
      >
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2 text-cyan-300 text-[10px] font-mono tracking-[0.3em] uppercase mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>HIGHLIGHTS (10 FEATURED)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-sans tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 uppercase">
              FEATURED MOMENTS
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/80">
            <span>Scroll down to traverse horizontally</span>
            <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
          </div>
        </div>

        {/* Horizontal Track with hardware acceleration */}
        <div className="w-full overflow-x-auto md:overflow-visible no-scrollbar">
          <div
            ref={horizontalTrackRef}
            className="flex gap-5 sm:gap-7 px-4 sm:px-8 md:px-12 w-max items-center py-2 will-change-transform"
            style={{ transform: "translate3d(0, 0, 0)" }}
          >
            {highlightPhotos.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => openLightbox(idx)}
                className="group relative w-[280px] sm:w-[420px] md:w-[520px] lg:w-[580px] aspect-[6/4] rounded-2xl overflow-hidden cursor-pointer bg-[#021329] border border-cyan-500/30 hover:border-cyan-400 transition-colors duration-300 flex-shrink-0"
              >
                {/* 6:4 Optimized Image */}
                <Image
                  src={optimizeImg(item.image, 800)}
                  alt="Semaphore Memory Highlight"
                  fill
                  loading={idx < 4 ? "eager" : "lazy"}
                  sizes="(max-width: 768px) 420px, 580px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#010a16]/80 via-transparent to-transparent opacity-60 group-hover:opacity-10 transition-opacity pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded bg-black/75 border border-cyan-400/30 text-cyan-300 font-mono text-[9px] tracking-widest uppercase">
                    HIGHLIGHT #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                </div>

                {/* Expand Hover Plate */}
                <div className="absolute bottom-3 inset-x-3 p-2.5 rounded-xl bg-black/70 border border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between z-10 pointer-events-none">
                  <span className="text-cyan-300 text-xs font-mono tracking-wider font-semibold">
                    VIEW PHOTOGRAPH
                  </span>
                  <div className="w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                    <Maximize2 className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 3. COMPLETE GALLERY SECTION (6:4 SIZE) */}
      {/* ================================================== */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-300 text-[10px] font-mono tracking-[0.3em] uppercase mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>COMPLETE ARCHIVE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-sans tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 uppercase">
              ALL PHOTOGRAPHS
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/80">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>TOTAL {memoriesData.length} ARTIFACTS</span>
          </div>
        </div>

        {/* 6:4 Ratio Grid (3 Columns on Desktop, 2 on Tablet/Mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {memoriesData.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="group relative aspect-[6/4] rounded-2xl overflow-hidden cursor-pointer bg-[#020e1c] border border-cyan-500/20 hover:border-cyan-400 transition-colors duration-300"
              style={{ contentVisibility: "auto" }}
            >
              <Image
                src={optimizeImg(item.image, 650)}
                alt="Semaphore Memory Photograph"
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#020e1c]/70 via-transparent to-transparent opacity-50 group-hover:opacity-10 transition-opacity pointer-events-none" />

              {/* Index tag */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <span className="px-2 py-0.5 rounded bg-black/75 border border-cyan-500/30 text-cyan-300 font-mono text-[9px] tracking-wider uppercase">
                  #{index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>
              </div>

              {/* Hover View Button */}
              <div className="absolute inset-0 bg-cyan-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="px-3 py-1.5 rounded-full bg-cyan-400 text-black font-mono text-xs font-bold flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>VIEW</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================== */}
      {/* 4. FEST CTA */}
      {/* ================================================== */}
      <section className="relative z-10 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-[#02152e]/90 border border-cyan-500/30 overflow-hidden max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-2 text-cyan-300 text-[10px] font-mono tracking-[0.3em] uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>SEMAPHORE 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black font-sans tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 uppercase mb-3">
            CREATE YOUR MEMORY
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mb-6 font-light">
            Become a part of the AquaSaga history. Compete in premier IT & management events and carve your name in the Semaphore legacy.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/events/register"
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold font-mono text-xs tracking-wider uppercase hover:scale-105 transition-transform"
            >
              REGISTER FOR EVENTS →
            </Link>

          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 5. INTERACTIVE CINEMA LIGHTBOX MODAL */}
      {/* ================================================== */}
      {currentLightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] bg-black/95 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-150 select-none"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto z-20 pt-2">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-xs tracking-wider uppercase">
                [{activeLightboxIndex + 1} / {memoriesData.length}]
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                title={isZoomed ? "Reset Zoom" : "Zoom Image"}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                {isZoomed ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={closeLightbox}
                title="Close (Esc)"
                className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Visual Frame in 6:4 Aspect Ratio */}
          <div className="relative flex-grow flex items-center justify-center w-full max-w-6xl mx-auto my-auto overflow-hidden">
            {/* Left Nav Button */}
            <button
              onClick={prevLightbox}
              title="Previous (Left Arrow)"
              className="absolute left-2 sm:left-4 z-20 w-12 h-12 rounded-full bg-black/80 hover:bg-cyan-400 hover:text-black text-cyan-300 border border-cyan-500/30 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Nav Button */}
            <button
              onClick={nextLightbox}
              title="Next (Right Arrow)"
              className="absolute right-2 sm:right-4 z-20 w-12 h-12 rounded-full bg-black/80 hover:bg-cyan-400 hover:text-black text-cyan-300 border border-cyan-500/30 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Lightbox Image Container (6:4 format) */}
            <div
              className={`relative w-full max-w-5xl aspect-[6/4] max-h-[78vh] transition-transform duration-200 flex items-center justify-center ${isZoomed ? "scale-125 cursor-zoom-out" : "scale-100 cursor-zoom-in"
                }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <Image
                src={optimizeImg(currentLightboxItem.image, 1600)}
                alt="Semaphore Memory Lightbox View"
                fill
                sizes="(max-width: 1200px) 95vw, 1200px"
                className="object-contain rounded-xl"
                priority
              />
            </div>
          </div>

          {/* Minimal Bottom Info */}
          <div className="w-full max-w-xl mx-auto text-center pb-2 z-20">
            <span className="text-[11px] font-mono text-cyan-400/60">
              Use arrow keys ← → to navigate • ESC to close
            </span>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 6. SHARED MAIN FOOTER */}
      {/* ================================================== */}
      <div className="w-full z-20 relative">
        <Footer />
      </div>
    </div>
  );
}
