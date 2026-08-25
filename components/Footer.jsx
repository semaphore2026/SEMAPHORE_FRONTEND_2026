"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#252D38]/90 backdrop-blur-md text-white border-t border-cyan-500/20 z-30 overflow-hidden font-mono">
      {/* Bioluminescent Background Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full px-6 md:px-12 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-12 mb-16 items-start">
          {/* Column 1: Brand & Logo */}
          <div className="md:col-span-4 flex flex-col space-y-4">
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
              9–10 OCTOBER 2026 • NMAMIT, NITTE
            </div>

            {/* Instagram Box */}
            <a
              href="https://instagram.com/semaphore_nmamit"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-3 px-4 py-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-colors group w-fit"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="2"
                  className="w-4 h-4"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-cyan-100/50 uppercase tracking-widest">Follow us</span>
                <span className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                  @semaphore_nmamit
                </span>
              </div>
            </a>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 flex flex-col space-y-4">
            <h4 className="text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
              NAVIGATE
            </h4>
            <ul className="space-y-2.5 text-xs text-cyan-100/70">
              <li><a href="#" className="hover:text-cyan-300 transition-colors">Surface Home</a></li>
              <li><a href="#" className="hover:text-cyan-300 transition-colors">Deep Ocean Journey</a></li>
              <li><a href="#" className="hover:text-cyan-300 transition-colors">Events & Competitions</a></li>
              <li><a href="#" className="hover:text-cyan-300 transition-colors">About MCA Department</a></li>
              <li>
                <a
                  href="mailto:semaphore@nitte.edu.in?subject=Contact%20%26%20Support"
                  className="hover:text-cyan-300 transition-colors text-cyan-300/90 font-bold"
                >
                  Contact & Support →
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Info */}
          <div className="md:col-span-2 flex flex-col space-y-4">
            <h4 className="text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
              CONNECT
            </h4>
            <ul className="space-y-2.5 text-xs text-cyan-100/70">
              <li>NMAMIT, Nitte</li>
              <li>Karkala Taluk, Udupi</li>
              <li>Karnataka, India</li>
              <li><a href="mailto:semaphore@nitte.edu.in" className="hover:text-cyan-300 transition-colors">semaphore@nitte.edu.in</a></li>
            </ul>
          </div>

          {/* Column 4: Student Coordinators */}
          <div className="md:col-span-3 flex flex-col space-y-4">
            <h4 className="text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
              STUDENT COORDINATORS
            </h4>
            <ul className="space-y-3 text-xs text-cyan-100/70">
              <li className="flex flex-col gap-0.5">
                <span className="text-cyan-200 font-bold">Rahul Shetty</span>
                <a href="tel:+919999999901" className="hover:text-cyan-300 transition-colors">
                  +91 99999 99901
                </a>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="text-cyan-200 font-bold">Ananya Rao</span>
                <a href="tel:+919999999902" className="hover:text-cyan-300 transition-colors">
                  +91 99999 99902
                </a>
              </li>
              <li className="flex flex-col gap-0.5 pt-3 mt-1 border-t border-cyan-500/10">
                <span className="text-cyan-400 font-bold uppercase tracking-wide text-[10px]">Main Coordinator</span>
                <span className="text-cyan-200 font-bold">Dummy Faculty Name</span>
                <a href="tel:+919999999900" className="hover:text-cyan-300 transition-colors">
                  +91 99999 99900
                </a>
              </li>
            </ul>
          </div>
        </div>

  

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-cyan-500/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-cyan-100/40 tracking-widest uppercase">
          <p>© 2026 SEMAPHORE 2K26. ALL RIGHTS RESERVED.</p>
          <p className="text-cyan-400/80">DEPARTMENT OF MCA • NMAMIT NITTE</p>
        </div>
      </div>
    </footer>
  );
}
