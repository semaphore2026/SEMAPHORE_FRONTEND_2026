"use client";

// Centralized asset loading for the Aquasaga ocean scene and the site-wide preload gate.
//
// Why this exists: THREE.LoadingManager reports progress as itemsLoaded/itemsTotal,
// which counts FILES, not bytes. With five critical assets that produced a counter
// that jumped 20% -> 40% -> 60%, and treated a 75KB model as equal work to a 541KB
// texture. This module tracks real transferred bytes instead, so the percentage the
// user sees corresponds to actual download progress.
//
// It also gives us one place to do application-level caching (Cache API), so a repeat
// visit reuses stored bytes instead of re-downloading megabytes of models/textures.
//
// Supported `kind` values:
//   "buffer"  - binary payload (GLB) handed back as a Blob
//   "texture" - image bytes the caller decodes into a THREE texture
//   "image"   - a DOM image the page will render; decoded here so first paint has no jank
//   "fonts"   - pseudo-asset: resolves when document.fonts is ready (one weighted unit)

const CACHE_NAME = "aquasaga-assets-v1";

// Bump when an asset's CONTENTS change, so stale cached bytes are dropped.
// (Static-export filenames under /public are not content-hashed by Next.)
export const ASSET_VERSION = "v1";

/**
 * Assets required before the first frame can be rendered correctly.
 * `bytes` is only a seed estimate for the progress total; the real
 * Content-Length replaces it as soon as response headers arrive.
 *
 * `critical: true` means the preload gate must surface an error if it fails,
 * rather than revealing a visibly broken page.
 */
export const CRITICAL_ASSETS = [
  { key: "waterNormals", url: "/textures/waternormals.jpg", kind: "texture", bytes: 249000, critical: true },
  { key: "dolphin", url: "/assets/models/dolphin_anim.glb", kind: "buffer", bytes: 146000 },
  { key: "fishSchool", url: "/assets/models/source/school%20of%20fish_opt.glb", kind: "buffer", bytes: 34440000 },
];

/** Heavy, non-first-frame assets streamed in after the scene is already interactive. */
export const SECONDARY_ASSETS = [
  { key: "hdri", url: "/hdri/spiaggia_di_mondello_1k.hdr", kind: "buffer", bytes: 1533242 },
];

// ---------------------------------------------------------------------------
// Cross-consumer deduplication
//
// The preload gate and <Scene> both ask for CRITICAL_ASSETS. `assetStore` stops a
// second sequential download; `inflight` stops a second CONCURRENT one (the gate
// starts fetching on mount, Scene starts a few milliseconds later). Without the
// in-flight map the 34MB fish model would be pulled twice on every cold visit.
// ---------------------------------------------------------------------------
const assetStore = new Map(); // key -> Blob
const inflight = new Map(); // url -> Promise<Blob>

/** Bytes already fetched this session, for consumers that want them without re-running loadAssets. */
export function getAsset(key) {
  return assetStore.get(key) || null;
}

/**
 * Drop payloads once a consumer no longer needs the raw bytes. The 34MB fish GLB is
 * pure waste in memory after its meshes exist on the GPU; a retry re-reads it from
 * the Cache API (disk), not the network.
 */
export function releaseAssets(keys) {
  for (const key of keys) assetStore.delete(key);
}

export function clearAssetStore() {
  assetStore.clear();
}

async function openCache() {
  try {
    if (typeof caches === "undefined") return null;
    return await caches.open(CACHE_NAME);
  } catch {
    return null; // private mode / unsupported — fall through to plain fetch
  }
}

/**
 * Fetch one asset over the network, reporting bytes as they stream in.
 *
 * `useCache` is off for DOM images on purpose: the Cache API entry is keyed by
 * url + ASSET_VERSION, which is NOT the URL an img/background-image later
 * requests, so storing it there would guarantee a second download. A plain fetch
 * of the real URL warms the HTTP cache that the render path actually uses.
 */
