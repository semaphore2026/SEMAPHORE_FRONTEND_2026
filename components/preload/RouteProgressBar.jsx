"use client";

// Feedback for client-side navigations, which must never replay the full-screen
// loader. Content stays on screen; this thin bar is the only thing that says
// "still fetching".
//
// It is always mounted (2px tall, transparent, pointer-events-none) and driven
// entirely by GSAP, so there is no mount/unmount state to churn and nothing to
// re-render on every progress tick.

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function RouteProgressBar({ active, progress }) {
  const wrapRef = useRef(null);
  const barRef = useRef(null);
  const wasActive = useRef(false);

  // Track transfer progress while a navigation is in flight.
  useEffect(() => {
    if (!active || !barRef.current) return undefined;
    const tween = gsap.to(barRef.current, {
      width: `${Math.max(progress, 8)}%`,
      duration: 0.3,
      ease: "power2.out",
    });
    return () => tween.kill();
  }, [active, progress]);

  // Show on the way in, run to full and fade on the way out. Depends on `active`
  // only, so a late progress update cannot kill the exit mid-animation.
  useEffect(() => {
    const wrap = wrapRef.current;
    const bar = barRef.current;
    if (!wrap || !bar) return undefined;

    if (active) {
      wasActive.current = true;
      gsap.set(wrap, { opacity: 1 });
      gsap.set(bar, { width: "8%" });
      return undefined;
    }

    if (!wasActive.current) return undefined; // never started; nothing to hide
    wasActive.current = false;

    const tl = gsap.timeline();
    tl.to(bar, { width: "100%", duration: 0.2, ease: "power2.out" })
      .to(wrap, { opacity: 0, duration: 0.3, ease: "power2.inOut" }, "+=0.05");
    return () => tl.kill();
  }, [active]);

  return (
    <div
      ref={wrapRef}
      role="status"
      aria-live="polite"
      aria-busy={active}
      className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-[2px] bg-[#2f2c28]/40"
      style={{ opacity: 0 }}
    >
      <span className="sr-only">{active ? "Loading page assets" : ""}</span>
      <div
        ref={barRef}
        className="h-full bg-[#eae5de] shadow-[0_0_8px_rgba(234,229,222,0.6)]"
        style={{ width: "0%" }}
      />
    </div>
  );
}
