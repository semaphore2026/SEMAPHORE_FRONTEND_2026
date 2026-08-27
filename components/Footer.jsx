"use client";

import React from "react";
// Internal links go through next/link: a full page load would tear down the app and
// replay the whole preload gate instead of doing a client-side navigation.
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#252D38]/90 backdrop-blur-md text-white border-t border-cyan-500/20 z-30 overflow-hidden font-mono">
      {/* Bioluminescent Background Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full px-6 md:px-12 pt-16 pb-8 md:pt-24 md:pb-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between gap-y-12 items-start mb-16">
          {/* Brand & Logo */}
          <div className="w-full md:max-w-md flex flex-col space-y-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                <div className="w-3.5 h-3.5 bg-cyan-400 rounded-full animate-pulse" />
              </div>
              <span className="text-2xl font-black tracking-[0.2em] text-white">
                SEMAPHORE <span className="text-cyan-400">2K26</span>
              </span>
            </div>
            <p className="text-cyan-100/60 text-xs leading-relaxed max-w-md pt-2">
              National Level IT & Cultural Fest organized by the Department of Master of Computer Applications (MCA), NMAM Institute of Technology (NMAMIT), Nitte.
            </p>
            <div className="pt-2 text-cyan-400 font-bold text-xs tracking-widest uppercase">
              17-18 September 2026 • NMAMIT, NITTE
            </div>
          </div>

          {/* Grouped Links */}
          <div className="w-full md:w-auto flex flex-col md:flex-row justify-end gap-16 md:gap-32 lg:gap-48 shrink-0">
            {/* Quick Links */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
                NAVIGATE
              </h4>
              <ul className="space-y-2.5 text-xs text-cyan-100/70">
                <li><Link href="/" className="hover:text-cyan-300 transition-colors">Surface Home</Link></li>
                <li><Link href="/events/register" className="hover:text-cyan-300 transition-colors">Events & Competitions</Link></li>
                <li><a href="https://nitte.edu.in/nmamit/department-mca.php" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 transition-colors">About MCA Department</a></li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-cyan-300 transition-colors text-cyan-300/90 font-bold"
                  >
                    Contact & Support →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Info */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
                CONNECT
              </h4>
              <ul className="space-y-2.5 text-xs text-cyan-100/70">
                <li>NMAMIT, Nitte</li>
                <li>Karkala Taluk, Udupi</li>
                <li>Karnataka, India</li>
                <li><a href="mailto:semaphore@nitte.edu.in" className="hover:text-cyan-300 transition-colors">semaphore2026@gmail.com</a></li>
              </ul>
            </div>

            {/* Student Coordinators */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
                COORDINATORS
              </h4>
              <ul className="space-y-3 text-xs text-cyan-100/70">
                <li className="flex flex-col gap-0.5">
                  <span className="text-cyan-200 font-bold">Dr. Roshan D Suvaris</span>
                  <a href="tel:+919663484343" className="hover:text-cyan-300 transition-colors">
                    +91 9663484343
                  </a>
                </li>

                <li className="flex flex-col gap-0.5 pt-3 mt-1 border-t border-cyan-500/10">
                  <span className="text-cyan-400 font-bold uppercase tracking-wide text-[10px]">Student Coordinator</span>
                  <span className="text-cyan-200 font-bold">Vansh Shetty</span>
                  <a href="tel:+919019720766" className="hover:text-cyan-300 transition-colors">
                    +91 9019720766
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>



        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-4 mt-8 relative">

          {/* Social Media Buttons (Left aligned on desktop) */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:absolute md:left-0 mb-6 md:mb-0 z-10">
            {/* Instagram SAMCA */}
            <a
              href="https://www.instagram.com/samca_nitte_mca"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border border-cyan-400/20 bg-transparent text-cyan-200/70 hover:text-cyan-100 hover:border-cyan-400/40 text-xs font-mono font-semibold tracking-wider transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_25px_rgba(0,219,233,0.3)] hover:-translate-y-1 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>samca</span>
            </a>

            {/* Instagram SEMAPHORE.26 */}
            <a
              href="https://www.instagram.com/semaphore_nmamit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border border-cyan-400/20 bg-transparent text-cyan-200/70 hover:text-cyan-100 hover:border-cyan-400/40 text-xs font-mono font-semibold tracking-wider transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_25px_rgba(0,219,233,0.3)] hover:-translate-y-1 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>semaphore.26</span>
            </a>

            {/* YouTube SAMCA */}
            <a
              href="https://www.youtube.com/@SAMCANMAMIT"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border border-cyan-400/20 bg-transparent text-cyan-200/70 hover:text-cyan-100 hover:border-cyan-400/40 text-xs font-mono font-semibold tracking-wider transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_25px_rgba(0,219,233,0.3)] hover:-translate-y-1 group"
            >
              <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span>samca</span>
            </a>
          </div>

          {/* Centered Copyright Text */}
          <div className="flex items-center justify-center w-full text-[10px] text-cyan-100/40 tracking-widest uppercase">
            <p>© 2026 SEMAPHORE 2K26. ALL RIGHTS RESERVED.</p>
          </div>

          {/* Right aligned Department Text */}
          <div className="flex items-center justify-center md:justify-end md:absolute md:right-0 mt-4 md:mt-0 z-10 text-[10px] tracking-widest uppercase">
            <p className="text-cyan-400/80">DEPARTMENT OF MCA • NMAMIT NITTE</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
