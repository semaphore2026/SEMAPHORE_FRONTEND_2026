import React from "react";

const DeveloperCard = ({ dev, imageErrorMap, handleImageError, hideAllContacts, hideSocials }) => (
  <div key={dev.id} className="relative group w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(25%-1.125rem)] min-w-[260px] max-w-[350px] flex-shrink-0 [perspective:1000px]">

    {/* 3D Glass Card */}
    <div
      className={`relative flex flex-col items-center px-4 py-5 sm:px-5 sm:py-6 bg-white/5 border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_0_32px_rgba(255,255,255,0.02)] backdrop-blur-xl rounded-3xl transition-all duration-500 group-hover:[transform:rotateX(4deg)_rotateY(-4deg)_translateY(-8px)] group-hover:shadow-[20px_20px_40px_rgba(0,0,0,0.5),inset_0_0_32px_rgba(255,255,255,0.05)] group-hover:border-cyan-300/30 group-hover:bg-white/10 w-full ${hideAllContacts ? "min-h-[220px] sm:min-h-[240px] justify-center" : "min-h-[320px] sm:min-h-[340px] justify-between"} [transform-style:preserve-3d]`}
    >
      {/* Inner Glass Highlights & Refractions */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/50 rounded-3xl pointer-events-none" />
      <div className="absolute -top-16 -left-16 w-32 h-32 bg-cyan-400/20 rounded-full blur-[40px] group-hover:bg-cyan-400/40 transition-colors duration-500 pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-blue-600/20 rounded-full blur-[40px] group-hover:bg-blue-500/40 transition-colors duration-500 pointer-events-none" />

      <div className="flex flex-col items-center w-full space-y-3 pt-2 relative z-10 [transform:translateZ(30px)] transition-transform duration-500">

        {/* Profile Avatar Frame - Floating Orb effect */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-white/5 border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(0,219,233,0.4)] group-hover:border-cyan-300/60 shrink-0">
          {!imageErrorMap[dev.id] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dev.image}
              alt={dev.name}
              onError={() => handleImageError(dev.id)}
              className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-900/50 to-slate-900/50 flex items-center justify-center text-cyan-300 font-mono font-bold text-2xl shadow-inner">
              {dev.initials}
            </div>
          )}
        </div>

        {/* Member Name */}
        <h3 className="font-bold text-lg sm:text-xl text-white text-center tracking-wide group-hover:text-cyan-300 transition-colors pt-2 drop-shadow-md">
          {dev.name}
        </h3>

        {/* Role Badge - Glass Pill */}
        <span className="font-mono text-[10px] sm:text-xs text-cyan-200 font-semibold tracking-widest uppercase bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
          {dev.role}
        </span>
      </div>

      {/* Contact Action Icons */}
      {!hideAllContacts && (
        <div className="flex items-center justify-center space-x-3 mt-6 w-full relative z-10 [transform:translateZ(20px)] transition-transform duration-500">

          {/* Phone / Call */}
          <a
            href={dev.phone}
            title="Call"
            className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-cyan-400 hover:border-cyan-300 hover:text-slate-950 text-cyan-100 backdrop-blur-md transition-all duration-300 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(0,219,233,0.5)] hover:-translate-y-1 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>

          {/* Email */}
          <a
            href={dev.email}
            title="Email"
            className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-cyan-400 hover:border-cyan-300 hover:text-slate-950 text-cyan-100 backdrop-blur-md transition-all duration-300 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(0,219,233,0.5)] hover:-translate-y-1 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>

          {/* GitHub */}
          {!hideSocials && (
            <a
              href={dev.github}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-cyan-400 hover:border-cyan-300 hover:text-slate-950 text-cyan-100 backdrop-blur-md transition-all duration-300 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(0,219,233,0.5)] hover:-translate-y-1 focus:outline-none"
            >
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          )}

          {/* LinkedIn */}
          {!hideSocials && (
            <a
              href={dev.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-cyan-400 hover:border-cyan-300 hover:text-slate-950 text-cyan-100 backdrop-blur-md transition-all duration-300 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(0,219,233,0.5)] hover:-translate-y-1 focus:outline-none"
            >
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  </div>
);

export default DeveloperCard;
