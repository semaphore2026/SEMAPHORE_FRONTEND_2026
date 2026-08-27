import React, { useState, useEffect } from "react";
import eventsData from "../data/events.json";

const chars = '!<>-_\\\\/[]{}—=+*^?#________';

function ScrambleText({ text }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(text.split('')
        .map((char, index) => {
          if (index < iterations) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('')
      );
      
      if (iterations >= text.length) {
        clearInterval(interval);
      }
      
      iterations += 1 / 3;
    }, 30);
    
    return () => clearInterval(interval);
  }, [text]);

  return <>{displayText}</>;
}

export default function EventInfoModal({ event, onClose }) {
  if (!event) return null;

  // Map Scene.jsx event.num to events.json ids
  const eventMap = {
    "01": "Code Wave",//coding
    "02": "Coral Canvas",//web design
    "03": "Aqua Byte", // IT Quiz
    "04": "Abyss Arena", // Gaming
    "05": "AquaVerse",
    "06": "Ocean Enigma",
    "07": "Leviathan",
    "08": "The Meg Pitch",
    "09": "Narcissa",
    "10": "Submarine"
    
  };

  const jsonEvent = eventsData.find(e => e.id === eventMap[event.num]);
  
  // Use json data if available, fallback to scene data
  const displayName = jsonEvent ? jsonEvent.name : event.name;
  const displayCategory = jsonEvent ? jsonEvent.category : event.category;
  const displayDesc = jsonEvent ? jsonEvent.description : event.desc;
  const displayRules = jsonEvent ? jsonEvent.rules : event.rules;
  const displayHeads = jsonEvent ? jsonEvent.heads : event.heads;
  const displayParticipants = jsonEvent ? jsonEvent.participants : event.participants;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col justify-end">
      {/* Click outside to close (invisible backdrop) */}
      <div 
        className="absolute inset-0 pointer-events-auto" 
        onClick={onClose}
      />
      
      {/* Dashboard Bottom Panel */}
      <div className="animate-slide-up relative pointer-events-auto w-full h-[100dvh] md:w-[90%] mx-auto md:h-auto md:min-h-[45vh] md:max-h-[60vh] p-6 pt-12 md:pt-6 md:p-8 bg-[#020813]/95 md:bg-[#020813]/40 border-t border-cyan-400/60 border-x-0 md:border-l md:border-r md:border-cyan-400/30 rounded-none md:rounded-t-[20px] shadow-[0_-5px_30px_rgba(0,243,255,0.15)] backdrop-blur-3xl md:backdrop-blur-2xl flex flex-col md:flex-row gap-6 md:gap-8 font-mono">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-2 md:right-6 text-cyan-400 text-sm font-bold hover:text-white transition-colors z-50 bg-[#020813]/50 md:bg-transparent px-3 py-1 rounded-full md:rounded-none md:px-0 md:py-0"
        >
          [ CLOSE ✕ ]
        </button>

        {/* Left Column */}
        <div className="flex-1 flex flex-col justify-center">
          <header className="text-left">
            <h1 className="text-3xl md:text-[2.5rem] font-bold text-cyan-400 tracking-[2px] drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] mb-2 uppercase">
              <ScrambleText text={displayName} />
            </h1>
            <div className="text-cyan-400/60 uppercase tracking-[1px] text-sm md:text-base font-semibold mb-4">
              {displayCategory}
            </div>
            <div className="text-white/60 text-sm md:text-[0.95rem] leading-[1.6] max-w-[95%] mb-6">
              {displayDesc}
            </div>
            
            {/* Event Heads and Participants */}
            <div className="mt-auto flex flex-col md:flex-row gap-6">
              {displayHeads && displayHeads.length > 0 && (
                <div>
                  <div className="text-[0.75rem] text-cyan-400/80 mb-2 uppercase tracking-[1.5px] font-semibold border-b border-cyan-400/20 inline-block pb-1">
                    EVENT HEADS
                  </div>
                  <div className="flex flex-col gap-1">
                    {displayHeads.map((head, idx) => (
                      <div key={idx} className="text-white/80 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full"></span>
                        {head}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayParticipants && (
                <div>
                  <div className="text-[0.75rem] text-cyan-400/80 mb-2 uppercase tracking-[1.5px] font-semibold border-b border-cyan-400/20 inline-block pb-1">
                    NO. OF PARTICIPANTS
                  </div>
                  <div className="text-white/80 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full"></span>
                    {displayParticipants} {displayParticipants == 1 ? "Member" : "Members"}
                  </div>
                </div>
              )}
            </div>
          </header>
          

        </div>

        {/* Right Column (Rules) */}
        <div className="flex-[2] flex flex-col h-full overflow-hidden">
          <div className="flex-1 bg-cyan-400/[0.03] border border-cyan-400/20 rounded-[20px] p-4 backdrop-blur-sm transition-all hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(0,243,255,0.05)] flex flex-col overflow-hidden">
            <div className="text-[0.85rem] text-cyan-400 mb-2 flex items-center gap-2 uppercase tracking-[1px] font-semibold">
              <svg className="w-5 h-5 stroke-cyan-400" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              EVENT_RULES
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {displayRules && displayRules.length > 0 ? (
                <ul className="text-white/60 text-sm list-disc pl-5 space-y-2">
                  {displayRules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60 text-sm">No rules published yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
      
      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff; border-radius: 4px; }
      `}} />
    </div>
  );
}
