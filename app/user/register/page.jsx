"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import WaterWave from '@/components/WaterWaveWrapper';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.semaphore2k26.in';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '168801764074-kcn9c9to0daenc3o5pn9nfutgho8pcin.apps.googleusercontent.com';

import { Suspense } from 'react';

function UserRegisterContent() {
  const [colleges, setColleges] = useState([]);
  const [collegeName, setCollegeName] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customCollege, setCustomCollege] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptReady, setScriptReady] = useState(false);
  const gisBtnRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const finalCollegeName = isCustom ? customCollege.trim() : collegeName;

  // Fetch colleges list from API
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/colleges`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load colleges');

        const rawList = Array.isArray(data) ? data : (data.colleges || []);
const list = rawList.map((c) => (typeof c === 'string' ? c : c.collegeName));
setColleges(list);
if (list.length > 0) setCollegeName(list[0]);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchColleges();
  }, []);

  const authenticateWithGoogle = useCallback(async (credential) => {
    if (!finalCollegeName) {
      setError('Please select or enter your college name first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, collegeName: finalCollegeName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      if (data.token) localStorage.setItem('token', data.token);
      
      const redirectUrl = searchParams.get('redirect');
      router.push(redirectUrl ? decodeURIComponent(redirectUrl) : '/user/account');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [finalCollegeName, searchParams, router]);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScriptReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || !window.google?.accounts?.id || !gisBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res) => authenticateWithGoogle(res.credential),
    });

    gisBtnRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(gisBtnRef.current, {
      theme: 'filled_blue',
      size: 'large',
      width: 320,
      text: 'continue_with',
    });
  }, [scriptReady, authenticateWithGoogle]);

  const canContinue = Boolean(finalCollegeName) && !loading;

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


      <main className="relative z-10 w-full max-w-lg mx-auto px-4 py-12 flex-grow flex items-center justify-center">
        <div className="w-full relative p-8 sm:p-12 rounded-[2rem] bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.02)] overflow-hidden">
          {/* Glowing Orbs behind the plate */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 space-y-6 flex flex-col items-center w-full">
            {/* Futuristic Label Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-[0.25em] uppercase shadow-[0_0_15px_rgba(0,219,233,0.2)] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_6px_#00dbe9]" />
              <span>SEMAPHORE 2K26 // AUTH</span>
            </div>

            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl whitespace-nowrap font-black tracking-[0.1em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_25px_rgba(0,219,233,0.8)]">
                Register/Login
              </h2>
              <p className="text-xs sm:text-sm font-mono tracking-[0.15em] text-cyan-200/80 mt-2">
                SELECT YOUR COLLEGE, THEN CONTINUE WITH GOOGLE
              </p>
            </div>

            <div className="w-full space-y-4 text-left">
              <label className="flex items-center space-x-2 text-[11px] font-bold tracking-widest text-cyan-200 uppercase">
                <span className="bg-cyan-500 text-black px-1.5 py-0.5 rounded text-[9px] font-black">01</span>
                <span>Select college name</span>
              </label>

              {!isCustom ? (
                <select
                  className="w-full bg-[#040f1a]/60 border border-cyan-400/30 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all duration-300 backdrop-blur-sm"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                >
                  {colleges.map((c) => (
                    <option key={c} value={c} className="bg-[#0a1420] text-slate-200">
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full bg-[#040f1a]/60 border border-cyan-400/30 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all duration-300 backdrop-blur-sm placeholder:text-slate-500"
                  placeholder="Type your college name"
                  value={customCollege}
                  onChange={(e) => setCustomCollege(e.target.value)}
                  autoFocus
                />
              )}

            </div>

            <div className="w-full space-y-4 pt-4 border-t border-white/10">
              <label className="flex items-center space-x-2 text-[11px] font-bold tracking-widest text-cyan-200 uppercase">
                <span className="bg-cyan-500 text-black px-1.5 py-0.5 rounded text-[9px] font-black">02</span>
                <span>Authenticate with Google</span>
              </label>

              <div className="flex justify-center py-2 w-full">
                <div
                  ref={gisBtnRef}
                  style={{ opacity: canContinue ? 1 : 0.35, pointerEvents: canContinue ? 'auto' : 'none' }}
                  className="transition-opacity duration-300 min-h-[44px] min-w-[320px] flex justify-center items-center"
                />
              </div>

              {!canContinue && !loading && (
                <p className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> 
                  <span>Enter a college name to enable sign-in.</span>
                </p>
              )}
              {loading && (
                <p className="flex items-center justify-center space-x-2 text-xs text-cyan-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> 
                  <span>Signing you in…</span>
                </p>
              )}
              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2 text-center">
                  ⚠ {error}
                </p>
              )}
            </div>

            <div className="w-full flex justify-between items-center text-[9px] font-mono tracking-widest text-slate-400 pt-6 border-t border-cyan-500/20 uppercase mt-4">
              <span>DEPTH: SIGN-IN</span>
              <span className="flex items-center space-x-1.5">
                <span>STATUS:</span>
                <span className={loading ? 'text-cyan-400 animate-pulse' : canContinue ? 'text-green-400' : 'text-slate-500'}>
                  {loading ? 'CONNECTING' : canContinue ? 'READY' : 'STANDBY'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function UserRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020714] text-cyan-300 flex items-center justify-center font-mono">Loading...</div>}>
      <UserRegisterContent />
    </Suspense>
  );
}