async function fetchOverNetwork(asset, onBytes, signal, useCache) {
  const cacheKey = asset.url + "?" + ASSET_VERSION;
  const cache = useCache ? await openCache() : null;

  // --- Repeat visit: serve straight from the cache ---
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const blob = await hit.blob();
        onBytes(blob.size, blob.size, true);
        return blob;
      }
    } catch {
      /* fall through to network */
    }
  }

  const res = await fetch(asset.url, { signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${asset.url}`);

  const declared = Number(res.headers.get("content-length")) || 0;

  // Stream so we can count real bytes. If the body isn't readable
  // (some proxies), fall back to a single blob read.
  if (!res.body || !res.body.getReader) {
    const blob = await res.blob();
    onBytes(blob.size, blob.size, false);
    if (cache) { try { await cache.put(cacheKey, new Response(blob)); } catch {} }
    return blob;
  }

  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onBytes(received, declared || 0, false);
  }

  const blob = new Blob(chunks);
  onBytes(blob.size, blob.size, false);
  if (cache) { try { await cache.put(cacheKey, new Response(blob)); } catch {} }
  return blob;
}

/** Fetch one asset, deduplicated across every consumer in the app. Resolves to a Blob. */
async function fetchAsset(asset, onBytes, signal) {
  const held = assetStore.get(asset.key);
  if (held) {
    onBytes(held.size, held.size, true);
    return held;
  }

  // Someone else is already downloading these exact bytes — ride along.
  // (A rider gets no incremental ticks, only the final size, because the stream is
  // being consumed by the first caller. The first caller is the one driving the
  // visible progress bar, so this is invisible in practice.)
  const pending = inflight.get(asset.url);
  if (pending) {
    try {
      const blob = await pending;
      onBytes(blob.size, blob.size, true);
      return blob;
    } catch (err) {
      // The initiator gave up — typically it unmounted and aborted its controller.
      // If OUR caller was not the one cancelled, fetch the bytes ourselves instead of
      // inheriting somebody else's abort.
      if (signal && signal.aborted) throw err;
    }
  }

  const useCache = asset.kind !== "image";
  const promise = fetchOverNetwork(asset, onBytes, signal, useCache);
  inflight.set(asset.url, promise);

  try {
    const blob = await promise;
    assetStore.set(asset.key, blob);
    return blob;
  } finally {
    inflight.delete(asset.url);
  }
}

/**
 * Decode a DOM image so the browser has pixels ready before the page is revealed.
 * Decodes the real URL (not a blob: URL) so the decoded frame is the one the page's
 * own img/background-image will hit.
 */
async function decodeImage(url, blob) {
  if (typeof Image === "undefined") return;
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    if (typeof img.decode === "function") {
      await img.decode();
      return;
    }
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  } catch {
    // Decoding must never block the gate. Fall back to decoding the bytes we already
    // hold; if even that fails the browser simply decodes at paint time as before.
    if (blob && typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(blob);
        if (bitmap.close) bitmap.close();
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Resolve once webfonts are ready, so text does not reflow after the reveal.
 * globals.css pulls Orbitron + Share Tech Mono from Google Fonts and layout.jsx
 * loads Geist via next/font; document.fonts.ready covers both.
 */
export async function awaitFonts(timeoutMs = 8000) {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    /* a font that never arrives must not hold the page hostage */
  }
}

/** Fetch (or await) a single manifest entry, whatever kind it is. */
async function loadUnit(asset, onBytes, signal) {
  const weight = asset.bytes || 1;

  if (asset.kind === "fonts") {
    onBytes(0, weight, false);
    await awaitFonts();
    onBytes(weight, weight, false);
    return null;
  }

  const blob = await fetchAsset(asset, onBytes, signal);
  if (asset.kind === "image") await decodeImage(asset.url, blob);
  return blob;
}

/**
 * Load a list of assets in parallel with true byte-level aggregate progress.
 *
 * onProgress(percent, info) fires as bytes arrive. `percent` is capped just under
 * 100 until every asset has actually resolved, so the bar can never sit at 100%
 * while work remains.
 */
export async function loadAssets(assets, onProgress, signal) {
  const state = assets.map((a) => ({
    asset: a,
    loaded: 0,
    total: a.bytes || 0, // seed; replaced by Content-Length
    done: false,
    fromCache: false,
  }));

  const report = () => {
    let loaded = 0;
    let total = 0;
    for (const s of state) {
      loaded += s.loaded;
      total += Math.max(s.total, s.loaded);
    }
    const allDone = state.every((s) => s.done);
    const raw = total > 0 ? (loaded / total) * 100 : 0;
    // Hold just below 100 until everything has genuinely resolved.
    const pct = allDone ? 100 : Math.min(raw, 99);
    onProgress(pct, {
      loadedBytes: loaded,
      totalBytes: total,
      doneCount: state.filter((s) => s.done).length,
      totalCount: state.length,
    });
  };

  report();

  const results = {};
  const failures = [];

  await Promise.all(
    state.map(async (s) => {
      try {
        const blob = await loadUnit(
          s.asset,
          (loaded, total, fromCache) => {
            s.loaded = loaded;
            if (total) s.total = Math.max(total, loaded);
            s.fromCache = fromCache;
            report();
          },
          signal
        );
        if (blob) results[s.asset.key] = blob;
      } catch (err) {
        failures.push({ asset: s.asset, error: err });
        // Treat a failed asset as "settled" so the bar cannot hang forever.
        s.total = s.loaded;
      } finally {
        s.done = true;
        report();
      }
    })
  );

  return { results, failures };
}

/** Decode an image blob into a THREE texture without a second network request. */
export async function blobToTexture(THREE, blob, { srgb = true, anisotropy = 1 } = {}) {
  let texture;

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    texture = new THREE.Texture(bitmap);
  } else {
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      texture = new THREE.Texture(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (srgb && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

/** Clear cached asset bytes (useful when ASSET_VERSION changes). */
export async function clearAssetCache() {
  clearAssetStore();
  try {
    if (typeof caches !== "undefined") await caches.delete(CACHE_NAME);
  } catch {
    /* ignore */
  }
}
