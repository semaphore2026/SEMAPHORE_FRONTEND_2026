/**
 * Centralized Scroll Coordinates & Camera Keyframe Definitions for Semaphore 2K26
 */

// Timeline Snap Points (0% to 100%)
export const SNAP_POINTS = [0, 0.05, 0.15, 0.35, 0.48, 0.60, 0.72, 0.84, 1.0];

// Initial Starting Camera Position
export const INITIAL_CAMERA_STATE = {
  x: 0,
  y: 0,
  z: 15,
  targetX: 0,
  targetY: 0,
  targetZ: -10,
  rx: 0,
  ry: 0,
  fov: 60,
  fogDensity: 0.008,
};

// Main Scroll Timeline Phases
export const SCROLL_TIMELINE_PHASES = {
  surfaceView: {
    startPercent: 0,
    endPercent: 15,
    camState: {
      x: 0,
      y: -40,
      z: -35,
      targetX: 0,
      targetY: -40,
      targetZ: -85,
      rx: -0.08,
      ry: 0,
      fogDensity: 0.012,
    },
  },
  caveEntrance: {
    startPercent: 15,
    endPercent: 35,
    camState: {
      x: 0,
      y: -80,
      z: -110,
      targetX: 0,
      targetY: -80,
      targetZ: -160,
      rx: 0,
      ry: 0,
      fogDensity: 0.015,
    },
  },
  portalThreshold: {
    startPercent: 35,
    endPercent: 46,
    camState: {
      x: 0,
      y: -110,
      z: -200,
      targetX: 0,
      targetY: -110,
      targetZ: -260,
      rx: 0,
      ry: 0,
      fogDensity: 0.015,
    },
  },
  openWaterExit: {
    startPercent: 46,
    endPercent: 50,
    camState: {
      x: 0,
      y: -110,
      z: -250,
      targetX: 0,
      targetY: -110,
      targetZ: -300,
      fogDensity: 0.015,
    },
  },
};

// Event Node Platforms & 3D Coordinates (Z-Depth -300m to -1200m)
export const EVENT_PLATFORM_COORDINATES = [
  {
    id: "event-1",
    name: "Coding",
    label: "01 CODING",
    depthMeters: 104,
    platform: { x: -42, y: -110, z: -300 },
    cameraApproach: { x: -18, y: -118, z: -265, targetX: -22, targetY: -106, targetZ: -318, fov: 64 },
    cameraHero: { x: -30, y: -99, z: -282, targetX: -22, targetY: -104, targetZ: -318, fov: 54 },
    cameraOrbitRight: { x: 38, y: -88, z: -307, targetX: -22, targetY: -104, targetZ: -318, fov: 49 },
  },
  {
    id: "event-2",
    name: "Web Design",
    label: "02 WEB DESIGN",
    depthMeters: 144,
    platform: { x: 42, y: -150, z: -400 },
    cameraApproach: { x: 18, y: -158, z: -365, targetX: 22, targetY: -146, targetZ: -418, fov: 64 },
    cameraHero: { x: 30, y: -139, z: -382, targetX: 22, targetY: -144, targetZ: -418, fov: 54 },
  },
  {
    id: "event-3",
    name: "IT Quiz",
    label: "03 IT QUIZ",
    depthMeters: 184,
    platform: { x: -42, y: -190, z: -500 },
    cameraApproach: { x: -18, y: -198, z: -465, targetX: -22, targetY: -186, targetZ: -518, fov: 64 },
    cameraHero: { x: -30, y: -179, z: -482, targetX: -22, targetY: -184, targetZ: -518, fov: 54 },
  },
  {
    id: "event-4",
    name: "Gaming",
    label: "04 GAMING",
    depthMeters: 224,
    platform: { x: 42, y: -230, z: -600 },
    cameraApproach: { x: 18, y: -238, z: -565, targetX: 22, targetY: -226, targetZ: -618, fov: 64 },
    cameraHero: { x: 30, y: -219, z: -582, targetX: 22, targetY: -224, targetZ: -618, fov: 54 },
  },
  {
    id: "event-5",
    name: "Tech Talk",
    label: "05 TECH TALK",
    depthMeters: 264,
    platform: { x: -42, y: -270, z: -700 },
    cameraApproach: { x: -18, y: -278, z: -665, targetX: -22, targetY: -266, targetZ: -718, fov: 64 },
    cameraHero: { x: -30, y: -259, z: -682, targetX: -22, targetY: -264, targetZ: -718, fov: 54 },
  },
  {
    id: "event-6",
    name: "Surprise Event",
    label: "06 SURPRISE",
    depthMeters: 304,
    platform: { x: 42, y: -310, z: -800 },
    cameraApproach: { x: 18, y: -318, z: -765, targetX: 22, targetY: -306, targetZ: -818, fov: 64 },
    cameraHero: { x: 30, y: -299, z: -782, targetX: 22, targetY: -304, targetZ: -818, fov: 54 },
  },
  {
    id: "event-7",
    name: "IT Manager",
    label: "07 IT MANAGER",
    depthMeters: 344,
    platform: { x: -42, y: -350, z: -900 },
    cameraApproach: { x: -18, y: -358, z: -865, targetX: -22, targetY: -346, targetZ: -918, fov: 64 },
    cameraHero: { x: -30, y: -339, z: -882, targetX: -22, targetY: -344, targetZ: -918, fov: 54 },
  },
  {
    id: "event-8",
    name: "Startup Pitch",
    label: "08 STARTUP",
    depthMeters: 384,
    platform: { x: 42, y: -390, z: -1000 },
    cameraApproach: { x: 18, y: -398, z: -965, targetX: 22, targetY: -386, targetZ: -1018, fov: 64 },
    cameraHero: { x: 30, y: -379, z: -982, targetX: 22, targetY: -384, targetZ: -1018, fov: 54 },
  },
  {
    id: "event-9",
    name: "Dance",
    label: "09 DANCE",
    depthMeters: 424,
    platform: { x: -42, y: -430, z: -1100 },
    cameraApproach: { x: -18, y: -438, z: -1065, targetX: -22, targetY: -426, targetZ: -1118, fov: 64 },
    cameraHero: { x: -30, y: -419, z: -1082, targetX: -22, targetY: -424, targetZ: -1118, fov: 54 },
  },
  {
    id: "event-10",
    name: "Photography",
    label: "10 PHOTOGRAPHY",
    depthMeters: 464,
    platform: { x: 0, y: -470, z: -1200 },
    cameraApproach: { x: 0, y: -478, z: -1165, targetX: 0, targetY: -466, targetZ: -1218, fov: 64 },
    cameraHero: { x: 0, y: -459, z: -1182, targetX: 0, targetY: -464, targetZ: -1218, fov: 54 },
  },
];

/**
 * Utility to get event coordinates by event ID
 */
export function getEventCoordinates(eventId) {
  return EVENT_PLATFORM_COORDINATES.find((item) => item.id === eventId) || null;
}
