// What each route needs in hand BEFORE the preload gate reveals the page.
//
// Every url here was verified to exist under /public and to be referenced by the
// route that claims it. Do not add speculative entries: a manifest URL that 404s
// costs a round trip and shows up as a load failure.
//
// `bytes` is a seed for the progress total only — the real Content-Length replaces
// it the moment response headers arrive (see components/assetLoader.js).

import { CRITICAL_ASSETS } from "@/components/assetLoader";

/** Applied on every route, merged ahead of the route's own list. */
export const GLOBAL_ASSETS = [
  // Orbitron + Share Tech Mono (globals.css) and Geist (next/font). Folded into
  // progress as one weighted unit so text never reflows after the reveal.
  { key: "fonts", kind: "fonts", bytes: 120000 },
];

const ROUTE_ASSETS = {
  // The 3D ocean. `gates` means the route is not "ready" when its bytes land — it is
  // ready when <Scene> has parsed, uploaded and rendered a complete frame.
  "/": {
    assets: CRITICAL_ASSETS,
    gates: ["scene"],
  },

  "/contact": {
    assets: [
      { key: "contactBg", url: "/techy_underwater_bg.png", kind: "image", bytes: 1031718 },
    ],
  },

  "/developer": {
    assets: [
      { key: "developerBg", url: "/techy_underwater_bg.png", kind: "image", bytes: 1031718 },
    ],
  },

  "/events/register": {
    assets: [
      { key: "eventsRegisterBg", url: "/profile_bg.jpg", kind: "image", bytes: 670049 },
    ],
  },

  "/user/register": {
    assets: [
      { key: "userRegisterBg", url: "/login_bg.png", kind: "image", bytes: 969496 },
    ],
  },

  "/user/account": {
    assets: [
      { key: "accountBg", url: "/profile_bg.jpg", kind: "image", bytes: 670049 },
    ],
  },

  // Its own entry, so longest-prefix match does NOT hand it /user/account's
  // background — the payment screen uses the water ripple texture instead.
  "/user/account/payment": {
    assets: [
      { key: "paymentQr", url: "/QR_code.png", kind: "image", bytes: 163129 },
      { key: "paymentWater", url: "/water.jpg", kind: "image", bytes: 25177 },
    ],
  },

  // "/info" renders from data/events.json with no image assets — fonts only.
};

const EMPTY = { assets: [], gates: [] };

function normalize(pathname) {
  if (!pathname) return "/";
  // Trailing slashes matter for prefix matching; static export can serve either form.
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return trimmed || "/";
}

/**
 * Longest-prefix route match, so a nested route inherits its parent's assets unless
 * it declares its own.
 *
 * "/" is deliberately matched EXACTLY and never as a prefix — otherwise every route
 * in the app would inherit the home page's 34MB fish model.
 */
function matchRoute(pathname) {
  const path = normalize(pathname);
  let best = null;
  let bestLength = -1;

  for (const route of Object.keys(ROUTE_ASSETS)) {
    const matches =
      route === "/" ? path === "/" : path === route || path.startsWith(route + "/");
    if (matches && route.length > bestLength) {
      best = ROUTE_ASSETS[route];
      bestLength = route.length;
    }
  }

  return best || EMPTY;
}

/** Everything that must be in hand before `pathname` is revealed. Deduped by key. */
export function getRouteAssets(pathname) {
  const entry = matchRoute(pathname);
  const merged = [];
  const seen = new Set();

  for (const asset of [...GLOBAL_ASSETS, ...(entry.assets || [])]) {
    if (seen.has(asset.key)) continue;
    seen.add(asset.key);
    merged.push(asset);
  }

  return merged;
}

/**
 * Ids of components that must signal readiness before `pathname` is revealed.
 *
 * Declared up front rather than discovered at mount, so the gate cannot finish
 * downloading and reveal the page in the window before the component registers.
 */
export function getRouteGates(pathname) {
  return matchRoute(pathname).gates || [];
}
