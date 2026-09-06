"use client";

import React, { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.semaphore2k26.in';

export default function SetTeamCard({ user, onUserUpdate }) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Extract existing team info if available
  const existingTeam = user?.team || user?.teamId || null;
  const existingTeamName = typeof existingTeam === 'object' 
    ? existingTeam?.name 
    : (user?.teamName || (typeof user?.teamid === 'object' ? user?.teamid?.name : (typeof user?.teamid === 'string' ? null : null)));
  
  const existingTeamId = typeof existingTeam === 'object' 
    ? existingTeam?.teamid 
    : (typeof user?.teamid === 'object' ? user?.teamid?.teamid : (typeof user?.teamid === 'string' ? user?.teamid : null));

  const [isEditing, setIsEditing] = useState(!existingTeamName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("Please enter a valid team name.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authorization token not found. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/teams/set-team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamName: teamName.trim() }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 201 || response.ok) {
        setSuccess(data?.message || "Team created and assigned successfully");
        setTeamName("");
        setIsEditing(false);

        // Update parent user state if handler provided
        if (onUserUpdate) {
          const updatedTeam = data?.team || { name: teamName.trim() };
          const updatedUser = data?.user 
            ? { ...data.user, team: updatedTeam } 
            : { ...user, team: updatedTeam, teamid: updatedTeam._id || updatedTeam.teamid };
          onUserUpdate(updatedUser);
        }
      } else {
        setError(data?.message || `Failed to set team (${response.status})`);
      }
    } catch (err) {
      console.error("Error setting team:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Team Information</h3>
            <p className="text-xs text-gray-400 font-medium">
              {existingTeamName ? "Your assigned team for event registrations" : "Set your team name before making payments"}
            </p>
          </div>
        </div>

      </div>

      {error && (
        <div className="mb-4 p-3.5 text-xs text-red-400 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></div>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 text-xs text-cyan-400 bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></div>
          {success}
        </div>
      )}

      {existingTeamName && !isEditing ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Active Team</span>
            <span className="text-lg font-extrabold text-white">{existingTeamName}</span>
          </div>
          {existingTeamId && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">Team Code</span>
              <span className="text-xs font-mono font-bold text-white">{existingTeamId}</span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter Team Name (e.g. CyberKnights)"
              className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-cyan-500/50 rounded-xl text-sm font-medium text-white focus:outline-none transition-all placeholder-gray-500"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !teamName.trim()}
              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border shadow-sm ${
                loading || !teamName.trim()
                  ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                  : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/50 cursor-pointer"
              }`}
            >
              {loading ? "Saving..." : existingTeamName ? "Update Team" : "Set Team"}
            </button>
            {existingTeamName && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                className="px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
