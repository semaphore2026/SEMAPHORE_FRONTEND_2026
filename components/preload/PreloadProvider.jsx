"use client";

// App-level preload gate.
//
// Nothing of the first route is visible or scrollable until its manifest assets are
// downloaded AND every component that registered a gate (e.g. <Scene>, which still has
// to parse 34MB of GLB, compile shaders and render a complete frame) reports ready.
// Then one GSAP timeline hands the page over.
//
// Pre-hydration hiding is done in CSS: app/layout.jsx stamps `preloading` on <html>
// from an inline script, and globals.css hides `.preload-content` while that class is
// present. GSAP's inline opacity outranks that rule, so this component can take over
// the fade without ever removing the scroll lock early. No-JS visitors never get the
// class in the first place, so the page stays readable for them.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Loader from "@/components/Loader";
import RouteProgressBar from "@/components/preload/RouteProgressBar";
import { loadAssets } from "@/components/assetLoader";
import { getRouteAssets, getRouteGates } from "@/constants/preloadManifest";

/** Nothing may hold the page hostage longer than this. */
export const HARD_TIMEOUT_MS = 20000;

/**
 * Grace period before the loader CHROME appears. Under it the overlay is just a solid
 * colour, so a warm cache reveals the page without flashing a progress bar at 100%.
 * Returning visitors in the same session get a much longer grace period — the big
 * loader is a first-impression device, not something to re-watch on every reload.
 */
const CHROME_DELAY_FIRST_MS = 400;
const CHROME_DELAY_RETURNING_MS = 2000;

/** Share of total progress owned by byte transfer when a route also has gates. */
const ASSET_SHARE_WITH_GATES = 0.7;

const SESSION_KEY = "semaphore:preloaded";

const PreloadContext = createContext(null);

export function usePreload() {
  const ctx = useContext(PreloadContext);
  if (!ctx) {
    throw new Error("usePreload must be used inside <PreloadProvider>");
  }
  return ctx;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readSessionFlag() {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false; // private mode
  }
}

