"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfileSidebar({ user }) {
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/user/register");
  };

  // Extract team details
  const teamObj = user.team || user.teamId || user.teamid;
  const teamName = typeof teamObj === 'object' ? teamObj?.name : (user.teamName || (typeof user.teamid === 'string' ? null : null));

  return (
    <div className="w-full md:w-120 shrink-0 flex flex-col gap-6 md:sticky md:top-12 h-fit">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg flex flex-col items-center">
        <Image
          src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name + "&background=0d1424&color=fff"}
          alt={user.name}
          width={96}
          height={96}
          unoptimized
          className="w-24 h-24 rounded-full mb-4 shadow-md object-cover border-4 border-white/10"
        />
        <h2 className="text-xl font-extrabold text-white text-center uppercase tracking-wider">{user.name}</h2>
        <p className="text-sm text-gray-400 mb-6 text-center">{user.email}</p>

        <div className="w-full space-y-3 mb-6 border-t border-white/10 pt-4">
          <div className="flex justify-between text-sm items-center">
            <span className="font-bold text-gray-300">Role:</span>
            <span className="text-gray-400 font-medium">{user.role || 'Participant'}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="font-bold text-gray-300">College:</span>
            <span className="text-gray-400 font-medium text-right max-w-[60%] line-clamp-2">
              {user.collegeName || user.college?.collegeName || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="font-bold text-gray-300">Team:</span>
            {teamName ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 text-cyan-400 font-bold rounded-lg text-xs border border-cyan-500/30">
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {teamName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
                Not Set
              </span>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <button
            onClick={() => router.push('/user/account')}
            className="text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
          >
            My Dashboard
          </button>
          <button
            onClick={() => router.push('/events/register')}
            className="text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-gray-400 hover:bg-white/10 hover:text-white border border-transparent"
          >
            Events
          </button>

          <div className="h-px bg-white/10 my-2"></div>

          <button
            onClick={handleLogout}
            className="text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
