import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#244b58] flex flex-col items-center justify-center font-sans">

      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#112a36] via-[#1a3845] to-[#0a1b24]">
        <Image
          src="/turtle_bg.jpg"
          alt="Deep sea texture"
          fill
          className="object-cover opacity-90 mix-blend-multiply"
          priority
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <h1
          className="text-[25vw] md:text-[18vw] font-black text-white leading-none tracking-widest drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
        >
          404
        </h1>
      </div>
      <div className="absolute inset-0  flex items-center justify-center z-20  pointer-events-none">
        <div className="animate-swim">
          <img
            src="/notfound1.png"
            alt="Sea turtle swimming"
            className="w-[60vw] md:w-[30vw] max-w-3xl object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)] transform -rotate-6 translate-x-4 -translate-y-4"
          />
        </div>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
        style={{ clipPath: "polygon(55% 0, 100% 0, 100% 100%, 55% 100%)" }}
      >
        <h1
          className="text-[25vw] md:text-[18vw] font-black text-white leading-none tracking-widest drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
        >
          404
        </h1>
      </div>

      {/* Text and Links at the bottom */}
      <div className="absolute bottom-16 md:bottom-24 z-40 text-center w-full px-4">
        <p className="text-sm md:text-xl font-semibold text-white tracking-wide">
          You're in deep water. Go <Link href="/" className="underline decoration-2 underline-offset-8 hover:text-cyan-300 transition-colors">home</Link> or call for <Link href="mailto:semaphore2k26@gmail.com" className="underline decoration-2 underline-offset-8 hover:text-cyan-300 transition-colors">help</Link>.
        </p>
      </div>

    </div>
  );
}