function writeSessionFlag() {
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

export default function PreloadProvider({ children }) {
  const pathname = usePathname();

  const [phase, setPhase] = useState("loading"); // loading -> revealing -> ready
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [routeProgress, setRouteProgress] = useState(100);
  // Which route's assets have finished. Derived comparison against the live pathname
  // is what makes the top bar appear on the very render that navigation happens,
  // without an effect writing state synchronously.
  const [completedPath, setCompletedPath] = useState(pathname);

  const overlayRef = useRef(null);
  const loaderContentRef = useRef(null);
  const contentRef = useRef(null);

  const phaseRef = useRef("loading");
  const maxProgressRef = useRef(0);
  const assetPctRef = useRef(0);
  const assetsDoneRef = useRef(false);
  const gatesRef = useRef(new Map());
  const abortRef = useRef(null);
  const timeoutRef = useRef(null);

  // The gate only ever covers the route the app was loaded on. Later navigations are
  // client-side and use the thin top bar instead.
  const gatedPathRef = useRef(pathname);
  const lastPathRef = useRef(pathname);

  const unlockScroll = useCallback(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.remove("preloading");
    if (typeof window !== "undefined" && window.__lenis) {
      try {
        window.__lenis.start();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const reveal = useCallback(() => {
    if (phaseRef.current !== "loading") return;
    phaseRef.current = "revealing";
    setPhase("revealing");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const overlay = overlayRef.current;
    const content = contentRef.current;
    const loaderContent = loaderContentRef.current;
    const reduced = prefersReducedMotion();

    const finishReveal = () => {
      phaseRef.current = "ready";
      setPhase("ready");
      writeSessionFlag();
      // Unlock BEFORE clearing the inline opacity, or the `.preloading` rule would
      // briefly hide the page again between the two operations.
      unlockScroll();
      if (content) gsap.set(content, { clearProps: "opacity" });
      requestAnimationFrame(() => {
        try {
          ScrollTrigger.refresh();
        } catch {
          /* ScrollTrigger may not be registered yet on a bare route */
        }
      });
    };

    if (!overlay && !content) {
      finishReveal();
      return;
    }

    const tl = gsap.timeline({ onComplete: finishReveal });

    if (reduced) {
      // Cross-fade only: no movement, no wipe.
      if (overlay) tl.to(overlay, { opacity: 0, duration: 0.35, ease: "none" }, 0);
      if (content) tl.to(content, { opacity: 1, duration: 0.35, ease: "none" }, 0);
      return;
    }

    if (loaderContent) {
      tl.to(loaderContent, { opacity: 0, y: -25, duration: 0.45, ease: "power3.in" }, 0);
    }
    if (overlay) {
      tl.to(overlay, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, loaderContent ? 0.3 : 0);
    }
    if (content) {
      // Opacity only, deliberately: a GSAP `y` here would write a transform onto the
      // wrapper, and a transformed ancestor becomes the containing block for every
      // position:fixed descendant — which would break Scene's fixed HUD outright.
      tl.to(content, { opacity: 1, duration: 0.6, ease: "power2.out" }, loaderContent ? 0.5 : 0.2);
    }
  }, [unlockScroll]);

  /** Fold byte progress and gate progress into one monotonic number. */
  const recompute = useCallback(() => {
    const gates = Array.from(gatesRef.current.values());
    const assetShare = gates.length ? ASSET_SHARE_WITH_GATES : 1;
    const gateShare = 1 - assetShare;
    const gateAvg = gates.length
      ? gates.reduce((sum, g) => sum + g.value, 0) / gates.length
      : 0;

    const complete = assetsDoneRef.current && gates.every((g) => g.done);
    const raw = ((assetPctRef.current / 100) * assetShare + gateAvg * gateShare) * 100;

    let pct = complete ? 100 : Math.min(raw, 99);
    // Never let the number go backwards, whatever the inputs do.
    if (pct < maxProgressRef.current) pct = maxProgressRef.current;
    maxProgressRef.current = pct;
    setProgress(pct);

    if (complete) reveal();
  }, [reveal]);

  /**
   * Claim a readiness gate. The manifest pre-declares gate ids for the route, so the
   * gate exists before the component mounts and the page can never be revealed in the
   * window between "bytes arrived" and "component registered".
   */
  const register = useCallback(
    (id) => {
      let gate = gatesRef.current.get(id);
      if (!gate) {
        gate = { value: 0, done: false };
        gatesRef.current.set(id, gate);
      } else {
        // Re-registration (a retry re-runs the consumer's effect) resets the gate.
        gate.value = 0;
        gate.done = false;
      }
      recompute();

      return {
        report(value) {
          if (gate.done) return;
          gate.value = clamp01(value);
          recompute();
        },
        done() {
          if (gate.done) return;
          gate.value = 1;
          gate.done = true;
          recompute();
        },
        fail(message) {
          setError(message || "Something failed to load.");
        },
      };
    },
    [recompute]
  );

  const retry = useCallback(() => {
    setError(null);
    maxProgressRef.current = 0;
    setProgress(0);
    setRetryToken((n) => n + 1);
  }, []);

  // Hide the content before first paint and hold the scroll lock the bootstrap script
  // started. Inline opacity is what GSAP will animate; the CSS rule is only the
  // pre-hydration stand-in.
  useIsomorphicLayoutEffect(() => {
    if (contentRef.current && phaseRef.current === "loading") {
      gsap.set(contentRef.current, { opacity: 0 });
    }
  }, []);

  // Lenis is created by <SmoothScroll>, a child, so its effect has already run by the
  // time this one does.
  useEffect(() => {
    if (phaseRef.current === "ready") return;
    const stop = () => {
      if (window.__lenis) {
        try {
          window.__lenis.stop();
        } catch {
          /* ignore */
        }
      }
    };
    stop();
    const id = requestAnimationFrame(stop);
    return () => cancelAnimationFrame(id);
  }, []);

  // --- The gate itself -----------------------------------------------------
  useEffect(() => {
    if (phaseRef.current !== "loading") return;

    const controller = new AbortController();
    abortRef.current = controller;
    let cancelled = false;

    assetPctRef.current = 0;
    assetsDoneRef.current = false;

    // Pre-declare this route's gates so `complete` cannot be true before the
    // components that own them have had a chance to register.
    //
    // Existing gate objects are RESET IN PLACE rather than replaced. A consumer holds
    // its gate handle in a closure, and on a retry its effect re-runs before this one
    // (children commit first) — swapping in fresh objects here would orphan that
    // closure and the page would hang until the hard timeout.
    const nextGates = new Map();
    for (const id of getRouteGates(gatedPathRef.current)) {
      const existing = gatesRef.current.get(id);
      if (existing) {
        existing.value = 0;
        existing.done = false;
        nextGates.set(id, existing);
      } else {
        nextGates.set(id, { value: 0, done: false });
      }
    }
    gatesRef.current = nextGates;

    const assets = getRouteAssets(gatedPathRef.current);

    timeoutRef.current = setTimeout(() => {
      if (cancelled || phaseRef.current !== "loading") return;
      console.warn(
        `[preload] gate timed out after ${HARD_TIMEOUT_MS}ms at ${Math.round(
          maxProgressRef.current
        )}% — revealing anyway.`
      );
      assetsDoneRef.current = true;
      for (const gate of gatesRef.current.values()) gate.done = true;
      recompute();
    }, HARD_TIMEOUT_MS);

    (async () => {
      const { failures } = await loadAssets(
        assets,
        (pct) => {
          if (cancelled) return;
          assetPctRef.current = pct;
          recompute();
        },
        controller.signal
      );

      if (cancelled) return;

      if (failures.length > 0) {
        failures.forEach((f) =>
          console.error("[preload] failed:", f.asset.url || f.asset.key, f.error)
        );
        // Only a `critical` asset is worth blocking on. A missing page background
        // should not stop someone from filling in a registration form.
        const fatal = failures.find((f) => f.asset.critical);
        if (fatal) {
          setError("Some assets could not be loaded.");
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return;
        }
      }

      assetPctRef.current = 100;
      assetsDoneRef.current = true;
      recompute();
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [recompute, retryToken]);

  // Reveal the loader chrome only if loading actually takes long enough to need it.
  useEffect(() => {
    if (phase !== "loading") return undefined;
    const delay = readSessionFlag() ? CHROME_DELAY_RETURNING_MS : CHROME_DELAY_FIRST_MS;
    const id = setTimeout(() => setChromeVisible(true), delay);
    return () => clearTimeout(id);
  }, [phase, retryToken]);

  // --- Client-side navigation: thin top bar, never the full-screen loader ---
  useEffect(() => {
    if (phase !== "ready") return undefined;
    if (pathname === lastPathRef.current) return undefined;
    lastPathRef.current = pathname;

    const controller = new AbortController();
    let cancelled = false;

    loadAssets(
      getRouteAssets(pathname),
      (pct) => {
        if (!cancelled) setRouteProgress(pct);
      },
      controller.signal
    )
      .catch(() => {
        /* a route asset failing must not break navigation */
      })
      .finally(() => {
        if (!cancelled) {
          setRouteProgress(100);
          setCompletedPath(pathname);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pathname, phase]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isReady = phase === "ready";
  const isLoading = phase === "loading";
  // An error always deserves its chrome, however fast the failure came back.
  const chromeShown = chromeVisible || Boolean(error);
  const routeBusy = isReady && completedPath !== pathname;

  const value = useMemo(
    () => ({ progress, isLoading, isReady, error, retry, retryToken, register }),
    [progress, isLoading, isReady, error, retry, retryToken, register]
  );

  return (
    <PreloadContext.Provider value={value}>
      {!isReady && (
        <div
          ref={overlayRef}
          role="status"
          aria-live="polite"
          aria-busy={isLoading}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0908]"
        >
          {chromeShown && (
            <Loader
              contentRef={loaderContentRef}
              progress={progress}
              error={error}
              onRetry={retry}
            />
          )}
        </div>
      )}

      <RouteProgressBar active={routeBusy} progress={routeProgress} />

      <div
        ref={contentRef}
        className="preload-content flex flex-1 flex-col"
        aria-hidden={!isReady}
      >
        {children}
      </div>
    </PreloadContext.Provider>
  );
}
