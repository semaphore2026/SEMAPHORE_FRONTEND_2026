"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  SNAP_POINTS,
  INITIAL_CAMERA_STATE,
  SCROLL_TIMELINE_PHASES,
  EVENT_PLATFORM_COORDINATES,
  getEventCoordinates,
} from "@/constants/scrollCoordinates";

export {
  SNAP_POINTS,
  INITIAL_CAMERA_STATE,
  SCROLL_TIMELINE_PHASES,
  EVENT_PLATFORM_COORDINATES,
  getEventCoordinates,
};

gsap.registerPlugin(ScrollTrigger);

/**
 * Optimized Custom Hook for GSAP ScrollTrigger configuration,
 * high-performance scroll progress tracking, and lag-free response.
 */
export function useSceneScroll({ isMobile = false } = {}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const lastProgressRef = useRef(-1);

  /**
   * Initializes the GSAP Timeline attached to ScrollTrigger
   */
  const createScrollTimeline = (wrapperElement, onProgressCallback) => {
    if (!wrapperElement) return null;

    // Ensure any stale ScrollTriggers are killed before creating a new one
    ScrollTrigger.getAll().forEach((t) => t.kill());

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapperElement,
        start: "top top",
        end: "bottom bottom",
        // Responsive scrub for instant, fluid scroll tracking without input latency
        scrub: isMobile ? 1.2 : 0.75,
        onUpdate: (self) => {
          const currentProgress = Math.floor(self.progress * 100);

          // Throttled React state update: only trigger re-render when integer percentage changes
          if (currentProgress !== lastProgressRef.current) {
            lastProgressRef.current = currentProgress;
            setScrollProgress(currentProgress);
            if (onProgressCallback) onProgressCallback(currentProgress);
          }
        },
      },
    });

    return tl;
  };

  /**
   * Cleans up all active ScrollTrigger instances
   */
  const cleanupScroll = () => {
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };

  return {
    scrollProgress,
    setScrollProgress,
    createScrollTimeline,
    cleanupScroll,
  };
}

export default useSceneScroll;
