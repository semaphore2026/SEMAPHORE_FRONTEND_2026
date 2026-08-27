"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePreload } from "@/components/preload/PreloadProvider";
import EventInfoModal from "./EventInfoModal";
import { Info } from "lucide-react";
import { CRITICAL_ASSETS, loadAssets, blobToTexture, releaseAssets } from "./assetLoader";
import { FishSchoolSimulation } from "./fish/fish-school-simulation";
import { createClownfishSchool } from "./fish/clownfish-school";
import { loadFishModel } from "./fish/model-loader";
import {
  createFishMeshByKey,
  setFishMeshCount,
  updateFishInstances
} from "./fish/instanced-school-renderer";
import { aquariumHalfSize, simulationSettings, fishConfig } from "./fish/config";
import { addCoralReef } from "./CoralReef";
import {
  seabedVertex,
  seabedFragment,
  flowFieldVertex,
  flowFieldFragment,
  wormholeVertex,
  wormholeFragment,
  bubbleVertex,
  bubbleFragment,
  portalVortexVertex,
  portalVortexFragment,
  waterCausticsVertex,
  waterCausticsFragment,
  waveSeabedVertex,
  waveSeabedFragment,
  floatingParticleVertex,
  floatingParticleFragment,
} from "../src/Shaders/index";

const dolphinVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  #include <skinning_pars_vertex>

  void main() {
    #include <skinbase_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    #include <project_vertex>

    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
    vNormal = modelNormal.xyz;
    vPosition = modelPosition.xyz;
  }
`;

const dolphinFragmentShader = `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform float uVelocity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) {
      normal *= -1.0;
    }

    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.5);

    vec3 deepBlue = vec3(0.008, 0.045, 0.10);
    vec3 glowColor = uBaseColor * (1.35 + uVelocity * 1.5);
    vec3 color = mix(deepBlue, glowColor, 0.18 + fresnel * 0.82);
    gl_FragColor = vec4(color, 0.28 + fresnel * 0.72);
  }
`;

const dolphinSparkleVertexShader = `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uVelocity;

  attribute float aRandom;
  attribute float aSize;

  varying float vRandom;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    float sizeVariation = aSize * (0.5 + 0.5 * sin(uTime * 2.0 + aRandom * 6.28));
    sizeVariation *= (1.0 + uVelocity * 0.45);
    
    gl_PointSize = uSize * sizeVariation * uPixelRatio;
    gl_PointSize *= (2.0 / -viewPosition.z);
    gl_PointSize = max(gl_PointSize, 2.0);

    vRandom = aRandom;
  }
`;

const dolphinSparkleFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uVelocity;

  varying float vRandom;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));

    float strength = 0.05 / distanceToCenter - 0.1;
    strength = clamp(strength, 0.0, 1.0);

    float colorMix = sin(vRandom * 6.28 + uTime) * 0.5 + 0.5;
    vec3 color = mix(uColor1, uColor2, colorMix);

    float twinkle = sin(uTime * 3.0 + vRandom * 20.0) * 0.3 + 0.7;
    twinkle *= (1.0 + uVelocity * 0.5);

    gl_FragColor = vec4(color, strength * twinkle * (0.6 + uVelocity * 0.8));
  }
`;

const shimmerVertex = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  uniform float uTime;
  varying float vTwinkle;
  varying float vSurfaceFade;

  void main() {
    vec3 pos = position;

    // Gentle upward drift + slow horizontal sway
    pos.y += mod(uTime * aSpeed * 0.6 + aPhase * 10.0, 60.0);
    pos.x += sin(uTime * 0.3 + aPhase * 6.28) * 1.2;
    pos.z += cos(uTime * 0.25 + aPhase * 6.28) * 1.2;

    // Smoothly fade out as particles approach ocean surface from below
    vSurfaceFade = smoothstep(-5.0, -22.0, pos.y);

    // Twinkle intensity: fast sparkle flicker layered on a slow shimmer wave
    float sparkle = sin(uTime * (3.0 + aPhase * 4.0) + aPhase * 50.0) * 0.5 + 0.5;
    float shimmer = sin(uTime * 0.8 + aPhase * 12.0) * 0.5 + 0.5;
    vTwinkle = pow(sparkle, 3.0) * 0.7 + shimmer * 0.3;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z) * (0.4 + vTwinkle * 1.1) * vSurfaceFade;
    gl_PointSize = max(gl_PointSize, 0.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const shimmerFragment = `
  uniform vec3 uColor;
  varying float vTwinkle;
  varying float vSurfaceFade;

  void main() {
    if (vSurfaceFade <= 0.001) discard;

    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Crisp bright core + soft glow falloff = "shine" rather than flat dot
    float core = smoothstep(0.06, 0.0, dist);
    float glow = smoothstep(0.5, 0.0, dist);
    float alpha = (core * 1.0 + glow * 0.35) * (0.25 + vTwinkle * 0.9) * vSurfaceFade;

    if (alpha < 0.02) discard;

    vec3 finalColor = mix(uColor, vec3(1.0), core * vTwinkle);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

gsap.registerPlugin(ScrollTrigger);

const eventNodes = [
  {
    id: "event-1",
    num: "01",
    name: "Coding",
    category: "Technical",
    desc: "Test your speed, algorithmic thinking, and problem-solving skills in competitive programming.",
    date: "9 October 2026",
    time: "10:00 AM",
    venue: "MCA Lab 1",
    prize: "₹ 12,000",
    rules: ["Individual participation", "Languages allowed: C, C++, Java, Python", "Time-bound algorithmic problems"],
    pos: { x: -22, y: -110, z: -318 },
    bannerPos: { x: -16, y: -103, z: -313, rotY: 0.35 },
    portalPos: { x: -40, y: -105, z: -326 },
    minScroll: 42,
  },
  {
    id: "event-2",
    num: "02",
    name: "Web Design",
    category: "Technical",
    desc: "Design and build stunning, responsive, and interactive modern web interfaces under time pressure.",
    date: "9 October 2026",
    time: "11:30 AM",
    venue: "Web Lab 2",
    prize: "₹ 12,000",
    rules: ["Individual or teams of 2", "HTML5, CSS3, JavaScript allowed", "Live prototype evaluation"],
    pos: { x: 22, y: -190, z: -430 },
    bannerPos: { x: 16, y: -183, z: -425, rotY: -0.35 },
    portalPos: { x: 40, y: -185, z: -438 },
    minScroll: 48,
  },
  {
    id: "event-3",
    num: "03",
    name: "IT Quiz",
    category: "Technical",
    desc: "Test your knowledge on Programming, DBMS, Operating Systems, Networks, and Cyber Security. Battle against top tech minds.",
    date: "9 October 2026",
    time: "10:00 AM",
    venue: "Main Auditorium",
    prize: "₹ 10,000",
    rules: ["Teams of 2 members", "Preliminary written round followed by live stage quiz"],
    pos: { x: -32, y: -190, z: -518 },
    bannerPos: { x: -26, y: -183, z: -513, rotY: 0.35 },
    portalPos: { x: -50, y: -185, z: -526 },
    minScroll: 54,
  },
  {
    id: "event-4",
    num: "04",
    name: "Gaming",
    category: "E-Sports",
    desc: "Survive intense gaming trenches (BGMI & Valorant) and solve cryptic tech clues across campus to unearth the hidden treasure.",
    date: "10 October 2026",
    time: "01:30 PM",
    venue: "E-Sports Arena",
    prize: "₹ 20,000",
    rules: ["Squads of 4 members", "Time-bound physical & digital clues"],
    pos: { x: 32, y: -230, z: -618 },
    bannerPos: { x: 26, y: -223, z: -613, rotY: -0.35 },
    portalPos: { x: 50, y: -225, z: -626 },
    minScroll: 60,
  },
  {
    id: "event-5",
    num: "05",
    name: "Tech Talk",
    category: "Seminar",
    desc: "Engage with industry leaders and explore cutting-edge developments in AI, Cloud Computing, and Next-Gen Architecture.",
    date: "9 October 2026",
    time: "02:00 PM",
    venue: "Seminar Hall 1",
    prize: "₹ 10,000",
    rules: ["Open to all registered delegates", "Q&A session with keynote speakers"],
    pos: { x: -32, y: -230, z: -718 },
    bannerPos: { x: -32, y: -218, z: -713, rotY: 0 },
    portalPos: { x: -50, y: -225, z: -726 },
    minScroll: 66,
  },
  {
    id: "event-6",
    num: "06",
    name: "Surprise Event",
    category: "Special",
    desc: "Expect the unexpected! A mystery challenge designed to test adaptability, quick thinking, and creative problem solving under pressure.",
    date: "9 October 2026",
    time: "03:30 PM",
    venue: "Open Arena",
    prize: "₹ 10,000",
    rules: ["Rules announced on spot", "Teams of 2 members"],
    pos: { x: 32, y: -310, z: -870 },
    bannerPos: { x: 26, y: -303, z: -865, rotY: -0.35 },
    portalPos: { x: 50, y: -305, z: -878 },
    minScroll: 72,
  },
  {
    id: "event-7",
    num: "07",
    name: "IT Manager",
    category: "Management",
    desc: "You are the technology manager of a company. Something goes wrong. Test your leadership, crisis management, and decision-making skills.",
    date: "9 October 2026",
    time: "11:30 AM",
    venue: "MCA Seminar Hall",
    prize: "₹ 15,000",
    rules: ["Individual participation", "Multiple stress rounds & mock press conference"],
    pos: { x: -32, y: -310, z: -918 },
    bannerPos: { x: -26, y: -303, z: -913, rotY: 0.35 },
    portalPos: { x: -50, y: -305, z: -926 },
    minScroll: 78,
  },
  {
    id: "event-8",
    num: "08",
    name: "Startup Event",
    category: "Innovation",
    desc: "An innovation, product, and business-oriented challenge. Pitch your startup ideas and show your entrepreneurial spirit.",
    date: "10 October 2026",
    time: "09:30 AM",
    venue: "Incubation Center",
    prize: "₹ 15,000",
    rules: ["Teams of up to 3 members", "5-minute pitch + 3-minute Q&A with judges"],
    pos: { x: 32, y: -390, z: -1018 },
    bannerPos: { x: 26, y: -383, z: -1013, rotY: -0.35 },
    portalPos: { x: 50, y: -385, z: -1026 },
    minScroll: 84,
  },
  {
    id: "event-9",
    num: "09",
    name: "Dance",
    category: "Cultural",
    desc: "Showcase your energy, rhythm, and choreography in an epic stage dance performance celebrating art and music.",
    date: "10 October 2026",
    time: "04:00 PM",
    venue: "Open Air Theater",
    prize: "₹ 18,000",
    rules: ["Group performance", "Time limit: 6 to 8 minutes", "Props permitted"],
    pos: { x: -32, y: -430, z: -1118 },
    bannerPos: { x: -26, y: -423, z: -1113, rotY: 0.35 },
    portalPos: { x: -50, y: -425, z: -1126 },
    minScroll: 90,
  },
  {
    id: "event-10",
    num: "10",
    name: "Photography & Videography",
    category: "Creative",
    desc: "Capture breathtaking visual stories, creative angles, and cinematic highlights of Semaphore 2k26 across campus.",
    date: "10 October 2026",
    time: "10:00 AM",
    venue: "Campus Grounds",
    prize: "₹ 12,000",
    rules: ["Individual participation", "Original unedited RAW & edited submission", "Theme provided on spot"],
    pos: { x: 0, y: -470, z: -1218 },
    bannerPos: { x: 16, y: -463, z: -1213, rotY: -0.2 },
    portalPos: { x: -18, y: -465, z: -1226 },
    minScroll: 96,
  },
];

// Helper function to dynamically draw futuristic 3D Holographic Event Title Plaques onto Canvas Textures (Applied to All 10 Events)
function createEventBannerTexture(node) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = 2048, h = 800;
  const pad = 60;
  const x = pad, y = pad, cw = w - pad * 2, ch = h - pad * 2;
  const corner = 36; // Chamfer cut size

  // 1. Soft subtle ambient cyan radial back-glow
  const bgGlow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 750);
  bgGlow.addColorStop(0, "rgba(0, 240, 255, 0.28)");
  bgGlow.addColorStop(0.5, "rgba(2, 132, 199, 0.08)");
  bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, w, h);

  // 2. Solid Opaque Dark Navy-Black Glass Panel Body (Blocks background rock from showing through)
  const cardGrad = ctx.createLinearGradient(x, y, x + cw, y + ch);
  cardGrad.addColorStop(0, "rgb(2, 14, 28)");
  cardGrad.addColorStop(0.5, "rgb(3, 20, 38)");
  cardGrad.addColorStop(1, "rgb(2, 10, 22)");

  function drawChamferPath(cx, cy, width, height, c) {
    ctx.beginPath();
    ctx.moveTo(cx + c, cy);
    ctx.lineTo(cx + width - c, cy);
    ctx.lineTo(cx + width, cy + c);
    ctx.lineTo(cx + width, cy + height - c);
    ctx.lineTo(cx + width - c, cy + height);
    ctx.lineTo(cx + c, cy + height);
    ctx.lineTo(cx, cy + height - c);
    ctx.lineTo(cx, cy + c);
    ctx.closePath();
  }

  ctx.save();
  drawChamferPath(x, y, cw, ch, corner);
  ctx.fillStyle = cardGrad;
  ctx.fill();

  // 3. Fine sharp background grid lines inside panel
  ctx.clip();
  ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let gx = x; gx < x + cw; gx += 32) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + ch); ctx.stroke();
  }
  for (let gy = y; gy < y + ch; gy += 32) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + cw, gy); ctx.stroke();
  }
  ctx.restore();

  // 4. Razor-Sharp Double Cyan Outer Frame
  ctx.save();
  drawChamferPath(x, y, cw, ch, corner);
  ctx.strokeStyle = "#00f0ff";
  ctx.lineWidth = 6;
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Inner Parallel Frame
  const gap = 14;
  drawChamferPath(x + gap, y + gap, cw - gap * 2, ch - gap * 2, corner - 4);
  ctx.strokeStyle = "rgba(0, 240, 255, 0.75)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 6;
  ctx.stroke();

  // Corner Sci-Fi Bracket Highlights
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(x, y + corner + 24); ctx.lineTo(x, y + corner); ctx.lineTo(x + corner, y); ctx.lineTo(x + corner + 24, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + cw - corner - 24, y); ctx.lineTo(x + cw - corner, y); ctx.lineTo(x + cw, y + corner); ctx.lineTo(x + cw, y + corner + 24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + ch - corner - 24); ctx.lineTo(x, y + ch - corner); ctx.lineTo(x + corner, y + ch); ctx.lineTo(x + corner + 24, y + ch); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + cw - corner - 24, y + ch); ctx.lineTo(x + cw - corner, y + ch); ctx.lineTo(x + cw, y + ch - corner); ctx.lineTo(x + cw, y + ch - corner - 24); ctx.stroke();
  ctx.restore();

  // 5. Top Header Badge: ◇  EVENT XX  ◇
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 44px monospace, system-ui, sans-serif";
  ctx.fillStyle = "#00f0ff";
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 8;
  ctx.fillText(`◇    EVENT ${node.num}    ◇`, w / 2, y + 52);
  ctx.restore();

  // 6. Bottom Category Badge: ◆  CATEGORY  ◆
  const catText = (node.category || "TECHNICAL").toUpperCase();
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 38px monospace, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 8;
  ctx.fillText(catText, w / 2, y + ch - 52);

  // Left and Right Pink Diamond Markers ◆
  const catWidthOffset = Math.max(160, catText.length * 16 + 40);
  ctx.fillStyle = "#ec4899";
  ctx.shadowColor = "#ec4899";
  ctx.shadowBlur = 10;
  ctx.fillText("◆", w / 2 - catWidthOffset, y + ch - 52);
  ctx.fillText("◆", w / 2 + catWidthOffset, y + ch - 52);
  ctx.restore();

  // 7. Center Module Box & Ultra-Sharp Dynamic Event Title
  const mx = w / 2 - 440, my = h / 2 - 135, mw = 880, mh = 270, mc = 32;
  ctx.save();
  drawChamferPath(mx, my, mw, mh, mc);
  ctx.fillStyle = "rgba(0, 36, 60, 0.88)";
  ctx.fill();

  ctx.strokeStyle = "#00f0ff";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 12;
  ctx.stroke();

  const mgap = 8;
  drawChamferPath(mx + mgap, my + mgap, mw - mgap * 2, mh - mgap * 2, mc - 2);
  ctx.strokeStyle = "rgba(0, 240, 255, 0.65)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();

  // Razor-Sharp Event Name Title Text
  const nameText = node.name.toUpperCase();
  let titleFontSize = 138;
  if (nameText.length > 20) titleFontSize = 56;
  else if (nameText.length > 13) titleFontSize = 88;
  else if (nameText.length > 9) titleFontSize = 110;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${titleFontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#00f0ff";
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 14;
  ctx.strokeText(nameText, w / 2, h / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(nameText, w / 2, h / 2);
  ctx.restore();

  // 8. Left & Right Sci-Fi Interface Readouts
  // Left Readouts
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 72px monospace";
  ctx.fillStyle = "#00f0ff";
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 10;
  ctx.fillText("</>", x + 160, h / 2 - 40);

  ctx.textAlign = "left";
  ctx.font = "600 18px monospace";
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0, 240, 255, 0.85)";
  const leftCodeLines = [
    `SYS_ID: 0${node.num}`,
    "const OCEAN = true;",
    "// SIGNAL: ACTIVE",
    "< /AQUASAGA >",
    `node: ${node.id} / online`,
  ];
  leftCodeLines.forEach((line, idx) => {
    ctx.fillText(line, x + 65, h / 2 + 35 + idx * 24);
  });
  ctx.restore();

  // Right Readouts
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 72px monospace";
  ctx.fillStyle = "#00f0ff";
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 10;
  ctx.fillText("{ }", x + cw - 160, h / 2 + 50);

  ctx.textAlign = "right";
  ctx.font = "600 18px monospace";
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0, 240, 255, 0.85)";
  const rightCodeLines = [
    "sys.core / linked",
    `packet ${node.num} / stable`,
    "depth buffer / online",
    "status / 200 OK",
  ];
  rightCodeLines.forEach((line, idx) => {
    ctx.fillText(line, x + cw - 65, h / 2 - 80 + idx * 24);
  });
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}



export default function Scene() {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const heroUiRef = useRef(null);
  const audioRef = useRef(null);
  const pinRefs = useRef([]);
  const activeEventRef = useRef("event-1");
  const userMutedRef = useRef(false);
  const [activeEvent, setActiveEvent] = useState("event-1");

  const [scrollProgress, setScrollProgress] = useState(0);

  // The full-screen loader and its Retry button live in <PreloadProvider>, above the
  // whole app. This component only claims a readiness gate and reports how far along
  // its own post-download work (parse -> upload -> compile -> first frame) is.
  const { register, retryToken } = usePreload();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [stats, setStats] = useState({
    depth: 2,
    speed: "2.0",
    coords: "X:0 Y:0 Z:0",
    fps: 60,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const bgm = new Audio("/assets/audio/bgm.mp3");
      bgm.loop = true;
      bgm.volume = 0.5;
      bgm.preload = "auto";
      audioRef.current = bgm;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const isPlayPendingRef = useRef(false);

  // Automatically play audio by default when first entering the ocean on user scroll gesture, and pause outside ocean
  useEffect(() => {
    if (!audioRef.current) return;

    const handleInitialOceanScroll = () => {
      if (
        scrollProgress >= 4 &&
        !userMutedRef.current &&
        audioRef.current &&
        audioRef.current.paused &&
        !isPlayPendingRef.current
      ) {
        console.log("[Performance] Triggering Audio Play...");
        console.time("[Performance] Audio Play Promise");
        isPlayPendingRef.current = true;
        audioRef.current
          .play()
          .then(() => {
            console.timeEnd("[Performance] Audio Play Promise");
            setIsAudioPlaying(true);
            isPlayPendingRef.current = false;
          })
          .catch((err) => {
            console.timeEnd("[Performance] Audio Play Promise");
            console.log("Audio autoplay blocked (expected if no user interaction yet):", err.message);
            isPlayPendingRef.current = false;
          });
      }
    };

    if (scrollProgress >= 4) {
      handleInitialOceanScroll();
      window.addEventListener("wheel", handleInitialOceanScroll, { passive: true });
      window.addEventListener("scroll", handleInitialOceanScroll, { passive: true });
      window.addEventListener("touchmove", handleInitialOceanScroll, { passive: true });
    } else {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      }
    }

    return () => {
      window.removeEventListener("wheel", handleInitialOceanScroll);
      window.removeEventListener("scroll", handleInitialOceanScroll);
      window.removeEventListener("touchmove", handleInitialOceanScroll);
    };
  }, [scrollProgress]);

  const toggleAudio = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!audioRef.current) {
      const bgm = new Audio("/assets/audio/bgm.mp3");
      bgm.loop = true;
      bgm.volume = 0.5;
      audioRef.current = bgm;
    }

    const audio = audioRef.current;
    if (audio.paused) {
      userMutedRef.current = false; // User explicitly turned ON audio
      audio
        .play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch((err) => {
          console.warn("Audio play error:", err);
          setIsAudioPlaying(false);
        });
    } else {
      userMutedRef.current = true; // User explicitly turned OFF audio
      audio.pause();
      setIsAudioPlaying(false);
    }
  };



  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    // LoadingManager is kept only so any incidental loader still has a home; the
    // user-facing percentage now comes from real transferred bytes (see the
    // preload block below), not from itemsLoaded/itemsTotal file counting.
    const manager = new THREE.LoadingManager();
    manager.onError = (url) => {
      console.error("[Aquasaga] asset failed to load:", url);
    };

    const abortController = new AbortController();

    const isMobile = window.innerWidth < 768;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 65 : 75,
      window.innerWidth / window.innerHeight,
      0.1,
      1600
    );
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: isMobile ? "low-power" : "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // --- HDRI SKY ENVIRONMENT (SURFACE OCEAN START) ---
    // The 4K EXR is ~19MB — by far the heaviest asset on the page. It is deliberately
    // NOT registered with `manager`, so the loading screen is gated only on the small
    // essential assets (water normals, fish, dolphin ≈ 2MB) and dismisses in a fraction
    // of the time. Until the real HDRI arrives we render a procedural sky that matches
    // its tonality, then swap it in with a short intensity ramp so the change reads as
    // a natural brightening rather than a hard cut.
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Cheap equirectangular stand-in sky (sun-warmed horizon over deepening blue),
    // built on a 512x256 canvas so it costs well under a millisecond to produce.
    function createFallbackSkyTexture() {
      const skyCanvas = document.createElement("canvas");
      skyCanvas.width = 512;
      skyCanvas.height = 256;
      const sctx = skyCanvas.getContext("2d");
      const grad = sctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, "#1d4e7a");
      grad.addColorStop(0.34, "#5b9fc4");
      grad.addColorStop(0.49, "#cfe4ec");
      grad.addColorStop(0.52, "#e8dcc4");
      grad.addColorStop(0.62, "#4e7f96");
      grad.addColorStop(1.0, "#123449");
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 512, 256);
      const tex = new THREE.CanvasTexture(skyCanvas);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const fallbackSkySource = createFallbackSkyTexture();
    const fallbackEnvTarget = pmremGenerator.fromEquirectangular(fallbackSkySource);
    // The animate loop reads `exrEnvironmentTexture` fresh each frame, so pointing it at
    // the fallback now and reassigning it later swaps the sky with no further wiring.
    let exrEnvironmentTexture = fallbackEnvTarget.texture;
    scene.background = exrEnvironmentTexture;
    scene.environment = exrEnvironmentTexture;
    fallbackSkySource.dispose();

    let sceneDisposed = false;

    // --- SURFACE OCEAN WATER ---
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    // Placeholder filled in from the preloaded bytes below — the scene graph is built
    // synchronously, but no frame is revealed until these are populated.
    const waterNormals = new THREE.Texture();
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(0.7, 0.5, 0.6).normalize(),
      sunColor: 0xccddff, // Moonlight reflection color
      waterColor: 0x001838, // Deep blue night ocean color
      distortionScale: 3.7,
      fog: true,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2;
    water.renderOrder = 0; // Surface water layer — rendered first
    scene.add(water);

    // --- UNDERWATER CEILING CAUSTICS PLANE (VIEWED FROM BELOW WATER) ---
    const waterCeilingGeo = new THREE.PlaneGeometry(800, 800);
    const waterCeilingMat = new THREE.ShaderMaterial({
      vertexShader: waterCausticsVertex,
      fragmentShader: waterCausticsFragment,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x00f0ff) },
        uColor2: { value: new THREE.Color(0x0044aa) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const waterCeilingMesh = new THREE.Mesh(waterCeilingGeo, waterCeilingMat);
    waterCeilingMesh.rotation.x = Math.PI / 2;
    waterCeilingMesh.position.y = -2.05;
    waterCeilingMesh.visible = true;
    waterCeilingMesh.renderOrder = 2; // Caustic ceiling above water underside
    scene.add(waterCeilingMesh);

    const waterUnderside = new THREE.Mesh(
      waterGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.1,
        side: THREE.BackSide,
      })
    );
    waterUnderside.rotation.x = -Math.PI / 2;
    waterUnderside.position.y = -2.01;
    waterUnderside.visible = true;
    waterUnderside.renderOrder = 1; // Water underside — just below caustics
    scene.add(waterUnderside);

    // --- SURFACE GLACIAL ICEBERGS & ROCKS ---
    function createIcebergGeometry(radius, heightScale) {
      const geo = new THREE.IcosahedronGeometry(radius, 4);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        if (v.y > 0) {
          v.y = Math.min(v.y, radius * 0.5 + Math.sin(v.x * 0.5) * 1.5);
        } else {
          v.y *= heightScale;
        }
        const noise = Math.sin(v.x * 0.3) * Math.sin(v.y * 0.3) * Math.cos(v.z * 0.3);
        const detail = Math.sin(v.x * 1.2 + v.y * 0.8) * 0.3;
        const dist = 1.0 + (noise + detail) * 0.25;
        v.x *= dist;
        v.y *= dist;
        v.z *= dist;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      const nonIndexed = geo.toNonIndexed();
      nonIndexed.computeVertexNormals();
      return nonIndexed;
    }

    const iceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdff4ff,
      transmission: 0.75,
      opacity: 1,
      roughness: 0.2,
      metalness: 0.05,
      ior: 1.31,
      thickness: 6.0,
      attenuationColor: new THREE.Color(0x0099ee),
      attenuationDistance: 4.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      flatShading: true,
    });

    const iceberg = new THREE.Mesh(createIcebergGeometry(12, 1.8), iceMaterial);
    iceberg.position.set(-20, -5, -48);
    scene.add(iceberg);

    const iceberg2 = new THREE.Mesh(createIcebergGeometry(8, 1.6), iceMaterial);
    iceberg2.position.set(24, -4, -54);
    scene.add(iceberg2);

    const icePlateGeo = new THREE.CylinderGeometry(4, 5, 0.8, 7);
    const icePlate = new THREE.Mesh(icePlateGeo, iceMaterial);
    icePlate.position.set(-24, -4.5, -36);
    icePlate.rotation.y = 0.4;
    scene.add(icePlate);

    const smallIcePositions = [
      { x: 26, y: -4, z: -32, s: 1.6 },
      { x: -35, y: -3.5, z: -42, s: 2.2 },
      { x: 34, y: -4.5, z: -38, s: 1.5 },
      { x: -18, y: -5, z: -50, s: 1.8 },
      { x: 22, y: -3.5, z: -26, s: 1.2 },
    ];
    const smallIceGeos = [];
    for (const p of smallIcePositions) {
      const chunkGeo = new THREE.IcosahedronGeometry(p.s, 2);
      smallIceGeos.push(chunkGeo);
      const chunk = new THREE.Mesh(chunkGeo, iceMaterial);
      chunk.position.set(p.x, p.y, p.z);
      chunk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(chunk);
    }

    // --- DEEP UNDERGROUND OCEAN LIGHTING ---
    const sunLight = new THREE.DirectionalLight(0xcceeff, 2.0); // Pale blue moonlight
    // Position the light exactly where the moon is to create a realistic reflection path on the water
    sunLight.position.set(0, 130, -600);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // --- NIGHT SKY (MOON & STARS) ---
    const skyGroup = new THREE.Group();

    // Moon
    const moonTexture = new THREE.TextureLoader().load('/textures/moon.jpg');
    const moonGeo = new THREE.SphereGeometry(60, 64, 64);
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTexture,
      color: 0xffffff,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    // Center it above the horizon line in the distance
    moonMesh.position.set(0, 130, -600);
    // Rotate moon so a nice crater pattern faces us
    moonMesh.rotation.y = -Math.PI / 2;
    skyGroup.add(moonMesh);

    // Moon Glow (Halo)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext('2d');
    const glowGradient = glowCtx.createRadialGradient(128, 128, 50, 128, 128, 128);
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    glowGradient.addColorStop(0.2, 'rgba(200, 220, 255, 0.5)');
    glowGradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.2)');
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    glowCtx.fillStyle = glowGradient;
    glowCtx.fillRect(0, 0, 256, 256);

    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xccddff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.6,
      depthWrite: false,
    });
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(220, 220, 1);
    glowSprite.position.set(0, 130, -610); // Slightly behind the moon
    skyGroup.add(glowSprite);

    // Circular Texture for Stars
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const starCtx = starCanvas.getContext('2d');
    starCtx.beginPath();
    starCtx.arc(16, 16, 16, 0, Math.PI * 2);
    starCtx.fillStyle = 'white';
    starCtx.fill();
    const starTexture = new THREE.CanvasTexture(starCanvas);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 1500; // x
      starPositions[i * 3 + 1] = 20 + Math.random() * 800; // y
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 1000 - 300; // z
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      map: starTexture,
      transparent: true,
      alphaTest: 0.5,
      opacity: 0.8
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    skyGroup.add(starPoints);

    scene.add(skyGroup);

    const tealUnderwaterLight = new THREE.DirectionalLight(0x00a8e8, 5.5);
    tealUnderwaterLight.position.set(0, 50, -100);
    scene.add(tealUnderwaterLight);

    // Glowing Portal Backlight (Positioned deep underwater at y: -110, z: -192)
    const portalBackLight = new THREE.PointLight(0x00f0ff, 10.0, 200);
    portalBackLight.position.set(0, -110, -192);
    scene.add(portalBackLight);

    // Dedicated Left & Right Side Cliff Accent Lights for High Visibility
    const leftSideLight = new THREE.PointLight(0x00a8e8, 8.5, 180);
    leftSideLight.position.set(-50, -90, -170);
    scene.add(leftSideLight);

    const rightSideLight = new THREE.PointLight(0x00a8e8, 8.5, 180);
    rightSideLight.position.set(50, -90, -170);
    scene.add(rightSideLight);

    // --- LEFT & RIGHT JAGGED CLIFF WALLS ---
    const sideCliffGroup = new THREE.Group();
    sideCliffGroup.visible = true;

    const cliffWallMat = new THREE.MeshStandardMaterial({
      color: 0x051d2c,
      emissive: 0x010b14,
      emissiveIntensity: 0.2,
      roughness: 0.75,
      metalness: 0.25,
      flatShading: true,
    });

    const coralGlowColors = [0x00f0ff, 0xa855f7, 0xec4899, 0x0284c7];

    function createSideCliffWall(xPos, isRight, zCenter = -120, yPos = -95) {
      const cliffWallGeo = new THREE.BoxGeometry(34, 180, 160, 12, 16, 12);
      const pos = cliffWallGeo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const bump =
          Math.sin(v.y * 0.08) * Math.cos(v.z * 0.08) * 5.0 +
          Math.sin(v.y * 0.2 + v.x * 0.1) * 2.0;
        v.x += isRight ? -bump : bump;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      cliffWallGeo.computeVertexNormals();

      const cliffMesh = new THREE.Mesh(cliffWallGeo, cliffWallMat);
      cliffMesh.position.set(xPos, yPos, zCenter);
      sideCliffGroup.add(cliffMesh);

      // Add glowing corals & sponges along the cliff face shelves
      for (let c = 0; c < 12; c++) {
        const cGeo = new THREE.ConeGeometry(1.2 + Math.random() * 0.6, 4.5 + Math.random() * 3.0, 7);
        const cMat = new THREE.MeshStandardMaterial({
          color: 0x032035,
          emissive: coralGlowColors[c % coralGlowColors.length],
          emissiveIntensity: 1.2,
          roughness: 0.2,
          flatShading: true,
        });
        const coralMesh = new THREE.Mesh(cGeo, cMat);
        const sideOffset = isRight ? -16 + (Math.random() - 0.5) * 5 : 16 + (Math.random() - 0.5) * 5;
        coralMesh.position.set(
          xPos + sideOffset,
          yPos + 40 - Math.random() * 80,
          zCenter + (Math.random() - 0.5) * 140
        );
        coralMesh.rotation.set(
          (Math.random() - 0.5) * 0.4,
          Math.random() * Math.PI,
          isRight ? -0.4 : 0.4
        );
        sideCliffGroup.add(coralMesh);
      }
    }

    // Generate continuous side cliff rock formations along the entire depth (z = 0 down to z = -1350)
    for (let zDepth = 0; zDepth >= -1350; zDepth -= 150) {
      const yPos = -95 + (zDepth / 1350) * 350;
      createSideCliffWall(-66, false, zDepth, yPos); // Left Cliff Wall (Inward at x = -66 for high visibility)
      createSideCliffWall(66, true, zDepth, yPos);   // Right Cliff Wall (Inward at x = +66 for high visibility)
    }
    sideCliffGroup.renderOrder = 4; // Side cliffs above cave walls
    scene.add(sideCliffGroup);

    // --- LAYER 3 & 4: DISTANT UNDERWATER MOUNTAIN PEAKS & CAVERN WALLS ---
    const caveGeometry = new THREE.CylinderGeometry(260, 360, 650, 32, 32, true);
    const cavePos = caveGeometry.attributes.position;
    const caveVec = new THREE.Vector3();
    for (let i = 0; i < cavePos.count; i++) {
      caveVec.fromBufferAttribute(cavePos, i);
      const noise =
        Math.sin(caveVec.x * 0.05) * Math.cos(caveVec.y * 0.05) * Math.sin(caveVec.z * 0.05) * 25.0 +
        Math.sin(caveVec.x * 0.12 + caveVec.y * 0.08) * 10.0;
      caveVec.x += noise;
      caveVec.z += noise;
      cavePos.setXYZ(i, caveVec.x, caveVec.y, caveVec.z);
    }
    caveGeometry.computeVertexNormals();

    const caveMaterial = new THREE.MeshStandardMaterial({
      color: 0x031420,
      roughness: 0.85,
      metalness: 0.15,
      side: THREE.BackSide,
      flatShading: true,
      transparent: true,
    });
    const caveMesh = new THREE.Mesh(caveGeometry, caveMaterial);
    caveMesh.position.set(0, -335, -380);
    caveMesh.visible = true;
    caveMesh.renderOrder = 3; // Cave walls between water and cliffs
    scene.add(caveMesh);

    // Large Distant Underwater Mountains
    const bgMountainsGroup = new THREE.Group();
    bgMountainsGroup.visible = true;

    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x031420,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    const mountainPositions = [
      { x: -175, y: -140, z: -260, r: 55, h: 130 },
      { x: 175, y: -150, z: -290, r: 60, h: 140 },
      { x: -185, y: -180, z: -380, r: 65, h: 170 },
      { x: 185, y: -190, z: -410, r: 65, h: 180 },
      { x: -185, y: -240, z: -520, r: 70, h: 220 },
      { x: 185, y: -250, z: -540, r: 70, h: 230 },
      { x: -190, y: -340, z: -720, r: 75, h: 300 },
      { x: 190, y: -350, z: -760, r: 75, h: 310 },
      { x: -195, y: -420, z: -880, r: 80, h: 360 },
      { x: 195, y: -430, z: -960, r: 80, h: 370 },
    ];

    for (const m of mountainPositions) {
      const mGeo = new THREE.ConeGeometry(m.r, m.h, 7);
      const mPos = mGeo.attributes.position;
      const mV = new THREE.Vector3();
      for (let i = 0; i < mPos.count; i++) {
        mV.fromBufferAttribute(mPos, i);
        const detail = Math.sin(mV.x * 0.08) * Math.cos(mV.y * 0.08) * 8.0;
        mV.x += detail;
        mV.z += detail;
        mPos.setXYZ(i, mV.x, mV.y, mV.z);
      }
      mGeo.computeVertexNormals();

      const mMesh = new THREE.Mesh(mGeo, mountainMaterial);
      mMesh.position.set(m.x, m.y + m.h / 2, m.z);
      bgMountainsGroup.add(mMesh);
    }
    scene.add(bgMountainsGroup);

    // --- CENTRAL ANCIENT CIRCULAR PORTAL RING (MAIN ENTRANCE STARGATE AT y: -110, z: -190) ---

    // ── Materials ────────────────────────────────────────────────────────────────
    const ruinStoneMat = new THREE.MeshStandardMaterial({
      color: 0x04141f,
      roughness: 0.88,
      metalness: 0.22,
      flatShading: true,
    });

    const ruinGlowMat = new THREE.MeshStandardMaterial({
      color: 0x003a55,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.4,
      roughness: 0.1,
      metalness: 0.5,
    });

    const archRockMat = new THREE.MeshStandardMaterial({
      color: 0x030e19,
      emissive: 0x000810,
      emissiveIntensity: 0.06,
      roughness: 0.96,
      metalness: 0.07,
      flatShading: true,
    });

    const wetStoneMat = new THREE.MeshStandardMaterial({
      color: 0x061a27,
      roughness: 0.55,
      metalness: 0.45,
      flatShading: true,
    });

    // ── Portal group (world position unchanged) ──────────────────────────────────
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, -110, -190);

    addCoralReef(scene, portalGroup);

    // ── Helper: procedurally deform a geometry to look rocky ────────────────────
    function deformGeo(geo, strength, seed) {
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const n =
          Math.sin(v.x * 0.14 + seed) * Math.cos(v.y * 0.17 + seed * 0.7) * strength +
          Math.cos(v.z * 0.12 + seed * 1.3) * strength * 0.6;
        v.x += n;
        v.z += n * 0.8;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    }

    // ── MASSIVE CAVERN ROCK ARCH ─────────────────────────────────────────────────

    // Main overhead half-arch (wide, heavy, irregular)
    const caveTopGeo = deformGeo(new THREE.TorusGeometry(44, 13, 8, 20, Math.PI), 3.5, 1.2);
    const caveTopMesh = new THREE.Mesh(caveTopGeo, archRockMat);
    caveTopMesh.position.set(0, 18, -6);
    portalGroup.add(caveTopMesh);

    // Left cavern wall slab
    const leftWallGeo = deformGeo(new THREE.BoxGeometry(26, 88, 20), 4.2, 2.1);
    const leftWallMesh = new THREE.Mesh(leftWallGeo, archRockMat);
    leftWallMesh.position.set(-54, -10, -8);
    leftWallMesh.rotation.y = 0.22;
    portalGroup.add(leftWallMesh);

    // Right cavern wall slab
    const rightWallGeo = deformGeo(new THREE.BoxGeometry(26, 88, 20), 4.0, 3.3);
    const rightWallMesh = new THREE.Mesh(rightWallGeo, archRockMat);
    rightWallMesh.position.set(54, -10, -8);
    rightWallMesh.rotation.y = -0.22;
    portalGroup.add(rightWallMesh);

    // Left inner shoulder rock
    const leftShoulderGeo = deformGeo(new THREE.CylinderGeometry(8, 14, 55, 7), 3.0, 0.8);
    const leftShoulderMesh = new THREE.Mesh(leftShoulderGeo, archRockMat);
    leftShoulderMesh.position.set(-36, -5, -5);
    leftShoulderMesh.rotation.z = 0.18;
    portalGroup.add(leftShoulderMesh);

    // Right inner shoulder rock
    const rightShoulderGeo = deformGeo(new THREE.CylinderGeometry(8, 14, 55, 7), 2.8, 1.7);
    const rightShoulderMesh = new THREE.Mesh(rightShoulderGeo, archRockMat);
    rightShoulderMesh.position.set(36, -5, -5);
    rightShoulderMesh.rotation.z = -0.18;
    portalGroup.add(rightShoulderMesh);

    // Overhead lintel / rock ledge
    const lintelGeo = deformGeo(new THREE.BoxGeometry(78, 11, 16), 2.5, 4.4);
    const lintelMesh = new THREE.Mesh(lintelGeo, archRockMat);
    lintelMesh.position.set(0, 40, -7);
    portalGroup.add(lintelMesh);

    // Left lower cavern chunk (jagged)
    const leftChunkGeo = deformGeo(new THREE.DodecahedronGeometry(18, 1), 5.0, 5.5);
    const leftChunkMesh = new THREE.Mesh(leftChunkGeo, archRockMat);
    leftChunkMesh.position.set(-48, -36, -2);
    leftChunkMesh.rotation.set(0.3, 0.5, 0.1);
    portalGroup.add(leftChunkMesh);

    // Right lower cavern chunk
    const rightChunkGeo = deformGeo(new THREE.DodecahedronGeometry(17, 1), 4.5, 6.6);
    const rightChunkMesh = new THREE.Mesh(rightChunkGeo, archRockMat);
    rightChunkMesh.position.set(48, -36, -2);
    rightChunkMesh.rotation.set(0.2, -0.6, -0.1);
    portalGroup.add(rightChunkMesh);

    // Background cavern wall (occluder)
    const backWallGeo = deformGeo(new THREE.PlaneGeometry(160, 100, 6, 5), 2.5, 7.7);
    const backWallMesh = new THREE.Mesh(backWallGeo, archRockMat);
    backWallMesh.position.set(0, 5, -22);
    portalGroup.add(backWallMesh);

    // Stalactite spikes hanging from lintel
    const stalactiteData = [
      { x: -30, y: 34, s: 3.5 }, { x: -16, y: 36, s: 4.2 },
      { x: -4, y: 37, s: 3.0 }, { x: 8, y: 36, s: 4.8 },
      { x: 20, y: 35, s: 3.2 }, { x: 32, y: 34, s: 3.8 },
    ];
    for (const st of stalactiteData) {
      const sGeo = new THREE.ConeGeometry(st.s * 0.35, st.s * 2.8, 5);
      const sMesh = new THREE.Mesh(sGeo, archRockMat);
      sMesh.position.set(st.x, st.y, -5);
      sMesh.rotation.z = Math.PI;
      portalGroup.add(sMesh);
    }

    // ── 3-D AQUASAGA TITLE (built from Box / Torus geometry) ───────────────────
    const letterStoneMat = new THREE.MeshStandardMaterial({
      color: 0x03111e,
      roughness: 0.9,
      metalness: 0.25,
      flatShading: true,
    });
    const letterGlowMat = new THREE.MeshStandardMaterial({
      color: 0x002a44,
      emissive: 0x00c8ff,
      emissiveIntensity: 3.5,
      roughness: 0.05,
      metalness: 0.6,
    });

    const titleGroup = new THREE.Group();
    titleGroup.position.set(0, 52, -3);
    portalGroup.add(titleGroup);

    const LH = 9;   // letter height
    const LT = 2.2; // letter depth
    const SW = 1.8; // stroke width

    function mkBar(w, h, x, y) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, LT), letterStoneMat);
      m.position.set(x, y, 0);
      return m;
    }
    function mkGlowBar(w, h, x, y) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, LT * 0.4), letterGlowMat);
      m.position.set(x, y, LT * 0.55);
      return m;
    }

    function mkLetterA(withCrown) {
      const g = new THREE.Group();
      const legL = new THREE.Mesh(new THREE.BoxGeometry(SW, LH * 0.85, LT), letterStoneMat);
      legL.position.set(-3.0, -LH * 0.07, 0); legL.rotation.z = 0.32; g.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(SW, LH * 0.85, LT), letterStoneMat);
      legR.position.set(3.0, -LH * 0.07, 0); legR.rotation.z = -0.32; g.add(legR);
      g.add(mkBar(4.5, SW, 0, -0.8));
      if (withCrown) {
        const crGeo = new THREE.OctahedronGeometry(1.6, 0);
        const crMat = new THREE.MeshStandardMaterial({ color: 0x001830, emissive: 0x00f0ff, emissiveIntensity: 4.5, roughness: 0.05, flatShading: true });
        const cr = new THREE.Mesh(crGeo, crMat);
        cr.position.set(0, LH * 0.46, 0); cr.rotation.y = 0.4; g.add(cr);
        const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.6, 2.8, 4), letterGlowMat);
        sp.position.set(0, LH * 0.28, 0); g.add(sp);
      }
      const glL = new THREE.Mesh(new THREE.BoxGeometry(SW * 0.5, LH * 0.85, LT * 0.4), letterGlowMat);
      glL.position.set(-3.0, -LH * 0.07, LT * 0.7); glL.rotation.z = 0.32; g.add(glL);
      const glR = new THREE.Mesh(new THREE.BoxGeometry(SW * 0.5, LH * 0.85, LT * 0.4), letterGlowMat);
      glR.position.set(3.0, -LH * 0.07, LT * 0.7); glR.rotation.z = -0.32; g.add(glR);
      return g;
    }
    function mkLetterQ() {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.TorusGeometry(3.2, SW * 0.7, 6, 16), letterStoneMat));
      const tail = new THREE.Mesh(new THREE.BoxGeometry(SW, 3.5, LT), letterStoneMat);
      tail.position.set(2.2, -2.5, 0); tail.rotation.z = -0.5; g.add(tail);
      const gRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, SW * 0.28, 6, 16), letterGlowMat);
      gRing.position.z = LT * 0.7; g.add(gRing);
      return g;
    }
    function mkLetterU() {
      const g = new THREE.Group();
      g.add(mkBar(SW, LH, -3.0, 0)); g.add(mkBar(SW, LH, 3.0, 0));
      g.add(mkBar(7.5, SW, 0, -LH / 2 + SW / 2));
      g.add(mkGlowBar(SW * 0.5, LH, -3.0, 0)); g.add(mkGlowBar(SW * 0.5, LH, 3.0, 0));
      g.add(mkGlowBar(7.5, SW * 0.5, 0, -LH / 2 + SW / 2));
      return g;
    }
    function mkLetterS() {
      const g = new THREE.Group();
      g.add(mkBar(7, SW, 0, LH / 2 - SW / 2));
      g.add(mkBar(7, SW, 0, 0));
      g.add(mkBar(7, SW, 0, -LH / 2 + SW / 2));
      g.add(mkBar(SW, LH / 2, -3.2, LH / 4));
      g.add(mkBar(SW, LH / 2, 3.2, -LH / 4));
      g.add(mkGlowBar(7, SW * 0.5, 0, LH / 2 - SW / 2));
      g.add(mkGlowBar(7, SW * 0.5, 0, 0));
      g.add(mkGlowBar(7, SW * 0.5, 0, -LH / 2 + SW / 2));
      return g;
    }
    function mkLetterG() {
      const g = new THREE.Group();
      g.add(mkBar(7, SW, 0, LH / 2 - SW / 2));
      g.add(mkBar(7, SW, 0, -LH / 2 + SW / 2));
      g.add(mkBar(SW, LH, -3.2, 0));
      g.add(mkBar(SW, LH / 2, 3.2, -LH / 4));
      g.add(mkBar(4, SW, 1.6, 0));
      g.add(mkGlowBar(7, SW * 0.5, 0, LH / 2 - SW / 2));
      g.add(mkGlowBar(7, SW * 0.5, 0, -LH / 2 + SW / 2));
      g.add(mkGlowBar(SW * 0.5, LH, -3.2, 0));
      return g;
    }

    // A  Q  U  A  S  A  G  A
    const titleLetters = [
      { make: () => mkLetterA(true), x: -33.25 },
      { make: mkLetterQ, x: -23.75 },
      { make: mkLetterU, x: -14.25 },
      { make: () => mkLetterA(false), x: -4.75 },
      { make: mkLetterS, x: 4.75 },
      { make: () => mkLetterA(false), x: 14.25 },
      { make: mkLetterG, x: 23.75 },
      { make: () => mkLetterA(false), x: 33.25 },
    ];
    for (const def of titleLetters) {
      const lg = def.make();
      lg.position.x = def.x;
      titleGroup.add(lg);
    }

    // Stone backing slab behind the letters
    const titleSlabGeo = deformGeo(new THREE.BoxGeometry(84, LH + 6, LT + 2), 1.0, 9.9);
    titleGroup.add(new THREE.Mesh(titleSlabGeo, archRockMat)).position.z = -LT;

    // Cyan glow rim under the title slab
    const titleRim = new THREE.Mesh(new THREE.BoxGeometry(86, 0.6, 1.0), ruinGlowMat);
    titleRim.position.set(0, -(LH / 2 + 3.3), 0);
    titleGroup.add(titleRim);

    // ── EXISTING OUTER ARCH / LEGS (kept, material updated) ─────────────────────
    const mainArchGeo = deformGeo(new THREE.TorusGeometry(26, 5.5, 10, 24, Math.PI), 2.8, 11.1);
    const mainArchMesh = new THREE.Mesh(mainArchGeo, archRockMat);
    mainArchMesh.position.set(0, -5, -4);
    portalGroup.add(mainArchMesh);

    const archLegGeo = deformGeo(new THREE.CylinderGeometry(5.0, 7.2, 32, 8), 2.2, 12.2);
    const leftLegMesh = new THREE.Mesh(archLegGeo, archRockMat);
    leftLegMesh.position.set(-26, -18, -4);
    portalGroup.add(leftLegMesh);

    const rightLegMesh = new THREE.Mesh(archLegGeo.clone(), archRockMat);
    rightLegMesh.position.set(26, -18, -4);
    portalGroup.add(rightLegMesh);

    // Concentric glowing energy rings (two rings for depth)
    const outerRingGeo = new THREE.TorusGeometry(18.5, 0.65, 16, 64);
    const outerRingMesh = new THREE.Mesh(outerRingGeo, ruinGlowMat);
    outerRingMesh.position.set(0, 0, -0.2);
    portalGroup.add(outerRingMesh);

    const innerRingGeo = new THREE.TorusGeometry(15.8, 0.35, 12, 48);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, ruinGlowMat);
    innerRingMesh.position.set(0, 0, -0.05);
    portalGroup.add(innerRingMesh);



    // ── ANCIENT RUIN APPROACH — scattered irregular stone slabs (replaces uniform staircase) ──
    // Dark flat slabs at varying angles/heights — like a collapsed underwater temple floor
    const ruinSlabData = [
      { w: 28, h: 2.2, d: 14, x: 0, y: -13, z: 2, ry: 0.04 },
      { w: 20, h: 1.8, d: 10, x: -6, y: -15, z: 6, ry: -0.12 },
      { w: 22, h: 1.8, d: 10, x: 5, y: -16, z: 5, ry: 0.10 },
      { w: 32, h: 2.5, d: 16, x: 0, y: -18, z: 1, ry: 0.02 },
      { w: 16, h: 1.6, d: 9, x: -10, y: -20, z: 8, ry: -0.18 },
      { w: 15, h: 1.6, d: 9, x: 9, y: -21, z: 7, ry: 0.15 },
      { w: 36, h: 2.8, d: 18, x: 0, y: -23, z: 0, ry: -0.03 },
      { w: 14, h: 1.4, d: 8, x: -14, y: -25, z: 10, ry: -0.22 },
      { w: 14, h: 1.4, d: 8, x: 13, y: -26, z: 9, ry: 0.20 },
      { w: 40, h: 3.0, d: 20, x: 0, y: -28, z: -1, ry: 0.01 },
    ];

    const ruinSlabMat = new THREE.MeshStandardMaterial({
      color: 0x050e18,
      roughness: 0.92,
      metalness: 0.18,
      flatShading: true,
    });

    for (const s of ruinSlabData) {
      const slabGeo = new THREE.BoxGeometry(s.w, s.h, s.d);
      // Slightly deform top face vertices for organic broken-edge look
      const slabPos = slabGeo.attributes.position;
      const sv = new THREE.Vector3();
      for (let i = 0; i < slabPos.count; i++) {
        sv.fromBufferAttribute(slabPos, i);
        if (sv.y > 0) {
          sv.x += (Math.random() - 0.5) * 1.4;
          sv.z += (Math.random() - 0.5) * 1.4;
          sv.y += (Math.random() - 0.5) * 0.4;
          slabPos.setXYZ(i, sv.x, sv.y, sv.z);
        }
      }
      slabGeo.computeVertexNormals();
      const slabMesh = new THREE.Mesh(slabGeo, ruinSlabMat);
      slabMesh.position.set(s.x, s.y, s.z);
      slabMesh.rotation.y = s.ry;
      portalGroup.add(slabMesh);
    }

    // Tumbled boulder clusters flanking the ruin approach
    const flankBoulderData = [
      { x: -18, y: -18, z: 10, r: 3.5 }, { x: -22, y: -22, z: 12, r: 4.2 },
      { x: -14, y: -25, z: 8, r: 2.8 }, { x: -26, y: -15, z: 6, r: 3.0 },
      { x: 18, y: -18, z: 10, r: 3.5 }, { x: 22, y: -22, z: 12, r: 4.0 },
      { x: 15, y: -25, z: 8, r: 2.9 }, { x: 26, y: -15, z: 6, r: 3.1 },
      { x: -10, y: -28, z: 14, r: 2.4 }, { x: 10, y: -28, z: 14, r: 2.4 },
    ];
    for (const b of flankBoulderData) {
      const bGeo = deformGeo(new THREE.DodecahedronGeometry(b.r, 1), b.r * 0.28, b.x * 0.07);
      const bMesh = new THREE.Mesh(bGeo, archRockMat);
      bMesh.position.set(b.x, b.y, b.z);
      bMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      portalGroup.add(bMesh);
    }

    // ── FOUNDATION BASE — solid irregular stone mounds (no glowing rims) ────────
    const portalBaseTiers = [
      { rTop: 22, rBot: 30, h: 8.0, y: -32 },
      { rTop: 30, rBot: 40, h: 10.0, y: -40 },
    ];
    for (const tier of portalBaseTiers) {
      const tierGeo = new THREE.CylinderGeometry(tier.rTop, tier.rBot, tier.h, 9);
      const tPos = tierGeo.attributes.position;
      const tv = new THREE.Vector3();
      for (let p = 0; p < tPos.count; p++) {
        tv.fromBufferAttribute(tierGeo.attributes.position, p);
        const d = Math.sin(tv.y * 0.35 + tv.x * 0.18) * 3.0 + Math.cos(tv.z * 0.28) * 2.2;
        tv.x += d; tv.z += d;
        tPos.setXYZ(p, tv.x, tv.y, tv.z);
      }
      tierGeo.computeVertexNormals();
      const tierMesh = new THREE.Mesh(tierGeo, archRockMat);
      tierMesh.position.set(0, tier.y, 0);
      portalGroup.add(tierMesh);
    }

    // ── KELP / SEAWEED STRANDS ───────────────────────────────────────────────────
    for (let k = 0; k < 18; k++) {
      const isRight = k >= 9;
      const kx = (isRight ? 30 : -30) + (Math.random() - 0.5) * 12;
      const kz = (Math.random() - 0.5) * 18;
      const ky = -32 + Math.random() * 8;
      const kelpHeight = 8 + Math.random() * 12;
      const kelpMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.7, kelpHeight, 5),
        new THREE.MeshStandardMaterial({ color: 0x011c2e, roughness: 0.85, flatShading: true })
      );
      kelpMesh.position.set(kx, ky + kelpHeight / 2, kz);
      kelpMesh.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, isRight ? 0.28 : -0.28);
      portalGroup.add(kelpMesh);
    }

    // ── BASE ROCKS around foundation perimeter ───────────────────────────────────
    for (let r = 0; r < 14; r++) {
      const rAngle = (r / 14) * Math.PI * 2;
      const rDist = 32 + Math.random() * 14;
      const rScale = 2.5 + Math.random() * 3.5;
      const baseRockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(rScale, 0), archRockMat);
      baseRockMesh.position.set(Math.cos(rAngle) * rDist, -43 + Math.random() * 5, Math.sin(rAngle) * rDist);
      baseRockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      portalGroup.add(baseRockMesh);
    }

    // ── PORTAL RING (enhanced tube radius) ──────────────────────────────────────
    const portalRingGeo = new THREE.TorusGeometry(14, 2.8, 16, 48);
    const portalRingMesh = new THREE.Mesh(portalRingGeo, ruinStoneMat);
    portalRingMesh.position.set(0, 0, 0);
    portalGroup.add(portalRingMesh);

    // Keystone at top of Portal Ring
    const keystoneGeo = new THREE.BoxGeometry(4.0, 5.0, 3.5);
    const keystone = new THREE.Mesh(keystoneGeo, ruinStoneMat);
    keystone.position.set(0, 14.5, 0);
    portalGroup.add(keystone);

    const keystoneGlyph = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.4), ruinGlowMat);
    keystoneGlyph.position.set(0, 14.5, 1.8);
    portalGroup.add(keystoneGlyph);

    // Occlusion backdrop disc inside ring
    const portalBackdropGeo = new THREE.CircleGeometry(11.7, 48);
    const portalBackdropMat = new THREE.MeshBasicMaterial({ color: 0x04253a, side: THREE.DoubleSide });
    const portalBackdropMesh = new THREE.Mesh(portalBackdropGeo, portalBackdropMat);
    portalBackdropMesh.position.set(0, 0, -0.15);
    portalGroup.add(portalBackdropMesh);

    // Swirling energy vortex shader disc (UNCHANGED)
    const portalDiscGeo = new THREE.CircleGeometry(11.8, 48);
    const portalDiscMat = new THREE.ShaderMaterial({
      vertexShader: portalVortexVertex,
      fragmentShader: portalVortexFragment,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x00f0ff) },
        uColor2: { value: new THREE.Color(0x002266) },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const portalDisc = new THREE.Mesh(portalDiscGeo, portalDiscMat);
    portalDisc.position.set(0, 0, -0.1);
    portalGroup.add(portalDisc);

    // Soft energy blur aura disc
    const portalBlurGeo = new THREE.CircleGeometry(17.5, 48);
    const portalBlurMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - vec2(0.5);
          float dist = length(center) * 2.0;
          float alpha = smoothstep(1.0, 0.0, dist);
          alpha = pow(alpha, 1.6) * 0.85;
          vec3 blurColor = mix(vec3(0.0, 0.92, 1.0), vec3(0.01, 0.08, 0.35), dist);
          gl_FragColor = vec4(blurColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const portalBlurMesh = new THREE.Mesh(portalBlurGeo, portalBlurMat);
    portalBlurMesh.position.set(0, 0, -0.3);
    portalGroup.add(portalBlurMesh);

    portalGroup.renderOrder = 5;
    scene.add(portalGroup);

    let dolphinMixer = null;
    let dolphinMesh = null;
    let dolphinSparkles = null;
    let dolphinLines = null;
    let dolphinSparkleData = [];
    let dolphinPositionsPool = [];
    let dolphinSparklesGeo = null;
    let dolphinSparklesMat = null;
    let dolphinLinesGeo = null;
    let dolphinLinesMat = null;
    let dolphinLinePositions = null;
    let dolphinLineColors = null;

    let allFishSchools = [];

    const dolphinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x102232,
      emissive: 0x020a12,
      emissiveIntensity: 0.2,
      roughness: 0.22,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      ior: 1.33,
    });

    let GLTFLoaderClass = null;
    let DRACOLoaderClass = null;
    try {
      GLTFLoaderClass = require("three/examples/jsm/loaders/GLTFLoader.js").GLTFLoader;
      DRACOLoaderClass = require("three/examples/jsm/loaders/DRACOLoader.js").DRACOLoader;
    } catch (e) {
      try {
        GLTFLoaderClass = require("three/addons/loaders/GLTFLoader.js").GLTFLoader;
        DRACOLoaderClass = require("three/addons/loaders/DRACOLoader.js").DRACOLoader;
      } catch (err) { }
    }

    let cloneSkeleton = null;
    try {
      const skMod = require("three/examples/jsm/utils/SkeletonUtils.js");
      cloneSkeleton = skMod.clone || (skMod.SkeletonUtils && skMod.SkeletonUtils.clone);
    } catch (e) {
      try {
        const skMod = require("three/addons/utils/SkeletonUtils.js");
        cloneSkeleton = skMod.clone || (skMod.SkeletonUtils && skMod.SkeletonUtils.clone);
      } catch (err) { }
    }

    const allDolphins = [];

    function setupDolphinInstance(parentGroup, gltf, scale = 1.8, phaseOffset = 0, isPortal = false) {
      const dGroup = new THREE.Group();
      parentGroup.add(dGroup);

      let dModel;
      if (cloneSkeleton) {
        dModel = cloneSkeleton(gltf.scene);
      } else {
        dModel = gltf.scene.clone(true);
      }
      dModel.scale.setScalar(scale);
      dGroup.add(dModel);

      let dMesh = null;
      dModel.traverse((child) => {
        if (child.isMesh) {
          const origMat = child.material;
          const origMap = origMat ? origMat.map : null;
          child.material = new THREE.MeshPhysicalMaterial({
            color: origMap ? 0x999999 : 0x102232,
            map: origMap,
            emissive: 0x020d18,
            emissiveIntensity: 0.2,
            roughness: 0.22,
            metalness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
          });
        }
        if (child.isSkinnedMesh) {
          dMesh = child;
        }
      });

      let dMixer = null;
      if (gltf.animations && gltf.animations.length > 0) {
        dMixer = new THREE.AnimationMixer(dModel);
        const action = dMixer.clipAction(gltf.animations[0]);
        action.time = phaseOffset * 2.5;
        action.play();
      }

      const dolphinObj = {
        group: dGroup,
        mesh: dMesh,
        mixer: dMixer,
        phaseOffset,
        isPortal,
      };
      allDolphins.push(dolphinObj);
      return dolphinObj;
    }

    function setupFishSchoolInstance(parentGroup, gltf, x, y, z, scale = 1.5, phaseOffset = 0) {
      const fGroup = new THREE.Group();
      fGroup.position.set(x, y, z);
      parentGroup.add(fGroup);

      const direction = Math.random() > 0.5 ? 1 : -1;
      const baseRotY = direction > 0 ? (Math.PI / 2) : (-Math.PI / 2);

      let fModel;
      if (cloneSkeleton) {
        fModel = cloneSkeleton(gltf.scene);
      } else {
        fModel = gltf.scene.clone(true);
      }
      fModel.scale.setScalar(scale);
      fModel.rotation.y = baseRotY;
      fGroup.add(fModel);

      let fMixer = null;
      if (gltf.animations && gltf.animations.length > 0) {
        fMixer = new THREE.AnimationMixer(fModel);
        const action = fMixer.clipAction(gltf.animations[0]);
        action.time = phaseOffset * 2.5;
        action.play();
      }

      allFishSchools.push({
        group: fGroup,
        mixer: fMixer,
        baseY: y,
        baseZ: z,
        direction: direction,
        baseRotY: baseRotY,
        speed: 5.0 + Math.random() * 5.0,
        offset: Math.random() * Math.PI * 2
      });
    }

    // Parsed from the already-downloaded buffer (no second network request), and the
    // single parsed gltf is reused for all three pod members rather than re-loaded.
    function buildDolphinsFromBuffer(arrayBuffer) {
      return new Promise((resolve) => {
        if (!GLTFLoaderClass || !arrayBuffer) return resolve(false);
        const gltfLoader = new GLTFLoaderClass(manager);
        if (DRACOLoaderClass) {
          const dracoLoader = new DRACOLoaderClass();
          dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
          gltfLoader.setDRACOLoader(dracoLoader);
        }
        gltfLoader.parse(
          arrayBuffer,
          "",
          (gltf) => {
            // Dolphin pod swimming in the open canyon between Event 2 and Event 3
            setupDolphinInstance(newWorldGroup, gltf, 4.5, 0.0, false);
            setupDolphinInstance(newWorldGroup, gltf, 3.8, 0.33, false);
            setupDolphinInstance(newWorldGroup, gltf, 3.2, 0.66, false);
            resolve(true);
          },
          (err) => {
            console.error("[Aquasaga] dolphin model parse failed:", err);
            resolve(false); // scene stays usable without the pod
          }
        );
      });
    }

    function buildFishSchoolFromBuffer(arrayBuffer) {
      return new Promise((resolve) => {
        if (!GLTFLoaderClass || !arrayBuffer) return resolve(false);
        const gltfLoader = new GLTFLoaderClass(manager);
        if (DRACOLoaderClass) {
          const dracoLoader = new DRACOLoaderClass();
          dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
          gltfLoader.setDRACOLoader(dracoLoader);
        }
        gltfLoader.parse(
          arrayBuffer,
          "",
          (gltf) => {
            // Fix untextured meshes due to deprecated KHR_materials_pbrSpecularGlossiness
            const textureLoader = new THREE.TextureLoader(manager);
            const texPaths = [
              "/assets/models/textures/gltf_embedded_0.webp",
              "/assets/models/textures/gltf_embedded_5.webp",
              "/assets/models/textures/gltf_embedded_9.webp",
              "/assets/models/textures/gltf_embedded_13.webp"
            ];
            const textures = texPaths.map(path => {
              const tex = textureLoader.load(path);
              tex.flipY = true;
              tex.colorSpace = THREE.SRGBColorSpace;
              return tex;
            });

            let meshIndex = 0;
            gltf.scene.traverse((child) => {
              if (child.isMesh && textures[meshIndex]) {
                child.material = new THREE.MeshStandardMaterial({
                  map: textures[meshIndex],
                  roughness: 0.7,
                  metalness: 0.1,
                  transparent: true,
                  alphaTest: 0.1,
                  side: THREE.DoubleSide
                });
                meshIndex++;
              }
            });

            // Generate 15 fish schools for the upper ocean (visible immediately)
            for (let i = 0; i < 15; i++) {
              const startZ = -20 - Math.random() * 120;  // Upper ocean z spread
              const startX = -60 + Math.random() * 120;  // Spread horizontally
              const startY = -25 - Math.random() * 30;   // Keep them strictly underwater
              const scale = 0.3 + Math.random() * 0.5;   // Smaller at surface
              const phase = Math.random() * 5;

              setupFishSchoolInstance(scene, gltf, startX, startY, startZ, scale, phase);
            }

            // Generate 15 fish schools for the deep canyon (visible after scrolling down)
            for (let i = 0; i < 15; i++) {
              const startZ = -200 - Math.random() * 800; // Spread from z: -200 to -1000
              const startX = -40 + Math.random() * 80;   // Spread horizontally
              const startY = -60 - Math.random() * 150;  // Deep down
              const scale = 0.4 + Math.random() * 0.6;   // Smaller in deep
              const phase = Math.random() * 5;

              setupFishSchoolInstance(newWorldGroup, gltf, startX, startY, startZ, scale, phase);
            }

            resolve(true);
          },
          (err) => {
            console.error("[Aquasaga] fish school model parse failed:", err);
            resolve(false);
          }
        );
      });
    }

    // --- FLOW FIELD WATER PARTICLES ---
    const flowFieldCount = isMobile ? 1800 : 4200;
    const flowFieldPositions = new Float32Array(flowFieldCount * 3);
    const flowFieldVelocities = new Float32Array(flowFieldCount * 3);
    const flowFieldSizes = new Float32Array(flowFieldCount);
    const flowFieldAlphas = new Float32Array(flowFieldCount);
    const flowFieldTypes = new Float32Array(flowFieldCount);

    for (let i = 0; i < flowFieldCount; i++) {
      const i3 = i * 3;
      flowFieldPositions[i3] = (Math.random() - 0.5) * 320;
      flowFieldPositions[i3 + 1] = -520 + Math.random() * 540;
      flowFieldPositions[i3 + 2] = -30 - Math.random() * 990;

      flowFieldVelocities[i3] = (Math.random() - 0.5) * 0.1;
      flowFieldVelocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      flowFieldVelocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      flowFieldTypes[i] = Math.random();
      flowFieldSizes[i] = Math.random() < 0.7 ? 1.2 + Math.random() * 2.0 : 3.2 + Math.random() * 3.5;
      flowFieldAlphas[i] = 0.35 + Math.random() * 0.55;
    }

    const flowFieldGeo = new THREE.BufferGeometry();
    flowFieldGeo.setAttribute("position", new THREE.BufferAttribute(flowFieldPositions, 3));
    flowFieldGeo.setAttribute("velocity", new THREE.BufferAttribute(flowFieldVelocities, 3));
    flowFieldGeo.setAttribute("size", new THREE.BufferAttribute(flowFieldSizes, 1));
    flowFieldGeo.setAttribute("alpha", new THREE.BufferAttribute(flowFieldAlphas, 1));
    flowFieldGeo.setAttribute("particleType", new THREE.BufferAttribute(flowFieldTypes, 1));

    const flowFieldMat = new THREE.ShaderMaterial({
      vertexShader: flowFieldVertex,
      fragmentShader: flowFieldFragment,
      uniforms: {
        uColor: { value: new THREE.Color(0x00ddff) },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const flowFieldMesh = new THREE.Points(flowFieldGeo, flowFieldMat);
    scene.add(flowFieldMesh);

    // --- THE NEW WORLD BEYOND THE MAIN STARGATE: INVISIBLE UNTIL ENTERING STARGATE (z < -155) ---
    // Features 10 DISTINCT DESCENDING ROCK PLATFORMS, PORTALS & 3D EVENT BANNERS
    const newWorldGroup = new THREE.Group();
    newWorldGroup.visible = true; // Kept visible always to ensure assets compile/render from start
    scene.add(newWorldGroup);

    const cliffRockMat = new THREE.MeshStandardMaterial({
      color: 0x051d2c,
      emissive: 0x010b14,
      emissiveIntensity: 0.15,
      roughness: 0.74,
      metalness: 0.24,
      flatShading: true,
    });

    const stairStoneMat = new THREE.MeshStandardMaterial({
      color: 0x041926,
      emissive: 0x010b14,
      emissiveIntensity: 0.1,
      roughness: 0.7,
      metalness: 0.28,
      flatShading: true,
    });

    // Multi-tone glowing crystal materials (cyan, purple/pink, warm amber) matching reference image
    const cyanCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x003b64,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.3,
      flatShading: true,
    });

    const mineralAccentMat = new THREE.MeshStandardMaterial({
      color: 0x35134e,
      emissive: 0xda70ff,
      emissiveIntensity: 1.45,
      roughness: 0.24,
      metalness: 0.34,
      flatShading: true,
    });

    const cliffMeshes = [];
    const bannerMeshes = [];
    const infoMeshes = [];
    const crystalShrineMeshes = [];
    const eventBannerGroups = {};
    const postPortalHologramGroups = [];
    const postPortalMineralGroups = [];
    // Shared post-portal presentation envelope, in local event coordinates.
    // Shrine/cage top: 10.7, poster underside: 14.2 — leaving a deliberate 3.5 unit air gap.
    const posterAnchorY = 17.8;

    const causticUniforms = { uTime: { value: 0 } };
    const causticMat = new THREE.ShaderMaterial({
      uniforms: causticUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv * 6.0;
          float waveA = sin(uv.x * 2.1 + uTime * 0.35) + sin(uv.y * 2.6 - uTime * 0.27);
          float waveB = sin((uv.x + uv.y) * 2.8 + uTime * 0.22);
          float caustic = smoothstep(1.48, 1.88, waveA + waveB * 0.7);
          float edgeFade = smoothstep(0.0, 0.18, vUv.x) * smoothstep(0.0, 0.18, 1.0 - vUv.x)
            * smoothstep(0.0, 0.18, vUv.y) * smoothstep(0.0, 0.18, 1.0 - vUv.y);
          gl_FragColor = vec4(0.16, 0.84, 1.0, caustic * edgeFade * 0.2);
        }
      `,
    });

    const shaftUniforms = { uTime: { value: 0 } };
    const lightShaftMat = new THREE.ShaderMaterial({
      uniforms: shaftUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float width = smoothstep(0.0, 0.28, vUv.x) * smoothstep(0.0, 0.28, 1.0 - vUv.x);
          float falloff = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
          float drift = 0.7 + sin(uTime * 0.15 + vUv.y * 7.0) * 0.12;
          gl_FragColor = vec4(0.17, 0.72, 1.0, width * falloff * drift * 0.075);
        }
      `,
    });

    const createHologramTexture = (label, detail = "LINKED") => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 288;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(1, 21, 40, 0.62)";
      ctx.fillRect(10, 10, 492, 268);
      ctx.strokeStyle = "rgba(62, 231, 244, 0.8)";
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, 492, 268);
      ctx.fillStyle = "rgba(88, 241, 245, 0.12)";
      for (let row = 34; row < 255; row += 20) ctx.fillRect(26, row, 460, 1);
      ctx.shadowColor = "#00e6ef";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#76f6f5";
      ctx.font = "700 28px monospace";
      ctx.fillText(label, 28, 54);
      ctx.shadowBlur = 0;
      ctx.font = "600 16px monospace";
      ctx.fillStyle = "rgba(139, 246, 246, 0.78)";
      ["node.status  / active", "signal.depth / stable", `protocol     / ${detail}`].forEach((line, index) => {
        ctx.fillText(line, 28, 104 + index * 28);
      });
      ctx.strokeStyle = "rgba(204, 121, 255, 0.8)";
      ctx.strokeRect(412, 176, 54, 54);
      ctx.beginPath(); ctx.moveTo(426, 214); ctx.lineTo(438, 188); ctx.lineTo(452, 214); ctx.closePath(); ctx.stroke();
      return new THREE.CanvasTexture(canvas);
    };

    // Construct each distinct Event Location matching Image 2 target reference with mirrored sideSign offsets
    function createEventPlatformAndBanner(node) {
      const { x, y, z } = node.pos;
      const eventGroup = new THREE.Group();
      eventGroup.position.set(x, y, z);

      // Determine event side: -1 for left side (x < 0), +1 for right side (x > 0)
      const sideSign = x < 0 ? -1 : (x > 0 ? 1 : (parseInt(node.num, 10) % 2 === 0 ? 1 : -1));

      // Structural variation per event so each location feels like a unique miniature destination
      const eventIdx = parseInt(node.num, 10) || 1;
      const stairCurvature = sideSign * 0.16;
      const altarScale = 1.0 + (eventIdx % 3) * 0.08;

      // 1. Secondary Background Cliff Mountain (Omitted so no tall background rock spires obstruct camera viewing)
      const bVec = new THREE.Vector3();

      // 2. Main Terraced Low-Poly Faceted Rock Formation (Centered at eventGroup origin)
      const isEvent1 = node.id === "event-1";
      const rockHeight = isEvent1 ? 120 : (node.id === "event-5" ? 16 : (node.id === "event-7" ? 28 : 20));
      const rockBotRad = isEvent1 ? 32 * altarScale : 24 * altarScale;
      const lowerRockGeo = new THREE.CylinderGeometry(18 * altarScale, rockBotRad, rockHeight, 12, 5);
      const lrPos = lowerRockGeo.attributes.position;
      for (let i = 0; i < lrPos.count; i++) {
        bVec.fromBufferAttribute(lowerRockGeo.attributes.position, i);
        const facetNoise = Math.sin(bVec.y * 0.16 + bVec.x * 0.22) * 3.2 + Math.cos(bVec.z * 0.25) * 2.5;
        const rad = Math.sqrt(bVec.x * bVec.x + bVec.z * bVec.z);
        if (rad > 0.1) {
          bVec.x += (bVec.x / rad) * facetNoise;
          bVec.z += (bVec.z / rad) * facetNoise;
        }
        lrPos.setXYZ(i, bVec.x, bVec.y, bVec.z);
      }
      lowerRockGeo.computeVertexNormals();

      const lowerRockMesh = new THREE.Mesh(lowerRockGeo, cliffRockMat);
      lowerRockMesh.position.set(0, isEvent1 ? -58 : -8, 0);
      eventGroup.add(lowerRockMesh);
      cliffMeshes.push(lowerRockMesh);

      const platformCaustic = new THREE.Mesh(new THREE.CircleGeometry(15, 12), causticMat);
      platformCaustic.rotation.x = -Math.PI / 2;
      platformCaustic.position.set(0, 2.16, 0);
      eventGroup.add(platformCaustic);

      // TECH TALK SPECIAL: Grand Hollow Underwater Cavern Grotto / Cave Hole Archway
      if (node.id === "event-5") {
        const techCaveArchGeo = new THREE.TorusGeometry(18, 5.0, 10, 24, Math.PI * 1.15);
        const techArchMesh = new THREE.Mesh(techCaveArchGeo, cliffRockMat);
        techArchMesh.position.set(0, 12, -2);
        techArchMesh.rotation.z = Math.PI * 0.08;
        eventGroup.add(techArchMesh);

        const techCaveDiscGeo = new THREE.CircleGeometry(16, 24);
        const techCaveDiscMat = new THREE.MeshStandardMaterial({
          color: 0x011526,
          emissive: 0x003855,
          emissiveIntensity: 0.8,
          roughness: 0.4,
          side: THREE.DoubleSide,
        });
        const techCaveDiscMesh = new THREE.Mesh(techCaveDiscGeo, techCaveDiscMat);
        techCaveDiscMesh.position.set(0, 12, -5);
        eventGroup.add(techCaveDiscMesh);

      }

      // Upper Terraced Plateau (Omitted for Tech Talk so no rock structure sits above it)
      if (node.id !== "event-5") {
        const upperTerraceGeo = new THREE.CylinderGeometry(9, 14, 10, 10, 2);
        const utPos = upperTerraceGeo.attributes.position;
        for (let i = 0; i < utPos.count; i++) {
          bVec.fromBufferAttribute(upperTerraceGeo.attributes.position, i);
          const noise = Math.sin(bVec.x * 0.28) * Math.cos(bVec.z * 0.28) * 2.0;
          bVec.x += noise;
          bVec.z += noise;
          utPos.setXYZ(i, bVec.x, bVec.y, bVec.z);
        }
        upperTerraceGeo.computeVertexNormals();

        const upperTerraceMesh = new THREE.Mesh(upperTerraceGeo, cliffRockMat);
        upperTerraceMesh.position.set(sideSign * 12, 7, -4);
        eventGroup.add(upperTerraceMesh);
      }

      // 3. Carved Low-Poly Staircase (Curving up front face of rock mound)
      const numSteps = 8;
      const stepWidth = 8.0;
      const stepHeight = 1.1;
      const stepDepth = 2.0;
      for (let s = 0; s < numSteps; s++) {
        const stepGeo = new THREE.BoxGeometry(stepWidth - s * 0.4, stepHeight, stepDepth);
        const stepMesh = new THREE.Mesh(stepGeo, stairStoneMat);
        const angle = -0.3 + s * stairCurvature;
        const radius = 11.5 - s * 1.0;
        stepMesh.position.set(
          sideSign * (Math.sin(angle) * radius),
          -14.0 + s * stepHeight,
          6 + Math.cos(angle) * radius
        );
        stepMesh.rotation.y = sideSign * (angle + 0.35);
        eventGroup.add(stepMesh);
      }

      // 4. Main Central Glowing Crystal Orb Shrine (Centered on top of rock mound)
      const mainShrineGroup = new THREE.Group();
      mainShrineGroup.position.set(0, 4, 0);

      // Rock Cradle Altar Base
      const altarBaseGeo = new THREE.CylinderGeometry(4.5, 6.0, 3.0, 8);
      const altarMesh = new THREE.Mesh(altarBaseGeo, cliffRockMat);
      mainShrineGroup.add(altarMesh);

      // Inner Glowing Crystal Orb
      const orbGeo = new THREE.IcosahedronGeometry(3.0, 1);
      const orbMesh = new THREE.Mesh(orbGeo, cyanCrystalMat);
      orbMesh.position.set(0, 3.2, 0);
      orbMesh.userData = { eventData: node };
      mainShrineGroup.add(orbMesh);

      // Outer Wireframe Gem Ring surrounding main orb
      const wireGeo = new THREE.IcosahedronGeometry(3.5, 1);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      wireMesh.position.set(0, 3.2, 0);
      mainShrineGroup.add(wireMesh);

      const shrineCaustic = new THREE.Mesh(new THREE.CircleGeometry(4.2, 10), causticMat);
      shrineCaustic.rotation.x = -Math.PI / 2;
      shrineCaustic.position.set(0, 1.56, 0);
      shrineCaustic.scale.setScalar(0.72);
      mainShrineGroup.add(shrineCaustic);

      // Strong Directional PointLight from main shrine
      const mainShrineLight = new THREE.PointLight(0x00f0ff, 8.0, 40);
      mainShrineLight.position.set(0, 4.5, 0);
      mainShrineGroup.add(mainShrineLight);

      eventGroup.add(mainShrineGroup);
      crystalShrineMeshes.push(orbMesh);

      // 5. Upper Terrace Crystal Altar
      const upperShrineGroup = new THREE.Group();
      // Keep the existing upper crystal visible as a clearly floating side accent,
      // outside the upper terrace and below the poster envelope.
      upperShrineGroup.position.set(sideSign * 27, 7, -4);
      const upperOrbGeo = new THREE.OctahedronGeometry(2.0, 1);
      const upperOrbMesh = new THREE.Mesh(upperOrbGeo, cyanCrystalMat);
      upperShrineGroup.add(upperOrbMesh);
      const upperLight = new THREE.PointLight(0x00f0ff, 4.0, 25);
      upperLight.position.set(0, 1.0, 0);
      upperShrineGroup.add(upperLight);
      eventGroup.add(upperShrineGroup);

      // A single non-conical, reference-inspired mineral branch cluster for Coding.
      // Flat-capped five-sided prisms preserve the faceted look without cone silhouettes.
      if (node.id === "event-1") {
        const mineralCluster = new THREE.Group();
        mineralCluster.position.set(-17, 2.35, 5);
        const branchSpecs = [
          { pos: [0, 2.1, 0], height: 4.2, bottom: 0.48, top: 0.28, rot: [0.08, 0.22, -0.08], mat: cyanCrystalMat },
          { pos: [-1.25, 1.55, 0.25], height: 3.1, bottom: 0.42, top: 0.23, rot: [-0.24, 0.44, 0.52], mat: cyanCrystalMat },
          { pos: [1.15, 1.4, -0.15], height: 2.8, bottom: 0.38, top: 0.22, rot: [0.28, -0.38, -0.58], mat: mineralAccentMat },
          { pos: [0.48, 2.65, -0.45], height: 5.1, bottom: 0.39, top: 0.2, rot: [0.22, 0.6, -0.28], mat: cyanCrystalMat },
          { pos: [-0.55, 1.25, -0.9], height: 2.5, bottom: 0.34, top: 0.19, rot: [-0.4, -0.35, 0.7], mat: mineralAccentMat },
          { pos: [1.7, 1.0, 0.55], height: 2.0, bottom: 0.3, top: 0.17, rot: [0.12, 0.2, -0.9], mat: cyanCrystalMat },
        ];
        branchSpecs.forEach((branch) => {
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(branch.top, branch.bottom, branch.height, 5, 1),
            branch.mat
          );
          stem.position.set(...branch.pos);
          stem.rotation.set(...branch.rot);
          mineralCluster.add(stem);
        });
        const clusterLight = new THREE.PointLight(0x5df1f0, 1.7, 15);
        clusterLight.position.set(0, 2.2, 0);
        mineralCluster.add(clusterLight);
        eventGroup.add(mineralCluster);
      }



      newWorldGroup.add(eventGroup);

      // 8. Futuristic Holographic Event Title Plaque (Centered directly over crystal shrine)
      const bannerGroup = new THREE.Group();
      bannerGroup.position.set(x, y + posterAnchorY, z);
      bannerGroup.rotation.y = 0;

      //    Map each event to its logo PNG and intrinsic aspect ratio (width / height)
      const logoConfig = {
        "event-1": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802488/coding.png",
          aspect: 3.0,
        },
        "event-2": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802485/webdesigning.png",
          aspect: 3.0,
        },
        "event-3": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802490/itquiz.png",
          aspect: 2.6036,
        },
        "event-4": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802491/gaming.png",
          aspect: 2.849,
        },
        "event-5": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802515/techtalk.png",
          aspect: 2.666,
        },
        "event-6": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802513/surpriseevent.png",
          aspect: 3.0,
        },
        "event-7": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802487/itmanager.png",
          aspect: 2.674,
        },
        "event-8": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802510/startup.png",
          aspect: 3.0,
        },
        "event-9": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802490/fashion.png",
          aspect: 2100 / 749,
        },
        "event-10": {
          src: "https://res.cloudinary.com/zuxdlzob/image/upload/v1787802512/photography.png",
          aspect: 3.0,
        },
      };

      let bannerTexture;
      if (logoConfig[node.id]) {
        bannerTexture = new THREE.TextureLoader().load(logoConfig[node.id].src);
        bannerTexture.colorSpace = THREE.SRGBColorSpace;
      } else {
        bannerTexture = createEventBannerTexture(node);
      }
      if (renderer) {
        bannerTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }

      const bannerMat = new THREE.MeshBasicMaterial({
        map: bannerTexture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
        alphaTest: 0.05,
      });

      const bannerWidth = logoConfig[node.id] ? 7.2 * logoConfig[node.id].aspect : 18.4;
      const bannerPlaneGeo = new THREE.PlaneGeometry(bannerWidth, 7.2);
      const bannerMesh = new THREE.Mesh(bannerPlaneGeo, bannerMat);
      bannerMesh.userData = { eventData: node };
      bannerGroup.add(bannerMesh);
      bannerMeshes.push(bannerMesh);

      // Info 'i' Icon Badge at top-right of poster
      const infoCanvas = document.createElement("canvas");
      infoCanvas.width = 128;
      infoCanvas.height = 128;
      const iCtx = infoCanvas.getContext("2d");
      iCtx.beginPath();
      iCtx.arc(64, 64, 56, 0, Math.PI * 2);
      iCtx.strokeStyle = "#00f0ff";
      iCtx.lineWidth = 6;
      iCtx.stroke();
      iCtx.fillStyle = "rgba(0, 240, 255, 0.2)";
      iCtx.fill();
      iCtx.shadowColor = "#00f0ff";
      iCtx.shadowBlur = 10;
      iCtx.fillStyle = "#ffffff";
      iCtx.font = "bold 72px monospace";
      iCtx.textAlign = "center";
      iCtx.textBaseline = "middle";
      iCtx.fillText("i", 64, 68);
      const infoTex = new THREE.CanvasTexture(infoCanvas);
      const infoMat = new THREE.MeshBasicMaterial({ map: infoTex, transparent: true, side: THREE.DoubleSide });
      const infoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), infoMat);
      infoMesh.position.set(bannerWidth / 2 - 0.2, 3.6, 0.2); // Top-right corner
      infoMesh.userData = { eventData: node };
      bannerGroup.add(infoMesh);
      infoMeshes.push(infoMesh);

      // Glowing Vertical Energy Tether Beam connecting plaque base to crystal shrine
      const tetherGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
      const tetherMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.8,
        transparent: true,
        opacity: 0.65,
      });
      const tetherMesh = new THREE.Mesh(tetherGeo, tetherMat);
      tetherMesh.position.set(0, -4.8, 0);
      bannerGroup.add(tetherMesh);

      // Top Floating Holographic Diamond Marker above plaque
      const topDiamondGeo = new THREE.OctahedronGeometry(0.42, 0);
      const topDiamondMesh = new THREE.Mesh(topDiamondGeo, cyanCrystalMat);
      topDiamondMesh.position.set(0, 4.35, 0);
      bannerGroup.add(topDiamondMesh);

      // Bottom Floating Holographic Diamond Marker under tether beam
      const botDiamondGeo = new THREE.OctahedronGeometry(0.35, 0);
      const botDiamondMesh = new THREE.Mesh(botDiamondGeo, cyanCrystalMat);
      botDiamondMesh.position.set(0, -6.6, 0);
      bannerGroup.add(botDiamondMesh);

      const posterLight = new THREE.PointLight(0x00f0ff, 3.5, 30);
      posterLight.position.set(0, 0, 1.5);
      bannerGroup.add(posterLight);

      newWorldGroup.add(bannerGroup);
      eventBannerGroups[node.id] = bannerGroup;
    }

    eventNodes.forEach((node) => {
      createEventPlatformAndBanner(node);
    });

    // Distant, post-portal atmosphere only. These occupy open background space
    // and stay outside all event poster/shrine composition envelopes.
    const lightShaftGroup = new THREE.Group();
    [
      [-82, -72, -350, -0.16], [78, -118, -470, 0.12], [-86, -185, -650, -0.1],
      [86, -250, -790, 0.14], [-90, -330, -960, -0.12], [82, -400, -1110, 0.1],
    ].forEach(([shaftX, shaftY, shaftZ, rotation]) => {
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(10, 88), lightShaftMat);
      shaft.position.set(shaftX, shaftY, shaftZ);
      shaft.rotation.z = rotation;
      lightShaftGroup.add(shaft);
    });
    newWorldGroup.add(lightShaftGroup);

    const vortexGroup = new THREE.Group();
    vortexGroup.position.set(104, -270, -885);
    [
      { color: 0x36e7f2, offset: 0, scale: 1 },
      { color: 0xc77dff, offset: Math.PI, scale: 0.78 },
      { color: 0x3298ff, offset: Math.PI * 0.5, scale: 1.18 },
    ].forEach((spiral) => {
      const points = [];
      for (let pointIndex = 0; pointIndex < 88; pointIndex++) {
        const progress = pointIndex / 87;
        const angle = spiral.offset + progress * Math.PI * 6.2;
        const radius = (1.5 + progress * 13) * spiral.scale;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, progress * 0.3));
      }
      const spiralLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: spiral.color, transparent: true, opacity: 0.28 })
      );
      vortexGroup.add(spiralLine);
    });
    vortexGroup.add(new THREE.PointLight(0x5169ff, 1.2, 48));
    newWorldGroup.add(vortexGroup);
    postPortalMineralGroups.push(vortexGroup);

    // --- DARK TEAL SEA GRASS / KELP FRONDS ---
    const kelpGroup = new THREE.Group();
    const kelpGeo = new THREE.CylinderGeometry(0.15, 0.45, 18, 8, 8);
    const kelpMat = new THREE.MeshStandardMaterial({
      color: 0x02364c,
      emissive: 0x005577,
      emissiveIntensity: 0.3,
      roughness: 0.6,
      flatShading: true,
    });

    const kelpInstances = [];
    const kelpPositions = [
      { x: -35, z: -230 }, { x: -20, z: -235 }, { x: 35, z: -320 },
      { x: 20, z: -325 }, { x: -35, z: -410 }, { x: -20, z: -415 },
      { x: 35, z: -500 }, { x: 20, z: -505 }, { x: -10, z: -590 }, { x: 10, z: -595 },
    ];

    for (let i = 0; i < kelpPositions.length; i++) {
      const kelp = new THREE.Mesh(kelpGeo, kelpMat);
      const pos = kelpPositions[i];
      const hScale = 0.8 + Math.random() * 0.8;
      kelp.scale.set(1, hScale, 1);
      kelp.position.set(pos.x, -370 + (hScale * 9), pos.z);
      kelpGroup.add(kelp);
      kelpInstances.push({
        mesh: kelp,
        phase: Math.random() * Math.PI * 2,
        speed: 1.0 + Math.random() * 1.2,
      });
    }
    scene.add(kelpGroup);

    // --- UNEVEN OCEAN FLOOR TERRAIN WITH MOUNTAIN GROUND BASES ---
    const terrainGeo = new THREE.PlaneGeometry(800, 1000, 128, 128);
    terrainGeo.rotateX(-Math.PI / 2);
    const terPos = terrainGeo.attributes.position;
    const terVec = new THREE.Vector3();
    for (let i = 0; i < terPos.count; i++) {
      terVec.fromBufferAttribute(terrainGeo.attributes.position, i);
      let height =
        Math.sin(terVec.x * 0.02) * Math.cos(terVec.z * 0.02) * 22.0 +
        Math.sin(terVec.x * 0.06 + terVec.z * 0.05) * 8.0;

      // Add ground mountain mounds under each event platform
      for (const ev of eventNodes) {
        const dx = terVec.x - ev.pos.x;
        const dz = terVec.z - ev.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 90) {
          const moundFactor = (1.0 - dist / 90);
          const moundHeight = Math.pow(moundFactor, 1.5) * Math.abs(ev.pos.y - (-385)) * 0.35;
          height += moundHeight;
        }
      }

      terVec.y = height;
      terPos.setXYZ(i, terVec.x, terVec.y, terVec.z);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x031828,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, -385, -450);
    scene.add(terrainMesh);



    // --- RISING BUBBLES PARTICLE STREAM ---
    const bubbleCount = isMobile ? 6000 : 15000;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubbleInitialPos = new Float32Array(bubbleCount * 3);
    const bubbleSizes = new Float32Array(bubbleCount);
    const bubbleSpeeds = new Float32Array(bubbleCount);
    const bubbleOffsets = new Float32Array(bubbleCount);

    for (let i = 0; i < bubbleCount; i++) {
      const zPos = -20 - Math.random() * 1350;
      const expectedY = (zPos / -1218) * -470;
      bubbleInitialPos[i * 3] = (Math.random() - 0.5) * 450;
      // Clamp to -85 to ensure that even as bubbles rise 80 units in the shader, they stay below water (Y=-2)
      bubbleInitialPos[i * 3 + 1] = Math.min(-85.0, expectedY + (Math.random() - 0.5) * 200);
      bubbleInitialPos[i * 3 + 2] = zPos;

      bubbleSizes[i] = 3.0 + Math.random() * 10.0;
      bubbleSpeeds[i] = 0.4 + Math.random() * 1.4;
      bubbleOffsets[i] = Math.random() * 100.0;
    }

    bubbleGeo.setAttribute("position", new THREE.BufferAttribute(bubbleInitialPos, 3));
    bubbleGeo.setAttribute("aInitialPos", new THREE.BufferAttribute(bubbleInitialPos, 3));
    bubbleGeo.setAttribute("aSize", new THREE.BufferAttribute(bubbleSizes, 1));
    bubbleGeo.setAttribute("aSpeed", new THREE.BufferAttribute(bubbleSpeeds, 1));
    bubbleGeo.setAttribute("aOffset", new THREE.BufferAttribute(bubbleOffsets, 1));

    const bubbleMat = new THREE.ShaderMaterial({
      vertexShader: bubbleVertex,
      fragmentShader: bubbleFragment,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib["fog"],
        {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uColor: { value: new THREE.Color(0x67e8f9) },
        }
      ]),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true
    });

    const bubblePoints = new THREE.Points(bubbleGeo, bubbleMat);
    bubblePoints.frustumCulled = false;
    scene.add(bubblePoints);

    // --- SHINING WATER PARTICLES (twinkling light-catching motes) ---
    const shimmerCount = isMobile ? 900 : 2200;
    const shimmerGeo = new THREE.BufferGeometry();
    const shimmerPositions = new Float32Array(shimmerCount * 3);
    const shimmerSizes = new Float32Array(shimmerCount);
    const shimmerPhases = new Float32Array(shimmerCount);
    const shimmerSpeeds = new Float32Array(shimmerCount);

    for (let i = 0; i < shimmerCount; i++) {
      shimmerPositions[i * 3] = (Math.random() - 0.5) * 420;
      shimmerPositions[i * 3 + 1] = -520 + Math.random() * 470;
      shimmerPositions[i * 3 + 2] = -20 - Math.random() * 980;

      shimmerSizes[i] = 1.5 + Math.random() * 4.0;
      shimmerPhases[i] = Math.random();
      shimmerSpeeds[i] = 0.5 + Math.random() * 1.2;
    }

    shimmerGeo.setAttribute("position", new THREE.BufferAttribute(shimmerPositions, 3));
    shimmerGeo.setAttribute("aSize", new THREE.BufferAttribute(shimmerSizes, 1));
    shimmerGeo.setAttribute("aPhase", new THREE.BufferAttribute(shimmerPhases, 1));
    shimmerGeo.setAttribute("aSpeed", new THREE.BufferAttribute(shimmerSpeeds, 1));

    const shimmerMat = new THREE.ShaderMaterial({
      vertexShader: shimmerVertex,
      fragmentShader: shimmerFragment,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x9beeff) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const shimmerMesh = new THREE.Points(shimmerGeo, shimmerMat);
    scene.add(shimmerMesh);

    // --- FLOATING UNDERWATER DUST & PLANKTON ---
    const dustCount = isMobile ? 1600 : 4000;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = new Float32Array(dustCount * 3);
    const dustSizes = new Float32Array(dustCount);
    const dustAlphas = new Float32Array(dustCount);
    const dustTypes = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      const zPos = -30 - Math.random() * 1350;
      const expectedY = (zPos / -1218) * -470;
      dustPositions[i * 3] = (Math.random() - 0.5) * 320;
      dustPositions[i * 3 + 1] = -385 + Math.random() * 335;
      dustPositions[i * 3 + 2] = -30 - Math.random() * 620;
      dustPositions[i * 3 + 1] = Math.min(-5.0, expectedY + (Math.random() - 0.5) * 200);
      dustPositions[i * 3 + 2] = zPos;
      dustVelocities[i * 3] = 0;
      dustVelocities[i * 3 + 1] = 0;
      dustVelocities[i * 3 + 2] = 0;
      dustTypes[i] = Math.random();
      dustSizes[i] = Math.random() < 0.6 ? 1.5 + Math.random() * 2.0 : 3.5 + Math.random() * 3.0;
      dustAlphas[i] = 0.3 + Math.random() * 0.6;
    }

    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute("velocity", new THREE.BufferAttribute(dustVelocities, 3));
    dustGeo.setAttribute("size", new THREE.BufferAttribute(dustSizes, 1));
    dustGeo.setAttribute("alpha", new THREE.BufferAttribute(dustAlphas, 1));
    dustGeo.setAttribute("particleType", new THREE.BufferAttribute(dustTypes, 1));

    const dustMat = new THREE.ShaderMaterial({
      vertexShader: flowFieldVertex,
      fragmentShader: flowFieldFragment,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib["fog"],
        {
          uColor: { value: new THREE.Color(0x22d3ee) },
          uTime: { value: 0 },
        }
      ]),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: true
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    dustPoints.frustumCulled = false;
    scene.add(dustPoints);

    // --- FLOATING AQUATIC SMALL WATER BALLS ---
    const ballCount = isMobile ? 3000 : 7000;
    const ballGeo = new THREE.BufferGeometry();
    const ballPositions = new Float32Array(ballCount * 3);
    const ballSizes = new Float32Array(ballCount);
    const ballAlphas = new Float32Array(ballCount);
    const ballTypes = new Float32Array(ballCount);

    for (let i = 0; i < ballCount; i++) {
      ballPositions[i * 3] = (Math.random() - 0.5) * 450;
      ballPositions[i * 3 + 1] = -400 + Math.random() * 350;
      ballPositions[i * 3 + 2] = -20 - Math.random() * 650;
      ballSizes[i] = 2.5 + Math.random() * 6.5;
      ballAlphas[i] = 0.4 + Math.random() * 0.55;
      ballTypes[i] = Math.random();
    }

    ballGeo.setAttribute("position", new THREE.BufferAttribute(ballPositions, 3));
    ballGeo.setAttribute("velocity", new THREE.BufferAttribute(new Float32Array(ballCount * 3), 3));
    ballGeo.setAttribute("size", new THREE.BufferAttribute(ballSizes, 1));
    ballGeo.setAttribute("alpha", new THREE.BufferAttribute(ballAlphas, 1));
    ballGeo.setAttribute("particleType", new THREE.BufferAttribute(ballTypes, 1));

    const ballMat = new THREE.ShaderMaterial({
      vertexShader: flowFieldVertex,
      fragmentShader: flowFieldFragment,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib["fog"],
        {
          uColor: { value: new THREE.Color(0x38bdf8) },
          uTime: { value: 0 },
        }
      ]),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: true
    });

    const ballMesh = new THREE.Points(ballGeo, ballMat);
    scene.add(ballMesh);

    // --- BIOLUMINESCENT WAVE SEABED PLANE ---
    const waveGridCols = isMobile ? 80 : 160;
    const waveGridRows = isMobile ? 80 : 160;
    const waveCount = waveGridCols * waveGridRows;
    const waveWidth = 400;
    const waveDepth = 1000;

    const wavePositions = new Float32Array(waveCount * 3);
    const waveRandoms = new Float32Array(waveCount);
    const waveScales = new Float32Array(waveCount);

    let waveIdx = 0;
    for (let i = 0; i < waveGridCols; i++) {
      for (let j = 0; j < waveGridRows; j++) {
        const u = i / (waveGridCols - 1);
        const v = j / (waveGridRows - 1);

        wavePositions[waveIdx * 3] = (u - 0.5) * waveWidth;
        wavePositions[waveIdx * 3 + 1] = -380.0;
        wavePositions[waveIdx * 3 + 2] = (v - 0.5) * waveDepth - 450.0;

        waveRandoms[waveIdx] = Math.random();
        waveScales[waveIdx] = 0.7 + Math.random() * 0.8;
        waveIdx++;
      }
    }

    const seabedWaveGeo = new THREE.BufferGeometry();
    seabedWaveGeo.setAttribute("position", new THREE.BufferAttribute(wavePositions, 3));
    seabedWaveGeo.setAttribute("aRandom", new THREE.BufferAttribute(waveRandoms, 1));
    seabedWaveGeo.setAttribute("aScale", new THREE.BufferAttribute(waveScales, 1));

    const seabedWaveMat = new THREE.ShaderMaterial({
      vertexShader: waveSeabedVertex,
      fragmentShader: waveSeabedFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 2.2 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uNoiseScale: { value: 0.04 },
        uWaveSpeed: { value: 0.8 },
        uWaveHeight: { value: 7.5 },
        uColorDeep: { value: new THREE.Color(0x002e4d) },
        uColorMid: { value: new THREE.Color(0x00a8e8) },
        uColorPeak: { value: new THREE.Color(0x00f0ff) },
      },
    });

    const seabedWaveMesh = new THREE.Points(seabedWaveGeo, seabedWaveMat);
    scene.add(seabedWaveMesh);

    // --- FLOATING AMBIENT BUBBLES & AQUATIC DUST ---
    const floatParticleCount = isMobile ? 600 : 1800;

    const floatPositions = new Float32Array(floatParticleCount * 3);
    const floatSizes = new Float32Array(floatParticleCount);
    const floatSpeeds = new Float32Array(floatParticleCount);
    const floatPhases = new Float32Array(floatParticleCount);
    const floatTypes = new Float32Array(floatParticleCount);

    for (let i = 0; i < floatParticleCount; i++) {
      const i3 = i * 3;
      floatPositions[i3] = (Math.random() - 0.5) * 360;
      floatPositions[i3 + 1] = -385 + Math.random() * 360;
      floatPositions[i3 + 2] = -30 - Math.random() * 1200;

      const isBubble = Math.random() < 0.35;
      floatTypes[i] = isBubble ? 0.0 : 1.0;
      floatSizes[i] = isBubble ? 2.5 + Math.random() * 3.5 : 1.0 + Math.random() * 2.0;
      floatSpeeds[i] = 0.5 + Math.random() * 1.2;
      floatPhases[i] = Math.random();
    }

    const floatingParticlesGeo = new THREE.BufferGeometry();
    floatingParticlesGeo.setAttribute("position", new THREE.BufferAttribute(floatPositions, 3));
    floatingParticlesGeo.setAttribute("aSize", new THREE.BufferAttribute(floatSizes, 1));
    floatingParticlesGeo.setAttribute("aSpeed", new THREE.BufferAttribute(floatSpeeds, 1));
    floatingParticlesGeo.setAttribute("aPhase", new THREE.BufferAttribute(floatPhases, 1));
    floatingParticlesGeo.setAttribute("aType", new THREE.BufferAttribute(floatTypes, 1));

    const floatingParticlesMat = new THREE.ShaderMaterial({
      vertexShader: floatingParticleVertex,
      fragmentShader: floatingParticleFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uBubbleColor: { value: new THREE.Color(0x67e8f9) },
        uDustColor: { value: new THREE.Color(0x22d3ee) },
      },
    });

    const floatingParticlesMesh = new THREE.Points(floatingParticlesGeo, floatingParticlesMat);
    scene.add(floatingParticlesMesh);

    // --- RAYCASTER FOR PORTAL RING, PIN MARKER & 3D BANNER INTERACTIVITY ---
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    function handlePortalClick(event) {
      mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects([portalRingMesh, ...crystalShrineMeshes, ...bannerMeshes, ...infoMeshes], true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit === portalRingMesh) {
          const targetY = window.innerHeight * 5;
          window.scrollTo({ top: targetY, behavior: "smooth" });
        } else if (hit.userData && hit.userData.eventData) {
          setSelectedEvent(hit.userData.eventData);
        }
      }
    }
    window.addEventListener("click", handlePortalClick);

    // --- CAMERA & GSAP SCROLL JOURNEY: CONTINUOUS DESCENDING DEEP THROUGH THE STARGATE & EVENT LOCATIONS ---
    camera.position.set(0, 2, 0);
    camera.rotation.order = "YXZ";

    const camState = {
      x: 0,
      y: 2,
      z: 0,
      targetX: 0,
      targetY: 2,
      targetZ: -50,
      rx: 0,
      ry: 0,
      fov: isMobile ? 65 : 75,
      fogDensity: 0.0,
    };

    const currentLookAt = new THREE.Vector3(0, 2, -50);
    const desiredLookAt = new THREE.Vector3(0, 2, -50);
    const travelTarget = new THREE.Vector3(0, 2, -50);
    const blendedTarget = new THREE.Vector3(0, 2, -50);
    const smoothCamPos = new THREE.Vector3(0, 2, 0);
    const lastCamPos = new THREE.Vector3(0, 2, 0);
    const safetyOffset = new THREE.Vector3();
    const safeCameraPosition = new THREE.Vector3();
    let currentBank = 0;

    const mouse = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };

    function handleMouseMove(event) {
      targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      mouseVector.x = targetMouse.x;
      mouseVector.y = targetMouse.y;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects([portalRingMesh, ...crystalShrineMeshes, ...bannerMeshes, ...infoMeshes], true);
      if (intersects.length > 0) {
        document.body.style.cursor = "pointer";
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.eventData) {
          setHoveredNode(hit.userData.eventData.name);
        }
      } else {
        document.body.style.cursor = "default";
        setHoveredNode(null);
      }
    }
    window.addEventListener("mousemove", handleMouseMove);

    function handleTouchMove(event) {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        targetMouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      }
    }
    function handleTouchEnd() {
      targetMouse.x = 0;
      targetMouse.y = 0;
    }
    if (isMobile) {
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);
    }

    const snapPoints = [0, 0.15, 0.35, 0.48, 0.60, 0.72, 0.84, 1.0];

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: isMobile ? 1.0 : 0.8,
        onUpdate: (self) => {
          const updateStart = performance.now();
          const currentProgress = Math.floor(self.progress * 100);
          // PERF: Only trigger React re-render when integer value actually changes
          if (currentProgress !== lastScrollInt) {
            lastScrollInt = currentProgress;
            setScrollProgress(currentProgress);
          }
          const updateTime = performance.now() - updateStart;
          if (updateTime > 8) {
            console.warn(`[Performance] Slow ScrollTrigger onUpdate: ${updateTime.toFixed(2)}ms (progress: ${currentProgress}%)`);
          }



          // --- COMPREHENSIVE SCROLL LOGGER ---
          const p = self.progress;
          let currentSection = "Surface Hero Ocean View (0% - 2.5%)";
          if (p >= 0.025 && p < 0.065) currentSection = "Underwater Cave Descent (2.5% - 6.5%)";
          else if (p >= 0.065 && p < 0.069) currentSection = "Pre-Portal Stargate Gate (6.5% - 6.9%)";
          else if (p >= 0.069 && p < 0.078) currentSection = "Stargate Singularity Warp Transition (6.9% - 7.8%)";
          else if (p >= 0.50 && p < 0.55) currentSection = "Event 01: Coding Platform (50% - 55%)";
          else if (p >= 0.55 && p < 0.60) currentSection = "Event 02: Web Design Platform (55% - 60%)";
          else if (p >= 0.60 && p < 0.65) currentSection = "Event 03: IT Quiz Platform (60% - 65%)";
          else if (p >= 0.65 && p < 0.70) currentSection = "Event 04: Gaming Platform (65% - 70%)";
          else if (p >= 0.70 && p < 0.75) currentSection = "Event 05: Tech Talk Platform (70% - 75%)";
          else if (p >= 0.75 && p < 0.80) currentSection = "Event 06: Surprise Platform (75% - 80%)";
          else if (p >= 0.80 && p < 0.85) currentSection = "Event 07: IT Manager Platform (80% - 85%)";
          else if (p >= 0.85 && p < 0.90) currentSection = "Event 08: Startup Platform (85% - 90%)";
          else if (p >= 0.90 && p < 0.95) currentSection = "Event 09: Dance Platform (90% - 95%)";
          else if (p >= 0.95) currentSection = "Event 10: Photography & Finale (95% - 100%)";

          console.log(
            `%c[SCROLL] ${(p * 100).toFixed(1)}% | ${self.direction === 1 ? "FORWARD ↓" : "BACKWARD ↑"} | ${currentSection}`,
            "color: #00ffff; font-weight: bold; background: #011728; padding: 2px 6px; border-radius: 3px;",
            {
              section: currentSection,
              scrollProgress: `${(p * 100).toFixed(2)}%`,
              direction: self.direction === 1 ? "FORWARD ↓" : "BACKWARD ↑",
              velocity: self.getVelocity ? Math.round(self.getVelocity()) : 0,
              cameraPosition: {
                x: +(camState.x || 0).toFixed(1),
                y: +(camState.y || 0).toFixed(1),
                z: +(camState.z || 0).toFixed(1),
              },
              elements: {
                "Water Surface": { visible: water ? water.visible : true, hidden: water ? !water.visible : false },
                "Water Ceiling": { visible: waterCeilingMesh ? waterCeilingMesh.visible : true, hidden: waterCeilingMesh ? !waterCeilingMesh.visible : false, opacity: +(waterCeilingMat?.opacity || 0).toFixed(2) },
                "Water Underside": { visible: waterUnderside ? waterUnderside.visible : true, hidden: waterUnderside ? !waterUnderside.visible : false },
                "Cave Walls (caveMesh)": { visible: caveMesh ? caveMesh.visible : true, hidden: caveMesh ? !caveMesh.visible : false, opacity: +(caveMaterial?.opacity || 1).toFixed(2) },
                "Side Cliff Walls": { visible: sideCliffGroup ? sideCliffGroup.visible : true, hidden: sideCliffGroup ? !sideCliffGroup.visible : false },
                "Background Mountains": { visible: bgMountainsGroup ? bgMountainsGroup.visible : true, hidden: bgMountainsGroup ? !bgMountainsGroup.visible : false },
                "Portal Stargate": { visible: portalGroup ? portalGroup.visible : true, hidden: portalGroup ? !portalGroup.visible : false },
                "Event World (newWorldGroup)": { visible: newWorldGroup ? newWorldGroup.visible : false, hidden: newWorldGroup ? !newWorldGroup.visible : true },
                "Portal Backdrop": { visible: portalBackdropMesh ? portalBackdropMesh.visible : true, hidden: portalBackdropMesh ? !portalBackdropMesh.visible : false },
                "Hero UI Overlay": { visible: heroUiRef.current ? parseFloat(heroUiRef.current.style.opacity || "1") > 0.05 : true, opacity: heroUiRef.current?.style.opacity || "1.0" }
              }
            }
          );
        },
      },
    });

    // Phase 1: Surface Ocean View (0 - 15%) - Dive directly down into ocean
    tl.to(
      camState,
      {
        x: 0,
        y: -40,
        z: -35,
        targetX: 0,
        targetY: -40,
        targetZ: -85,
        rx: -0.08,
        ry: 0,
        fogDensity: 0.012,
        duration: 1.5,
        ease: "power1.inOut",
      },
      0
    );

    // Phase 2: Align Camera with Deeper Submerged Main Portal Ring Center at y: -110, z: -125 (15% - 40%)
    tl.to(
      camState,
      {
        x: 0,
        y: -110,
        z: -125,
        targetX: 0,
        targetY: -110,
        targetZ: -190,
        rx: 0,
        ry: 0,
        fogDensity: 0.016,
        duration: 2.5,
        ease: "power2.inOut",
      },
      1.5
    );

    // Phase 3: Fly STRAIGHT THROUGH CENTER of Circular Portal Stargate (40% - 46%)
    tl.to(
      camState,
      {
        x: 0,
        y: -110,
        z: -210,
        targetX: 0,
        targetY: -110,
        targetZ: -260,
        rx: 0,
        ry: 0,
        fogDensity: 0.015,
        duration: 1.0,
        ease: "power1.inOut",
      },
      4.0
    );

    // Exit / Clear Portal Area (46% - 50%) — Fly forward in open water to z: -250, leaving stargate ring behind
    tl.to(
      camState,
      {
        x: 0,
        y: -110,
        z: -250,
        targetX: 0,
        targetY: -110,
        targetZ: -300,
        fogDensity: 0.015,
        duration: 0.8,
        ease: "power1.out",
      },
      5.0
    );

    // INSIDE EVENT PORTAL: Cinematic AAA Underwater Exploration Choreography
    // Continuous curved trajectories, dynamic look-at targets, micro-banking rolls, and tailored FOV transitions.
    // Event Platform Coordinates:
    // 01 Coding: (-42, -110, -300) | 02 Web Design: (42, -150, -400) | 03 IT Quiz: (-42, -190, -500)
    // 04 Gaming: (42, -230, -600)  | 05 Tech Talk: (-42, -230, -700) | 06 Surprise: (42, -310, -800)
    // 07 IT Manager: (-42, -310, -900) | 08 Startup: (42, -390, -1000) | 09 Dance: (-42, -430, -1100)
    // 10 Photography: (0, -470, -1200)

    // EVENT 01 — CODING: Cinematic Approach → Hero Rise (y: -99) → Straight Rightward Motion Pointing to Crystal (x: +22) → Downward Exit (y: -124)
    // 1. APPROACH: Exit portal at low position (y: -118), moving forward in Z toward Coding platform
    tl.to(
      camState,
      {
        x: -18,
        y: -118,
        z: -265,
        targetX: -22,
        targetY: -106,
        targetZ: -318,
        fov: 64,
        fogDensity: 0.015,
        duration: 1.2,
        ease: "power2.inOut",
      },
      5.2
    );

    // 2. HERO ARRIVAL AT DEPTH 99M: Camera rises to elevation y: -99, pointing directly at the crystal orb
    tl.to(
      camState,
      {
        x: -30,
        y: -99,
        z: -282,
        targetX: -22,
        targetY: -104,
        targetZ: -318,
        fov: 54,
        duration: 1.3,
        ease: "power2.out",
      },
      6.4
    );

    // 3. STRAIGHT RIGHT SIDE MOTION POINTING TO CRYSTAL: Glides straight to the RIGHT (x: -30 → +22) while continuously pointing at the crystal orb
    // 3. SMOOTH ORBIT AROUND CRYSTAL:
    // Camera moves in a curved right-side arc while continuously looking at the crystal.
    // This creates a cinematic rotation instead of a straight horizontal slide.
    // 3. EXTENDED CINEMATIC ORBIT AROUND CODING CRYSTAL
    // Camera makes a wide curved arc around the crystal while continuously
    // looking at the crystal. No straight horizontal movement.
    tl.to(
      camState,
      {
        x: -5,
        y: -91,
        z: -300,
        targetX: -22,
        targetY: -104,
        targetZ: -318,
        fov: 51,
        duration: 1.1,
        ease: "power2.inOut",
      },
      7.7
    );

    tl.to(
      camState,
      {
        x: 18,
        y: -88,
        z: -307,
        targetX: -22,
        targetY: -104,
        targetZ: -318,
        fov: 49,
        duration: 1.2,
        ease: "sine.inOut",
      },
      8.8
    );

    tl.to(
      camState,
      {
        x: 38,
        y: -96,
        z: -296,
        targetX: -22,
        targetY: -104,
        targetZ: -318,
        fov: 48,
        duration: 1.2,
        ease: "sine.inOut",
      },
      10.0
    );

    // 4. THEN DOWNWARD EXIT: After moving straight right, smoothly curve downward in Y (y: -99 → -124) toward Event 02
    // 4. SMOOTH DOWNWARD EXIT AFTER EXTENDED ORBIT
    tl.to(
      camState,
      {
        x: 28,
        y: -124,
        z: -340,
        targetX: 28,
        targetY: -138,
        targetZ: -405,
        fov: 64,
        fogDensity: 0.016,
        duration: 1.3,
        ease: "power1.inOut",
      },
      11.2
    );

    // EVENT 02 — WEB DESIGN: Wide Arrival → Right Flank Orbit → Hero Inspection → Extended Micro-Orbit → Smooth Exit
    tl.to(
      camState,
      {
        x: 42,
        y: -168,
        z: -350,
        targetX: 32,
        targetY: -183,
        targetZ: -420,
        fov: 68,
        fogDensity: 0.017,
        duration: 1.2,
        ease: "power2.out",
      },
      12.5
    );
    tl.to(
      camState,
      {
        x: 48,
        y: -176,
        z: -390,
        targetX: 32,
        targetY: -183,
        targetZ: -420,
        fov: 58,
        duration: 1.2,
        ease: "sine.inOut",
      },
      13.7
    );
    tl.to(
      camState,
      {
        x: 30,
        y: -174,
        z: -402,
        targetX: 32,
        targetY: -183,
        targetZ: -420,
        fov: 51,
        duration: 1.1,
        ease: "sine.inOut",
      },
      14.9
    );
    tl.to(
      camState,
      {
        x: 18,
        y: -176,
        z: -412,
        targetX: 32,
        targetY: -183,
        targetZ: -420,
        fov: 52,
        duration: 1.1,
        ease: "sine.inOut",
      },
      16.0
    );
    tl.to(
      camState,
      {
        x: -10,
        y: -195,
        z: -445,
        targetX: 32,
        targetY: -183,
        targetZ: -420,
        fov: 64,
        fogDensity: 0.018,
        duration: 1.2,
        ease: "power1.inOut",
      },
      17.1
    );

    // EVENT 03 — IT QUIZ: Descending Approach → Left Flank Orbit → Hero Technical Focus → Micro-Arc → Smooth Exit Right
    tl.to(
      camState,
      {
        x: -18,
        y: -170,
        z: -442,
        targetX: -32,
        targetY: -183,
        targetZ: -508,
        fov: 70,
        fogDensity: 0.019,
        duration: 1.2,
        ease: "power2.out",
      },
      18.3
    );
    tl.to(
      camState,
      {
        x: -44,
        y: -176,
        z: -475,
        targetX: -32,
        targetY: -183,
        targetZ: -508,
        fov: 58,
        duration: 1.2,
        ease: "sine.inOut",
      },
      19.5
    );
    tl.to(
      camState,
      {
        x: -28,
        y: -174,
        z: -488,
        targetX: -32,
        targetY: -183,
        targetZ: -508,
        fov: 51,
        duration: 1.1,
        ease: "sine.inOut",
      },
      20.7
    );
    tl.to(
      camState,
      {
        x: -16,
        y: -176,
        z: -496,
        targetX: -32,
        targetY: -183,
        targetZ: -508,
        fov: 53,
        duration: 1.1,
        ease: "sine.inOut",
      },
      21.8
    );
    tl.to(
      camState,
      {
        x: 22,
        y: -200,
        z: -533,
        targetX: -32,
        targetY: -183,
        targetZ: -508,
        fov: 66,
        fogDensity: 0.020,
        duration: 1.2,
        ease: "power1.inOut",
      },
      22.9
    );

    // EVENT 04 — GAMING: Energetic Fast Swoop → Spiral Arc → Close Shrine → Fast Exit
    tl.to(
      camState,
      {
        x: 18,
        y: -200,
        z: -528,
        targetX: 32,
        targetY: -223,
        targetZ: -608,
        fov: 72,
        fogDensity: 0.021,
        duration: 1.2,
        ease: "power2.out",
      },
      24.1
    );
    tl.to(
      camState,
      {
        x: 42,
        y: -218,
        z: -568,
        targetX: 32,
        targetY: -223,
        targetZ: -608,
        fov: 60,
        duration: 1.0,
        ease: "power1.inOut",
      },
      25.7
    );
    tl.to(
      camState,
      {
        x: 32,
        y: -216,
        z: -570,
        targetX: 32,
        targetY: -223,
        targetZ: -608,
        fov: 48,
        duration: 0.6,
        ease: "sine.inOut",
      },
      26.7
    );
    tl.to(
      camState,
      {
        x: -25,
        y: -216,
        z: -633,
        targetX: 32,
        targetY: -223,
        targetZ: -608,
        fov: 70,
        fogDensity: 0.0215,
        duration: 0.8,
        ease: "power1.inOut",
      },
      27.3
    );

    // EVENT 05 — TECH TALK: Slow Approach → Cave Entrance Reveal → Move Toward Cave → Shrine Reveal → Slow Exit
    tl.to(
      camState,
      {
        x: -15,
        y: -210,
        z: -628,
        targetX: -32,
        targetY: -223,
        targetZ: -708,
        fov: 64,
        fogDensity: 0.022,
        duration: 1.2,
        ease: "power1.out",
      },
      28.3
    );
    tl.to(
      camState,
      {
        x: -30,
        y: -222,
        z: -653,
        targetX: -32,
        targetY: -223,
        targetZ: -708,
        fov: 58,
        duration: 1.0,
        ease: "power1.inOut",
      },
      29.9
    );
    tl.to(
      camState,
      {
        x: -32,
        y: -220,
        z: -670,
        targetX: -32,
        targetY: -223,
        targetZ: -708,
        fov: 48,
        duration: 0.6,
        ease: "sine.inOut",
      },
      30.9
    );
    tl.to(
      camState,
      {
        x: 20,
        y: -260,
        z: -738,
        targetX: -32,
        targetY: -223,
        targetZ: -708,
        fov: 62,
        fogDensity: 0.023,
        duration: 0.8,
        ease: "power1.inOut",
      },
      31.5
    );

    // EVENT 06 — SURPRISE EVENT: Deep Approach → Right Approach → Depth Reveal → Hero Orbit → Hero Settle → Exit
    tl.to(
      camState,
      {
        x: 14,
        y: -278,
        z: -785,
        targetX: 32,
        targetY: -303,
        targetZ: -860,
        fov: 66,
        fogDensity: 0.024,
        duration: 1.2,
        ease: "power2.out",
      },
      32.5
    );
    tl.to(
      camState,
      {
        x: 42,
        y: -292,
        z: -820,
        targetX: 32,
        targetY: -303,
        targetZ: -860,
        fov: 60,
        duration: 1.2,
        ease: "sine.inOut",
      },
      33.7
    );
    tl.to(
      camState,
      {
        x: 48,
        y: -298,
        z: -838,
        targetX: 32,
        targetY: -303,
        targetZ: -860,
        fov: 55,
        duration: 1.1,
        ease: "sine.inOut",
      },
      34.9
    );
    tl.to(
      camState,
      {
        x: 30,
        y: -294,
        z: -848,
        targetX: 32,
        targetY: -303,
        targetZ: -860,
        fov: 50,
        duration: 1.2,
        ease: "sine.inOut",
      },
      36.0
    );
    tl.to(
      camState,
      {
        x: 18,
        y: -296,
        z: -855,
        targetX: 32,
        targetY: -303,
        targetZ: -860,
        fov: 51,
        duration: 1.1,
        ease: "sine.inOut",
      },
      37.2
    );
    tl.to(
      camState,
      {
        x: -18,
        y: -315,
        z: -885,
        targetX: -28,
        targetY: -294,
        targetZ: -905,
        fov: 64,
        fogDensity: 0.0245,
        duration: 1.2,
        ease: "power1.inOut",
      },
      38.3
    );

    // EVENT 07 — IT MANAGER SPIRE: 5-Phase 3D Orbital Trajectory
    tl.to(
      camState,
      {
        x: -10,
        y: -284,
        z: -876,
        targetX: -28,
        targetY: -294,
        targetZ: -905,
        fov: 64,
        fogDensity: 0.025,
        duration: 1.2,
        ease: "power2.out",
      },
      39.5
    );
    tl.to(
      camState,
      {
        x: -42,
        y: -286,
        z: -888,
        targetX: -28,
        targetY: -294,
        targetZ: -905,
        fov: 58,
        duration: 1.2,
        ease: "sine.inOut",
      },
      40.9
    );
    tl.to(
      camState,
      {
        x: -30,
        y: -287,
        z: -894,
        targetX: -28,
        targetY: -294,
        targetZ: -905,
        fov: 51,
        duration: 1.1,
        ease: "sine.inOut",
      },
      42.3
    );
    tl.to(
      camState,
      {
        x: -18,
        y: -288,
        z: -898,
        targetX: -28,
        targetY: -294,
        targetZ: -905,
        fov: 52,
        duration: 1.1,
        ease: "sine.inOut",
      },
      43.6
    );
    tl.to(
      camState,
      {
        x: 15,
        y: -350,
        z: -933,
        targetX: 28,
        targetY: -383,
        targetZ: -1015,
        fov: 64,
        fogDensity: 0.0255,
        duration: 1.1,
        ease: "power1.inOut",
      },
      44.9
    );

    // EVENT 08 — STARTUP: 5-Phase 3D Orbital Trajectory
    tl.to(
      camState,
      {
        x: 18,
        y: -365,
        z: -970,
        targetX: 28,
        targetY: -383,
        targetZ: -1015,
        fov: 64,
        fogDensity: 0.026,
        duration: 1.2,
        ease: "power2.out",
      },
      46.1
    );
    tl.to(
      camState,
      {
        x: 48,
        y: -366,
        z: -995,
        targetX: 28,
        targetY: -383,
        targetZ: -1015,
        fov: 58,
        duration: 1.2,
        ease: "sine.inOut",
      },
      47.4
    );
    tl.to(
      camState,
      {
        x: 34,
        y: -367,
        z: -1002,
        targetX: 28,
        targetY: -383,
        targetZ: -1015,
        fov: 51,
        duration: 1.1,
        ease: "sine.inOut",
      },
      48.7
    );
    tl.to(
      camState,
      {
        x: 24,
        y: -368,
        z: -1004,
        targetX: 28,
        targetY: -383,
        targetZ: -1015,
        fov: 52,
        duration: 1.1,
        ease: "sine.inOut",
      },
      50.0
    );
    tl.to(
      camState,
      {
        x: -15,
        y: -405,
        z: -1045,
        targetX: -28,
        targetY: -423,
        targetZ: -1115,
        fov: 64,
        fogDensity: 0.0265,
        duration: 1.1,
        ease: "power1.inOut",
      },
      51.3
    );

    // EVENT 09 — DANCE: 5-Phase 3D Orbital Trajectory
    tl.to(
      camState,
      {
        x: -18,
        y: -405,
        z: -1080,
        targetX: -28,
        targetY: -423,
        targetZ: -1115,
        fov: 64,
        fogDensity: 0.027,
        duration: 1.2,
        ease: "power2.out",
      },
      52.5
    );
    tl.to(
      camState,
      {
        x: -48,
        y: -406,
        z: -1095,
        targetX: -28,
        targetY: -423,
        targetZ: -1115,
        fov: 58,
        duration: 1.2,
        ease: "sine.inOut",
      },
      53.8
    );
    tl.to(
      camState,
      {
        x: -34,
        y: -407,
        z: -1102,
        targetX: -28,
        targetY: -423,
        targetZ: -1115,
        fov: 51,
        duration: 1.1,
        ease: "sine.inOut",
      },
      55.1
    );
    tl.to(
      camState,
      {
        x: -24,
        y: -408,
        z: -1104,
        targetX: -28,
        targetY: -423,
        targetZ: -1115,
        fov: 52,
        duration: 1.1,
        ease: "sine.inOut",
      },
      56.4
    );
    tl.to(
      camState,
      {
        x: 10,
        y: -445,
        z: -1145,
        targetX: 8,
        targetY: -463,
        targetZ: -1215,
        fov: 64,
        fogDensity: 0.0275,
        duration: 1.1,
        ease: "power1.inOut",
      },
      57.7
    );

    // EVENT 10 — PHOTOGRAPHY: 5-Phase 3D Orbital Trajectory & Grand Finale Settle
    tl.to(
      camState,
      {
        x: 16,
        y: -446,
        z: -1175,
        targetX: 8,
        targetY: -463,
        targetZ: -1215,
        fov: 64,
        fogDensity: 0.028,
        duration: 1.3,
        ease: "power2.out",
      },
      58.9
    );
    tl.to(
      camState,
      {
        x: 20,
        y: -447,
        z: -1190,
        targetX: 8,
        targetY: -463,
        targetZ: -1215,
        fov: 58,
        duration: 1.3,
        ease: "sine.inOut",
      },
      60.3
    );
    tl.to(
      camState,
      {
        x: 10,
        y: -448,
        z: -1198,
        targetX: 8,
        targetY: -463,
        targetZ: -1215,
        fov: 50,
        duration: 1.2,
        ease: "sine.inOut",
      },
      61.7
    );
    tl.to(
      camState,
      {
        x: 4,
        y: -449,
        z: -1200,
        targetX: 8,
        targetY: -463,
        targetZ: -1215,
        fov: 48,
        duration: 1.2,
        ease: "sine.inOut",
      },
      63.0
    );
    tl.to(
      camState,
      {
        x: 0,
        y: -450,
        z: -1202,
        targetX: 8,
        targetY: -463,
        targetZ: -1215,
        fov: 46,
        fogDensity: 0.029,
        duration: 1.5,
        ease: "power2.out",
      },
      64.3
    );

    tl.to({}, { duration: 2.0 });

    // --- PERF: Pre-flatten group materials once so the render loop never has to
    // walk the scene graph (traverse()) every frame — just iterate flat arrays. ---
    function flattenGroupMaterials(group, excludeMesh = null) {
      const seen = new Set();
      group.traverse((child) => {
        if (child.isMesh && child.material && child !== excludeMesh) {
          child.material.transparent = true;
          seen.add(child.material);
        }
      });
      return Array.from(seen);
    }
    function setMaterialsOpacity(materials, opacity) {
      for (let i = 0; i < materials.length; i++) {
        materials[i].opacity = opacity;
      }
    }
    const sideCliffMaterials = flattenGroupMaterials(sideCliffGroup);
    const bgMountainMaterials = flattenGroupMaterials(bgMountainsGroup);
    const portalGroupMaterials = flattenGroupMaterials(portalGroup, portalDisc);
    let lastSurfaceStateKey = null; // tracks which fixed-opacity branch (surface/blended/underwater) was last applied
    let lastPortalApproachBlend = -1;

    // --- PERF: Pre-allocated persistent fog to avoid per-frame `new FogExp2()` allocations ---
    const _persistentFog = new THREE.FogExp2(0x052a42, 0.0);
    let lastScrollInt = -1; // throttle setScrollProgress to only fire on integer change

    // --- PERF: Reusable scratch vectors/quaternions/colors so the animate loop
    // allocates ~0 objects per frame (avoids GC-driven stutter). ---
    const _caveFogColorA = new THREE.Color(0x052a42);
    const _caveFogColorB = new THREE.Color(0x011728);
    const _caveFogColor = new THREE.Color();
    const _deepAmbientColor = new THREE.Color(0x002e4d);
    const _ambientScratch = new THREE.Color();
    const _ambientUnderwaterTarget = new THREE.Color(0x006699);
    const _fishTarget = new THREE.Vector3();
    const _fishPathPoints = [
      new THREE.Vector3(-22, -106, -318), // Event 1
      new THREE.Vector3(22, -186, -430),  // Event 2
      new THREE.Vector3(-32, -186, -508), // Event 3
      new THREE.Vector3(-32, -106, -400), // Midpoint return
    ];

    const clock = new THREE.Clock();
    let animationId;
    let frameCount = 0;
    let lastFpsCheck = performance.now();

    // --- RIPPLE AQUARIUM FISH SIMULATION INITIALIZATION ---
    const fishGroup = new THREE.Group();
    fishGroup.position.set(-22, -106, -318); // Place near Event 1 Crystal Shrine
    scene.add(fishGroup);

    const sardineSimulation = new FishSchoolSimulation({
      aquariumHalfSize,
      obstacles: [],
      settings: { ...simulationSettings, minSpeed: 8, maxSpeed: 18 },
    });
    const koiSimulation = new FishSchoolSimulation({
      aquariumHalfSize,
      obstacles: [],
      settings: { ...simulationSettings, minSpeed: 6, maxSpeed: 12 },
    });

    let sardineMesh = null;
    let koiMesh = null;
    let clownfishSchoolObj = null;

    loadFishModel().then(() => {
      sardineSimulation.reset(60);
      sardineMesh = createFishMeshByKey(260, "cartoon");
      setFishMeshCount(sardineMesh, 60);
      fishGroup.add(sardineMesh);

      koiSimulation.reset(24);
      koiMesh = createFishMeshByKey(120, "koi");
      setFishMeshCount(koiMesh, 24);
      fishGroup.add(koiMesh);

      clownfishSchoolObj = createClownfishSchool(null, { count: 18 });
      fishGroup.add(clownfishSchoolObj.mesh);
    }).catch(e => console.error("Error loading fish:", e));

    const _podForward = new THREE.Vector3();
    const _podRight = new THREE.Vector3();
    const _podUp = new THREE.Vector3();
    const _worldUp = new THREE.Vector3(0, 1, 0);
    const _unitZ = new THREE.Vector3(0, 0, 1);
    const _dolphinPos = new THREE.Vector3();
    const _dolphinTargetQuat = new THREE.Quaternion();
    const _dolphinRollQuat = new THREE.Quaternion();
    const _smoothCamTarget = new THREE.Vector3();


    const _eventShrinePositions = {
      1: new THREE.Vector3(-22, -106, -318),
      2: new THREE.Vector3(22, -186, -430),
      3: new THREE.Vector3(-32, -186, -508),
      6: new THREE.Vector3(32, -306, -870),
      7: new THREE.Vector3(-28, -294, -905),
      8: new THREE.Vector3(28, -375, -1015),
      9: new THREE.Vector3(-28, -415, -1115),
      10: new THREE.Vector3(8, -455, -1215),
    };

    function animate() {
      animationId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const t = clock.elapsedTime;

      frameCount++;
      const now = performance.now();
      if (now - lastFpsCheck >= 1000) {
        const calculatedFps = Math.round((frameCount * 1000) / (now - lastFpsCheck));
        const depthVal = Math.max(2, Math.floor(Math.abs(camState.y)));
        setStats({
          depth: depthVal,
          speed: (2.0 + Math.sin(t * 0.5) * 0.4).toFixed(1),
          coords: `X:${Math.round(camState.x)} Y:${Math.round(camState.y)} Z:${Math.round(
            camState.z
          )}`,
          fps: calculatedFps,
        });
        frameCount = 0;
        lastFpsCheck = now;
      }

      // Animate Water Surface & Underwater Ceiling Caustics
      const waterMat = water.material;
      if (waterMat.uniforms && waterMat.uniforms["time"]) {
        waterMat.uniforms["time"].value += delta * 0.5;
      }
      waterCeilingMat.uniforms.uTime.value = t;

      const depthFactor = Math.min(1.0, Math.abs(camState.y) / 470);
      const caveFogColor = _caveFogColor.copy(_caveFogColorA).lerp(_caveFogColorB, depthFactor);

      // Single Shared Blend Factor: y: 0.0 (surface hero view: 0.0) -> y: -40.0 (fully underwater: 1.0)
      // Widened from 10 to 40 Y-units for a gradual, smooth crossfade that works cleanly in both directions
      const rawBlend = THREE.MathUtils.clamp((0.0 - camState.y) / 40.0, 0.0, 1.0);
      const underwaterBlend = THREE.MathUtils.smoothstep(rawBlend, 0.0, 1.0);

      // 1. Hero UI text opacity: 100% visible from surface (y: 2.0) down to cave entrance (y: -40.0), fading out past portal entry (y: -40.0 -> -75.0)
      if (heroUiRef.current) {
        const heroFade = THREE.MathUtils.clamp((-40.0 - camState.y) / 35.0, 0.0, 1.0);
        const heroOpacity = 1.0 - heroFade;
        heroUiRef.current.style.opacity = heroOpacity.toFixed(3);
        heroUiRef.current.style.pointerEvents = heroOpacity > 0.05 ? "auto" : "none";
      }

      // 2. HDRI Sky, Background & Fog Crossfade
      if (underwaterBlend === 0.0) {
        // === PURE SURFACE VIEW (DARK THEME) ===
        scene.background = new THREE.Color(0x041024); // Deep blue night sky matching reference
        if (exrEnvironmentTexture) {
          scene.environment = exrEnvironmentTexture; // Keep environment for water reflections
        }

        renderer.setClearColor(0x041024, 1.0);
        scene.fog = null;

        sunLight.intensity = 1.0; // Dimmer sun for night time
        ambientLight.color.setHex(0x0a1526); // Darker ambient light
        ambientLight.intensity = 0.5;

        // Elements remain visible always — do not close/hide them when coming backward
        skyGroup.visible = true;
        waterCeilingMesh.visible = true;
        waterCeilingMat.opacity = 0.0;
        waterUnderside.visible = true;
        caveMesh.visible = true;
        caveMaterial.transparent = true;
        caveMaterial.opacity = 0.4;
        bgMountainsGroup.visible = true;
        sideCliffGroup.visible = true;

        if (lastSurfaceStateKey !== "surface") {
          setMaterialsOpacity(sideCliffMaterials, 0.4);
          setMaterialsOpacity(bgMountainMaterials, 0.4);
          portalBackdropMat.color.copy(caveFogColor);
          lastSurfaceStateKey = "surface";
        }
      } else if (underwaterBlend < 1.0) {
        // === BLENDED TRANSITION ZONE (y: 0 to y: -40) ===
        scene.background = new THREE.Color(0x041024).lerp(caveFogColor, underwaterBlend);
        if (exrEnvironmentTexture) {
          scene.environment = exrEnvironmentTexture;
        }
        renderer.setClearColor(caveFogColor, 1.0);

        // Use pre-allocated fog object to avoid per-frame allocations
        const targetFogDensity = camState.fogDensity * 0.5 * underwaterBlend;
        if (targetFogDensity > 0.0001) {
          _persistentFog.color.copy(caveFogColor);
          _persistentFog.density = targetFogDensity;
          scene.fog = _persistentFog;
        } else {
          scene.fog = null;
        }

        sunLight.intensity = THREE.MathUtils.lerp(1.0, Math.max(0.6, 2.4 * (1.0 - depthFactor * 0.6)), underwaterBlend);
        // Use pre-allocated scratch color to avoid per-frame `new Color()` allocations
        _ambientScratch.setHex(0x0a1526).lerp(_ambientUnderwaterTarget, underwaterBlend);
        ambientLight.color.copy(_ambientScratch);
        ambientLight.intensity = THREE.MathUtils.lerp(1.0, 1.6, underwaterBlend);

        // Smooth opacity crossfade: 0.4 at surface -> 1.0 fully underwater
        const rockOpacity = THREE.MathUtils.lerp(0.4, 1.0, underwaterBlend);

        // Meshes always remain visible
        skyGroup.visible = true;
        waterCeilingMesh.visible = true;
        waterCeilingMat.opacity = underwaterBlend;
        waterUnderside.visible = true;

        caveMesh.visible = true;
        caveMaterial.transparent = true;
        caveMaterial.opacity = rockOpacity;

        sideCliffGroup.visible = true;
        bgMountainsGroup.visible = true;
        setMaterialsOpacity(sideCliffMaterials, rockOpacity);
        setMaterialsOpacity(bgMountainMaterials, rockOpacity);
        lastSurfaceStateKey = "blended";

        portalBackdropMat.color.copy(caveFogColor);
      } else {
        // === FULLY UNDERWATER ===
        scene.background = caveFogColor;
        // Use pre-allocated fog object
        _persistentFog.color.copy(caveFogColor);
        _persistentFog.density = camState.fogDensity * 0.5;
        scene.fog = _persistentFog;

        sunLight.intensity = Math.max(0.6, 2.4 * (1.0 - depthFactor * 0.6));
        ambientLight.color.setHex(0x006699).lerp(_deepAmbientColor, depthFactor);
        ambientLight.intensity = 1.6 * (1.0 - depthFactor * 0.2);

        skyGroup.visible = false;
        waterCeilingMesh.visible = true;
        waterCeilingMat.opacity = 1.0;
        waterUnderside.visible = true;

        caveMesh.visible = true;
        caveMaterial.transparent = true;
        caveMaterial.opacity = 1.0;

        sideCliffGroup.visible = true;
        bgMountainsGroup.visible = true;
        if (lastSurfaceStateKey !== "underwater") {
          setMaterialsOpacity(sideCliffMaterials, 1.0);
          setMaterialsOpacity(bgMountainMaterials, 1.0);
          lastSurfaceStateKey = "underwater";
        }

        portalBackdropMat.color.copy(caveFogColor);
      }

      // Hard Boundary Clamp for Pre-Portal Camera (camState.z > -185)
      // Guarantees fast scrolling momentum cannot jump or overshoot past the portal threshold
      if (camState.z > -185 && scrollProgress <= 40) {
        camState.x = THREE.MathUtils.clamp(camState.x, -12, 12);
        camState.y = THREE.MathUtils.clamp(camState.y, -110, 5);
        camState.z = THREE.MathUtils.clamp(camState.z, -184.9, 5);
      }

      // STRICT REQUIREMENT: Event World is STRICTLY INVISIBLE until camera passes inside circular portal ring (camState.z < -185)!
      // Cut/hide caveMesh inside the portal so no cavern tunnel mesh ever obstructs or blocks event visibility!
      if (camState.z < -185) {
        newWorldGroup.visible = true;
        sideCliffGroup.visible = true;
        caveMesh.visible = false;
        portalBackdropMesh.visible = false;
      } else {
        newWorldGroup.visible = true;
        portalBackdropMesh.visible = true;
      }

      // Shroud Portal Structure in Deep Water Fog until camera approaches (camState.y: -20.0 down to -75.0)
      const portalApproachRaw = THREE.MathUtils.clamp((-20.0 - camState.y) / 55.0, 0.0, 1.0);
      const portalApproachBlend = THREE.MathUtils.lerp(0.2, 1.0, THREE.MathUtils.smoothstep(portalApproachRaw, 0.0, 1.0));

      if (Math.abs(portalApproachBlend - lastPortalApproachBlend) > 0.0005) {
        setMaterialsOpacity(portalGroupMaterials, portalApproachBlend);
        lastPortalApproachBlend = portalApproachBlend;
      }

      // Update Portal Vortex Shader and Flow Field Water Particles
      portalDiscMat.uniforms.uTime.value = t;
      outerRingMesh.rotation.z = -t * 0.25;
      flowFieldMat.uniforms.uTime.value = t;

      // Update Flow Field Water Particle position drift in 3D currents
      const ffPositions = flowFieldGeo.attributes.position.array;
      for (let i = 0; i < flowFieldCount; i++) {
        const i3 = i * 3;
        ffPositions[i3] += Math.sin(t * 0.6 + i) * 0.05;
        ffPositions[i3 + 1] += Math.cos(t * 0.4 + i) * 0.04 + 0.02;
        ffPositions[i3 + 2] += Math.sin(t * 0.5 + i * 2) * 0.05;

        if (ffPositions[i3 + 1] > 30) {
          ffPositions[i3 + 1] = -520;
        }
      }


      flowFieldGeo.attributes.position.needsUpdate = true;

      // --- POD FORMATION DOLPHIN SWIMMING IN OPEN VIEWABLE CANYON ---
      const podSpeed = 0.45;
      const podTime = t * podSpeed;

      // Master Pod Center trajectory traversing open viewable ocean canyon
      const masterX = Math.sin(podTime * 0.85) * 12.0 + Math.cos(podTime * 1.6) * 5.0;
      const masterY = -175.0 + Math.sin(podTime * 1.3) * 8.0;
      const masterZ = -475.0 + Math.cos(podTime) * 75.0;

      const nextPodTime = (t + 0.05) * podSpeed;
      const nextX = Math.sin(nextPodTime * 0.85) * 12.0 + Math.cos(nextPodTime * 1.6) * 5.0;
      const nextY = -175.0 + Math.sin(nextPodTime * 1.3) * 8.0;
      const nextZ = -475.0 + Math.cos(nextPodTime) * 75.0;

      const podForward = _podForward.set(nextX - masterX, nextY - masterY, nextZ - masterZ).normalize();
      const podRight = _podRight.crossVectors(podForward, _worldUp).normalize();
      const podUp = _podUp.crossVectors(podRight, podForward).normalize();

      allFishSchools.forEach((school) => {
        if (school.mixer) school.mixer.update(delta);
        if (school.group) {
          // Slight wobble to look alive, instead of continuously spinning
          school.group.rotation.y = Math.sin(t * 0.5 + school.offset) * 0.1;

          school.group.position.y = school.baseY + Math.sin(t * 1.5 + school.offset) * 4.0;

          // Move horizontally (X axis)
          school.group.position.x += school.direction * school.speed * delta;

          // Loop horizontally across the cavern width
          if (school.direction > 0 && school.group.position.x > 150) {
            school.group.position.x = -150;
            school.group.position.y = school.baseY + (Math.random() - 0.5) * 40;
            school.group.position.z = school.baseZ + (Math.random() - 0.5) * 40;
          } else if (school.direction < 0 && school.group.position.x < -150) {
            school.group.position.x = 150;
            school.group.position.y = school.baseY + (Math.random() - 0.5) * 40;
            school.group.position.z = school.baseZ + (Math.random() - 0.5) * 40;
          }
        }
      });

      allDolphins.forEach((dolphin, idx) => {
        if (dolphin.mixer) {
          dolphin.mixer.update(delta);
        }

        // Pod offset formation vectors (Leader + Left Wing + Right Wing)
        let offFwd = 0;
        let offRight = 0;
        let offUp = 0;

        if (idx === 0) {
          offFwd = 0;
          offRight = 0;
          offUp = 0;
        } else if (idx === 1) {
          offFwd = -6.5 + Math.sin(t * 1.5) * 1.2;
          offRight = -7.0 + Math.cos(t * 1.2) * 1.5;
          offUp = 2.8 + Math.sin(t * 1.8) * 1.0;
        } else {
          offFwd = -8.0 + Math.cos(t * 1.4) * 1.2;
          offRight = 7.0 + Math.sin(t * 1.1) * 1.5;
          offUp = -2.2 + Math.cos(t * 1.6) * 1.0;
        }

        const dPos = _dolphinPos.set(masterX, masterY, masterZ)
          .addScaledVector(podForward, offFwd)
          .addScaledVector(podRight, offRight)
          .addScaledVector(podUp, offUp);

        dolphin.group.position.copy(dPos);

        const targetQuat = _dolphinTargetQuat.setFromUnitVectors(
          _unitZ,
          podForward
        );
        const rollAngle = Math.sin(podTime * 1.8 + idx * 0.8) * 0.38;
        targetQuat.multiply(_dolphinRollQuat.setFromAxisAngle(podForward, rollAngle));
        dolphin.group.quaternion.slerp(targetQuat, 0.15);

      });

      // Update Rising Bubbles & Floating Water Balls
      bubbleMat.uniforms.uTime.value = t;
      shimmerMat.uniforms.uTime.value = t;
      dustMat.uniforms.uTime.value = t;
      ballMat.uniforms.uTime.value = t;
      seabedWaveMat.uniforms.uTime.value = t;
      floatingParticlesMat.uniforms.uTime.value = t;
      causticUniforms.uTime.value = t;
      shaftUniforms.uTime.value = t;

      // Pulse Portal Ring Backlight
      portalBackLight.intensity = 8.0 + Math.sin(t * 2.5) * 3.0;

      // Rotate top glowing central crystal shrines and animate 3D Holographic Event Title Plaques
      for (const xtal of crystalShrineMeshes) {
        if (xtal) {
          xtal.rotation.y = t * 0.8;
        }
      }

      // Make the fish school migrate between Event 1, 2, and 3
      if (fishGroup) {
        const speed = 14.0; // Migration speed (units per second)
        let totalDist = 0;
        const distances = [];
        for (let i = 0; i < _fishPathPoints.length; i++) {
          const p1 = _fishPathPoints[i];
          const p2 = _fishPathPoints[(i + 1) % _fishPathPoints.length];
          const d = p1.distanceTo(p2);
          distances.push(d);
          totalDist += d;
        }

        const cycleTime = totalDist / speed;
        // Add a large time offset so they don't always start at Event 1 at t=0
        const currentDist = ((t + 100) % cycleTime) * speed;

        let dAccum = 0;
        for (let i = 0; i < _fishPathPoints.length; i++) {
          if (currentDist <= dAccum + distances[i]) {
            const progress = (currentDist - dAccum) / distances[i];
            const p1 = _fishPathPoints[i];
            const p2 = _fishPathPoints[(i + 1) % _fishPathPoints.length];
            _fishTarget.lerpVectors(p1, p2, progress);

            // Look ahead to rotate the fish group towards travel direction
            const lookAheadDist = currentDist + 1.0;
            const lookAheadCycle = lookAheadDist % totalDist;
            let dAccumAhead = 0;
            const lookTarget = new THREE.Vector3();
            for (let j = 0; j < _fishPathPoints.length; j++) {
              if (lookAheadCycle <= dAccumAhead + distances[j]) {
                const progressAhead = (lookAheadCycle - dAccumAhead) / distances[j];
                const p1Ahead = _fishPathPoints[j];
                const p2Ahead = _fishPathPoints[(j + 1) % _fishPathPoints.length];
                lookTarget.lerpVectors(p1Ahead, p2Ahead, progressAhead);
                fishGroup.lookAt(lookTarget);
                break;
              }
              dAccumAhead += distances[j];
            }

            fishGroup.position.copy(_fishTarget);
            break;
          }
          dAccum += distances[i];
        }
      }

      // School-Formation helper function (Teardrop Spindle)
      const applySchoolFormation = (simulation, dt, speed, length, maxRadius) => {
        const lerpFactor = Math.min(2.5 * dt, 1.0);
        const totalFish = simulation.fish.length;

        for (let i = 0; i < totalFish; i++) {
          const fish = simulation.fish[i];
          const p = i / totalFish;

          // Math.sin(p * Math.PI) creates a curve that starts at 0, goes to 1 in the middle, and back to 0
          const radius = Math.sin(p * Math.PI) * maxRadius;
          const theta = i * 2.39996; // Golden angle for even distribution

          const targetX = Math.cos(theta) * radius;
          const targetY = Math.sin(theta) * radius;
          const targetZ = p * length; // Stretch them backwards

          fish.position.lerp(_fishTarget.set(targetX, targetY, targetZ), lerpFactor);
          // Force velocity to point locally "forward" (-Z) so they animate swimming continuously
          fish.velocity.set(0, 0, -speed);
        }
      };

      // --- RIPPLE AQUARIUM FISH ANIMATION UPDATE ---
      const dt = Math.min(clock.getDelta(), 1 / 30);
      if (dt > 0) {
        sardineSimulation.update(dt);
        koiSimulation.update(dt);

        applySchoolFormation(sardineSimulation, dt, 14.0, 45.0, 8.0);
        applySchoolFormation(koiSimulation, dt, 14.0, 15.0, 4.0);

        if (sardineMesh) {
          updateFishInstances(sardineMesh, sardineSimulation.fish);
        }
        if (koiMesh) {
          updateFishInstances(koiMesh, koiSimulation.fish);
        }
        if (clownfishSchoolObj) {
          const timeMs = performance.now() * 0.001;
          clownfishSchoolObj.update(timeMs, dt);
        }
      }

      postPortalMineralGroups.forEach((group, index) => {
        group.rotation.z = t * (0.025 + index * 0.004);
      });

      for (let b = 0; b < bannerMeshes.length; b++) {
        const bMesh = bannerMeshes[b];
        const node = eventNodes[b];
        const bGroup = eventBannerGroups[node.id];
        const baseRot = node.bannerPos.rotY;

        // Subtle gentle floating movement
        if (bGroup) {
          bGroup.position.y = node.pos.y + posterAnchorY + Math.sin(t * 0.9 + b) * 0.16;
        }
        bMesh.rotation.z = Math.sin(t * 1.1 + b) * 0.025;
        bMesh.rotation.y = baseRot + Math.cos(t * 0.7 + b) * 0.02;

        // Camera distance-based opacity & scale lerping for all 10 event posters
        const zDist = Math.abs(camState.z - node.pos.z);
        let targetOpacity = 0.55;
        let targetScale = 0.88;

        if (zDist < 120) {
          const factor = 1.0 - zDist / 120;
          targetOpacity = 0.55 + factor * 0.45; // Smoothly reaches 1.0 when close
          targetScale = 0.88 + factor * 0.12;   // Smoothly reaches 1.0 when close
        }

        if (bMesh.material) {
          bMesh.material.opacity = THREE.MathUtils.lerp(bMesh.material.opacity || 1.0, targetOpacity, 0.15);
        }
        bMesh.scale.setScalar(THREE.MathUtils.lerp(bMesh.scale.x, targetScale, 0.15));
      }

      // Animate Waving Sea Grass / Kelp Strands in Current
      for (const k of kelpInstances) {
        k.mesh.rotation.z = Math.sin(t * k.speed + k.phase) * 0.18;
        k.mesh.rotation.x = Math.cos(t * k.speed * 0.8 + k.phase) * 0.12;
      }

      // --- FISH SCHOOLS: steered swimming rather than fixed oscillation ---
      // Natural Subtle Underwater Floating Buoyancy Effect
      const floatY = Math.sin(t * 0.4) * 0.35;
      const floatX = Math.cos(t * 0.3) * 0.25;
      const floatRotZ = Math.sin(t * 0.2) * 0.008;

      // Smooth Dynamic Camera FOV Transitions (Fast travel vs Hero Close-up)
      if (camState.fov && Math.abs(camera.fov - camState.fov) > 0.05) {
        const fovLerp = (isMobile ? 0.10 : 0.07) * (camState.z < -245 && camState.z > -560 ? 0.4 : 1.0);
        camera.fov += (camState.fov - camera.fov) * fovLerp;
        camera.updateProjectionMatrix();
      }

      // Parallax Mouse/Touch Camera Drifting
      const parallaxEase = isMobile ? 0.03 : 0.05;
      const parallaxStrength = isMobile ? 0.8 : 1.6;
      mouse.x += (targetMouse.x - mouse.x) * parallaxEase;
      mouse.y += (targetMouse.y - mouse.y) * parallaxEase;

      // Calculate frame travel velocity vector & physical movement speed
      const vx = camState.x - lastCamPos.x;
      const vy = camState.y - lastCamPos.y;
      const vz = camState.z - lastCamPos.z;
      lastCamPos.set(camState.x, camState.y, camState.z);

      const moveSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);

      // Dynamic micro-banking roll on lateral turns (capped at ±0.07 rads / ~4°, zero while passing through stargate center)
      const rawBank = Math.max(-0.07, Math.min(0.07, -vx * 0.018));
      const targetBank = camState.z > -245 ? 0 : rawBank;
      currentBank += (targetBank - currentBank) * (isMobile ? 0.12 : 0.08);

      // VELOCITY-INDEPENDENT & DISTANCE-BASED SPEED DAMPENING ZONES (Events 01, 02 & 03)
      let eventSpeedScale = 1.0;
      let event1RightArcOffset = 0.0;

      // Event 01 (Coding) Slowdown Zone
      if (camState.z < -245 && camState.z > -350) {
        const event1ShrinePos = _eventShrinePositions[1];
        const distToShrine = smoothCamPos.distanceTo(event1ShrinePos);

        if (distToShrine > 65) {
          eventSpeedScale = 1.0;
        } else if (distToShrine > 42) {
          const t = (distToShrine - 42) / 23;
          eventSpeedScale = 0.08 + 0.92 * (t * t * (3 - 2 * t));
        } else {
          eventSpeedScale = 0.08;
        }

        if (distToShrine < 60) {
          const arcWeight = Math.sin(Math.min(1.0, Math.max(0.0, (60 - distToShrine) / 35)) * Math.PI);
          event1RightArcOffset = 7.5 * arcWeight;
        }

        const fastScrollVelocity = Math.abs(vz);
        if (fastScrollVelocity > 0.4 && distToShrine < 55) {
          const fastDamp = Math.min(0.65, (fastScrollVelocity - 0.4) * 0.25);
          eventSpeedScale *= (1.0 - fastDamp);
        }

        if (camState.z < -310) {
          const exitProgress = Math.min(1.0, Math.max(0.0, (-310 - camState.z) / 25));
          const exitFactor = exitProgress * exitProgress;
          eventSpeedScale = eventSpeedScale + (1.0 - eventSpeedScale) * exitFactor;
          event1RightArcOffset *= (1.0 - exitFactor);
        }
      }
      // Event 02 (Web Design) Slowdown Zone
      else if (camState.z <= -350 && camState.z > -470) {
        const event2ShrinePos = _eventShrinePositions[2];
        const distToShrine = smoothCamPos.distanceTo(event2ShrinePos);

        if (distToShrine > 65) {
          eventSpeedScale = 1.0;
        } else if (distToShrine > 42) {
          const t = (distToShrine - 42) / 23;
          eventSpeedScale = 0.08 + 0.92 * (t * t * (3 - 2 * t));
        } else {
          eventSpeedScale = 0.08;
        }

        const fastScrollVelocity = Math.abs(vz);
        if (fastScrollVelocity > 0.4 && distToShrine < 55) {
          const fastDamp = Math.min(0.65, (fastScrollVelocity - 0.4) * 0.25);
          eventSpeedScale *= (1.0 - fastDamp);
        }

        if (camState.z < -435) {
          const exitProgress = Math.min(1.0, Math.max(0.0, (-435 - camState.z) / 25));
          const exitFactor = exitProgress * exitProgress;
          eventSpeedScale = eventSpeedScale + (1.0 - eventSpeedScale) * exitFactor;
        }
      }
      // Event 03 (IT Quiz) Slowdown Zone
      else if (camState.z <= -470 && camState.z > -560) {
        const event3ShrinePos = _eventShrinePositions[3];
        const distToShrine = smoothCamPos.distanceTo(event3ShrinePos);

        if (distToShrine > 65) {
          eventSpeedScale = 1.0;
        } else if (distToShrine > 42) {
          const t = (distToShrine - 42) / 23;
          eventSpeedScale = 0.08 + 0.92 * (t * t * (3 - 2 * t));
        } else {
          eventSpeedScale = 0.08;
        }

        const fastScrollVelocity = Math.abs(vz);
        if (fastScrollVelocity > 0.4 && distToShrine < 55) {
          const fastDamp = Math.min(0.65, (fastScrollVelocity - 0.4) * 0.25);
          eventSpeedScale *= (1.0 - fastDamp);
        }

        if (camState.z < -515) {
          const exitProgress = Math.min(1.0, Math.max(0.0, (-515 - camState.z) / 25));
          const exitFactor = exitProgress * exitProgress;
          eventSpeedScale = eventSpeedScale + (1.0 - eventSpeedScale) * exitFactor;
        }
      }
      // Event 06 (Surprise Event) Slowdown Zone
      else if (camState.z <= -790 && camState.z > -895) {
        const event6ShrinePos = _eventShrinePositions[6];
        const distToShrine = smoothCamPos.distanceTo(event6ShrinePos);

        if (distToShrine > 65) {
          eventSpeedScale = 1.0;
        } else if (distToShrine > 42) {
          const t = (distToShrine - 42) / 23;
          eventSpeedScale = 0.08 + 0.92 * (t * t * (3 - 2 * t));
        } else {
          eventSpeedScale = 0.08;
        }

        const fastScrollVelocity = Math.abs(vz);
        if (fastScrollVelocity > 0.4 && distToShrine < 55) {
          const fastDamp = Math.min(0.65, (fastScrollVelocity - 0.4) * 0.25);
          eventSpeedScale *= (1.0 - fastDamp);
        }

        if (camState.z < -875) {
          const exitProgress = Math.min(1.0, Math.max(0.0, (-875 - camState.z) / 25));
          const exitFactor = exitProgress * exitProgress;
          eventSpeedScale = eventSpeedScale + (1.0 - eventSpeedScale) * exitFactor;
        }
      }
      // Event 07 (IT Manager Spire) Slowdown Zone
      else if (camState.z <= -860 && camState.z > -945) {
        const event7ShrinePos = _eventShrinePositions[7];
        const distToShrine = smoothCamPos.distanceTo(event7ShrinePos);

        if (distToShrine > 65) {
          eventSpeedScale = 1.0;
        } else if (distToShrine > 42) {
          const t = (distToShrine - 42) / 23;
          eventSpeedScale = 0.08 + 0.92 * (t * t * (3 - 2 * t));
        } else {
          eventSpeedScale = 0.08;
        }

        const fastScrollVelocity = Math.abs(vz);
        if (fastScrollVelocity > 0.4 && distToShrine < 55) {
          const fastDamp = Math.min(0.65, (fastScrollVelocity - 0.4) * 0.25);
          eventSpeedScale *= (1.0 - fastDamp);
        }

        if (camState.z < -915) {
          const exitProgress = Math.min(1.0, Math.max(0.0, (-915 - camState.z) / 25));
          const exitFactor = exitProgress * exitProgress;
          eventSpeedScale = eventSpeedScale + (1.0 - eventSpeedScale) * exitFactor;
        }
      }
      // Event 08 (Startup Event) Slowdown Zone
      else if (camState.z <= -945 && camState.z > -1050) {
        const event8ShrinePos = _eventShrinePositions[8];
        const distToShrine = smoothCamPos.distanceTo(event8ShrinePos);

        if (distToShrine > 65) {
          eventSpeedScale = 1.0;
        } else if (distToShrine > 42) {
          const t = (distToShrine - 42) / 23;
          eventSpeedScale = 0.08 + 0.92 * (t * t * (3 - 2 * t));
        } else {
          eventSpeedScale = 0.08;
        }

        const fastScrollVelocity = Math.abs(vz);
        if (fastScrollVelocity > 0.4 && distToShrine < 55) {
          const fastDamp = Math.min(0.65, (fastScrollVelocity - 0.4) * 0.25);
          eventSpeedScale *= (1.0 - fastDamp);
        }

        if (camState.z < -1025) {
          const exitProgress = Math.min(1.0, Math.max(0.0, (-1025 - camState.z) / 25));
          const exitFactor = exitProgress * exitProgress;
          eventSpeedScale = eventSpeedScale + (1.0 - eventSpeedScale) * exitFactor;
        }
      }
      // Event 09 (Dance) Slowdown Zone
      else if (camState.z <= -1050 && camState.z > -1150) {
        const event9ShrinePos = _eventShrinePositions[9];
        const distToShrine = smoothCamPos.distanceTo(event9ShrinePos);

        if (distToShrine > 65) {
          eventSpeedScale = 1.0;
        } else if (distToShrine > 42) {
          const t = (distToShrine - 42) / 23;
          eventSpeedScale = 0.08 + 0.92 * (t * t * (3 - 2 * t));
        } else {
          eventSpeedScale = 0.08;
        }

        const fastScrollVelocity = Math.abs(vz);
        if (fastScrollVelocity > 0.4 && distToShrine < 55) {
          const fastDamp = Math.min(0.65, (fastScrollVelocity - 0.4) * 0.25);
          eventSpeedScale *= (1.0 - fastDamp);
        }

        if (camState.z < -1125) {
          const exitProgress = Math.min(1.0, Math.max(0.0, (-1125 - camState.z) / 25));
          const exitFactor = exitProgress * exitProgress;
          eventSpeedScale = eventSpeedScale + (1.0 - eventSpeedScale) * exitFactor;
        }
      }
      // Event 10 (Photography & Videography) Slowdown Zone
      else if (camState.z <= -1150) {
        const event10ShrinePos = _eventShrinePositions[10];
        const distToShrine = smoothCamPos.distanceTo(event10ShrinePos);

        if (distToShrine > 65) {
          eventSpeedScale = 1.0;
        } else if (distToShrine > 42) {
          const t = (distToShrine - 42) / 23;
          eventSpeedScale = 0.08 + 0.92 * (t * t * (3 - 2 * t));
        } else {
          eventSpeedScale = 0.08;
        }

        const fastScrollVelocity = Math.abs(vz);
        if (fastScrollVelocity > 0.4 && distToShrine < 55) {
          const fastDamp = Math.min(0.65, (fastScrollVelocity - 0.4) * 0.25);
          eventSpeedScale *= (1.0 - fastDamp);
        }
      }

      // Position spring lerp for smooth, liquid camera movement
      const basePosLerp = isMobile ? 0.10 : 0.07;
      const effectivePosLerp = basePosLerp * eventSpeedScale;
      smoothCamPos.lerp(_smoothCamTarget.set(camState.x + event1RightArcOffset, camState.y, camState.z), effectivePosLerp);

      // Surface-to-Portal & Event Landmark focus:
      // GSAP keyframes define precise look-at targets (targetX, targetY, targetZ) for cinematic reveals.
      desiredLookAt.set(camState.targetX, camState.targetY, camState.targetZ);
      const baseLookLerp = isMobile ? 0.10 : 0.07;
      const effectiveLookLerp = baseLookLerp * eventSpeedScale;
      currentLookAt.lerp(desiredLookAt, effectiveLookLerp);

      // Portal Center Tunnel Guidance: Guarantee camera passes STRAIGHT THROUGH CENTER of Stargate Ring (z: -160 to -215)
      let currentParallax = parallaxStrength;
      if (camState.z <= -160 && camState.z >= -215) {
        const portalCenterFactor = THREE.MathUtils.clamp(1.0 - Math.abs(camState.z - (-190)) / 25.0, 0.0, 1.0);
        const alignBlend = THREE.MathUtils.smoothstep(portalCenterFactor, 0.0, 1.0);
        smoothCamPos.x = THREE.MathUtils.lerp(smoothCamPos.x, 0.0, alignBlend);
        smoothCamPos.y = THREE.MathUtils.lerp(smoothCamPos.y, -110.0, alignBlend);
        currentParallax *= (1.0 - alignBlend);
      }

      camera.position.set(
        smoothCamPos.x + mouse.x * currentParallax + floatX,
        smoothCamPos.y + mouse.y * currentParallax + floatY,
        smoothCamPos.z
      );

      // A soft, inactive-in-normal-travel guard keeps the post-portal camera
      // outside shrine and platform envelopes if a future keyframe is tightened.
      if (camState.z < -245) {
        for (const node of eventNodes) {
          safetyOffset.set(
            camera.position.x - node.pos.x,
            camera.position.y - (node.pos.y + 7.2),
            camera.position.z - node.pos.z
          );
          const shrineDistance = safetyOffset.length();
          if (shrineDistance < 11.5) {
            safetyOffset.multiplyScalar(1 / Math.max(shrineDistance, 0.001));
            safeCameraPosition.set(
              node.pos.x + safetyOffset.x * 11.5,
              node.pos.y + 7.2 + safetyOffset.y * 11.5,
              node.pos.z + safetyOffset.z * 11.5
            );
            camera.position.lerp(safeCameraPosition, 0.18);
          }
        }
      }

      // Smooth underwater steadicam look-ahead gaze with micro-banking roll
      camera.lookAt(
        currentLookAt.x + mouse.x * (isMobile ? 0.6 : 1.2),
        currentLookAt.y + mouse.y * (isMobile ? 0.6 : 1.2),
        currentLookAt.z
      );
      camera.rotation.z = floatRotZ + currentBank;

      const renderStart = performance.now();
      renderer.render(scene, camera);
      const renderTime = performance.now() - renderStart;
      if (renderTime > 16.6 && scrollProgress > 0) {
        console.warn(`[Performance] Slow frame render inside animate loop: ${renderTime.toFixed(2)}ms`);
      }

      // Active Event state determination based on camera Z position depth
      let currentActiveId = null;
      if (camState.z < -140) {
        let minZDist = Infinity;
        eventNodes.forEach((node) => {
          const zDist = Math.abs(camState.z - node.pos.z);
          if (zDist < minZDist) {
            minZDist = zDist;
            currentActiveId = node.id;
          }
        });
      }

      if (currentActiveId && currentActiveId !== activeEventRef.current) {
        activeEventRef.current = currentActiveId;
        setActiveEvent(currentActiveId);
      }

      // Ensure all event banners remain visible on their respective rock platforms
      eventNodes.forEach((node) => {
        const group = eventBannerGroups[node.id];
        if (group) {
          group.visible = true;
        }
      });


    }
    animate();

    // --- CRITICAL ASSET PRELOAD -> PREPARE -> FIRST FRAME -> REVEAL ---
    // Progress reflects real transferred bytes. The loader is only dismissed once
    // every critical asset is decoded, applied to the scene, and a complete frame
    // has actually been rendered — which is what prevents texture/model pop-in.
    (async () => {
      // "scene" is pre-declared for "/" in constants/preloadManifest.js, so the gate
      // cannot reveal the page in the window between the bytes landing and this
      // component registering.
      const gate = register("scene");
      try {
        // The preload gate is already fetching these exact bytes; assetLoader dedupes
        // the in-flight request, so this resolves without a second download. Progress
        // for the transfer belongs to the gate, hence the no-op callback here.
        const { results, failures } = await loadAssets(
          CRITICAL_ASSETS,
          () => {},
          abortController.signal
        );

        if (sceneDisposed) return;
        gate.report(0.15);

        if (failures.length > 0) {
          failures.forEach((f) =>
            console.error("[Aquasaga] failed:", f.asset.url, f.error)
          );
          // Only block the experience if something the first frame truly needs is missing.
          const fatal = failures.some((f) => f.asset.kind === "texture");
          if (fatal) {
            gate.fail(
              `${failures.length} ocean asset${failures.length > 1 ? "s" : ""} could not be loaded.`
            );
            return;
          }
        }

        // Decode and apply textures (no second network request — decoded from bytes).
        if (results.waterNormals) {
          const tex = await blobToTexture(THREE, results.waterNormals, { srgb: false });
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          waterNormals.image = tex.image;
          waterNormals.needsUpdate = true;
        }

        gate.report(0.3);

        if (results.dolphin) {
          await buildDolphinsFromBuffer(await results.dolphin.arrayBuffer());
        }

        gate.report(0.45);

        if (results.fishSchool) {
          await buildFishSchoolFromBuffer(await results.fishSchool.arrayBuffer());
        }

        // The geometry is on the GPU now, so ~34MB of Blob is pure waste in memory.
        // A retry re-reads it from the Cache API (disk), not the network.
        releaseAssets(["dolphin", "fishSchool"]);
        gate.report(0.75);

        if (sceneDisposed) return;

        // Load the HDR environment map so it is active BEFORE compiling shaders
        const loadHdrEnvPromise = () => {
          return new Promise((resolve) => {
            const rgbeLoader = new RGBELoader(manager);
            rgbeLoader.load(
              "/hdri/spiaggia_di_mondello_1k.hdr",
              (texture) => {
                if (sceneDisposed) {
                  texture.dispose();
                  resolve();
                  return;
                }
                texture.mapping = THREE.EquirectangularReflectionMapping;
                const cubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
                exrEnvironmentTexture = cubeRenderTarget.texture;
                scene.background = cubeRenderTarget.texture;
                scene.environment = cubeRenderTarget.texture;
                fallbackEnvTarget.dispose();
                texture.dispose();
                resolve();
              },
              undefined,
              (err) => {
                console.warn("Failed to load HDR environment, using fallback gradient.", err);
                resolve();
              }
            );
          });
        };

        await loadHdrEnvPromise();

        if (sceneDisposed) return;
        gate.report(0.9);

        // Force a full render so every material/shader is compiled and uploaded
        // BEFORE the curtain lifts, rather than hitching on the first visible frame.
        // Pre-warm underwater shaders by temporarily making all geometry visible
        // and disabling frustum culling so renderer.compile() and renderer.render()
        // catch and upload every shader program and texture, preventing first-scroll hitch.
        scene.traverse((child) => {
          if (child.isMesh || child.isPoints || child.isLine) {
            child._wasVisible = child.visible;
            child._wasFrustumCulled = child.frustumCulled;
            child.visible = true;
            child.frustumCulled = false;
          }
        });

        renderer.compile(scene, camera);
        renderer.render(scene, camera);

        // Restore original visibility and frustum culling states
        scene.traverse((child) => {
          if (child.isMesh || child.isPoints || child.isLine) {
            if (child._wasVisible !== undefined) child.visible = child._wasVisible;
            if (child._wasFrustumCulled !== undefined) child.frustumCulled = child._wasFrustumCulled;
          }
        });

        // Hand the browser two frames to actually present that work, then reveal.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (sceneDisposed) return;
            gate.done();
          });
        });
      } catch (err) {
        if (err && err.name === "AbortError") return;
        console.error("[Aquasaga] preload failed:", err);
        if (!sceneDisposed) gate.fail("Could not load the ocean environment.");
      }
    })();

    let resizeRafId = null;
    function applyResize() {
      resizeRafId = null;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
      renderer.setSize(w, h);
    }
    function handleResize() {
      // Coalesce bursts of resize/orientation events (drag-resize, DPI change,
      // mobile browser chrome show/hide) into a single update per frame.
      if (resizeRafId !== null) return;
      resizeRafId = requestAnimationFrame(applyResize);
    }
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      sceneDisposed = true;
      abortController.abort();
      pmremGenerator.dispose();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handlePortalClick);
      if (isMobile) {
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      }
      cancelAnimationFrame(animationId);
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      container.removeChild(renderer.domElement);
      renderer.dispose();
      waterGeometry.dispose();
      waterCeilingGeo.dispose();
      waterCeilingMat.dispose();
      for (const b of bannerMeshes) {
        if (b.material.map) b.material.map.dispose();
        b.material.dispose();
        b.geometry.dispose();
      }
      for (const i of infoMeshes) {
        if (i.material.map) i.material.map.dispose();
        i.material.dispose();
        i.geometry.dispose();
      }
      iceberg.geometry.dispose();
      iceberg2.geometry.dispose();
      icePlateGeo.dispose();
      iceMaterial.dispose();
      for (const g of smallIceGeos) g.dispose();
      caveGeometry.dispose();
      caveMaterial.dispose();
      cliffWallMat.dispose();
      ruinStoneMat.dispose();
      ruinGlowMat.dispose();

      portalRingGeo.dispose();
      keystoneGeo.dispose();
      portalDiscGeo.dispose();
      portalDiscMat.dispose();
      portalBackdropGeo.dispose();
      portalBackdropMat.dispose();
      flowFieldGeo.dispose();
      flowFieldMat.dispose();
      cliffRockMat.dispose();
      stairStoneMat.dispose();
      cyanCrystalMat.dispose();
      mineralAccentMat.dispose();
      causticMat.dispose();
      lightShaftMat.dispose();
      for (const c of cliffMeshes) c.geometry.dispose();
      for (const b of bannerMeshes) {
        b.geometry.dispose();
        if (b.material && b.material.map) {
          b.material.map.dispose();
        }
        if (b.material) {
          b.material.dispose();
        }
      }
      terrainGeo.dispose();
      terrainMat.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      shimmerGeo.dispose();
      shimmerMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      ballGeo.dispose();
      ballMat.dispose();
      seabedWaveGeo.dispose();
      seabedWaveMat.dispose();
      floatingParticlesGeo.dispose();
      floatingParticlesMat.dispose();
      kelpGeo.dispose();
      kelpMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
    // retryToken lets the provider's Retry button tear down and rebuild the whole
    // scene; `register` is stable across renders.
  }, [retryToken, register]);

  const hudVisible = scrollProgress >= 4;
  const isInsideNewWorld = scrollProgress > 42;

  return (
    <>
      <div ref={wrapperRef} style={{ height: "1600vh", position: "relative", backgroundColor: "#011728" }}>
        {/* The loader overlay lives in <PreloadProvider>, above the whole app. */}

        {/* 3D Canvas Container */}
        <div ref={containerRef} style={{ position: "sticky", top: 0, width: "100vw", height: "100vh", overflow: "hidden" }}>
          <div className="pointer-events-none fixed inset-0 z-50 border-[2px] border-cyan-500/20 opacity-90" />



          {/* Surface Semaphore 2K26 Hero UI */}
          <div
            ref={heroUiRef}
            className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-6 md:p-12 text-white"
          >


            <main className="relative flex flex-col items-center justify-center text-center my-auto w-full py-20">
              {/* Dark gradient behind text to ensure readability against the bright moon */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(2,6,23,0.85)_0%,_rgba(0,0,0,0)_70%)] -z-10 pointer-events-none" />

              <h1 className="font-mono text-5xl md:text-[7rem] font-black tracking-[0.2em] text-white drop-shadow-[0_0_30px_rgba(0,255,255,0.9)] mb-2 select-none leading-none">
                SEMAPHORE
              </h1>
              <h2 className="font-mono text-xl md:text-3xl font-extrabold tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] mb-6 select-none ml-2">
                2 K 2 6
              </h2>
              <span className="font-mono text-xs md:text-sm tracking-[0.3em] text-cyan-50 uppercase font-bold drop-shadow-[0_2px_5px_rgba(0,0,0,1)]">
                NATIONAL LEVEL MCA TECH FEST - NMAMIT NITTE
              </span>
            </main>

            <footer className="flex justify-between items-end w-full">
            </footer>
          </div>

          {/* Main Cyber Ocean HUD Overlay */}
          <div className={`ui-layer ${hudVisible ? "visible" : ""}`} id="ui-layer">
            <div className="grid-overlay" />
            <div className="vignette" />



            {/* Animated Scroll Down Mouse Logo (Visible only at beginning surface view, scrollProgress < 10) */}
            <div
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none transition-all duration-500 font-mono select-none ${scrollProgress < 10 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
            >
              <div className="relative w-6 h-10 rounded-full border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(0,255,255,0.4)] flex justify-center pt-2 bg-[#010c18]/90">
                <div className="w-1.5 h-3 rounded-full bg-cyan-300 animate-bounce shadow-[0_0_8px_rgba(0,255,255,0.9)]" />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold tracking-[0.25em] text-cyan-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] uppercase">
                <span>SCROLL TO DIVE</span>
                <span className="text-cyan-400 text-xs animate-bounce">↓</span>
              </div>
            </div>

            {/* Right-Side Down Telemetry HUD Readout (Clean Panel-less design) */}
            <div className="fixed bottom-6 md:bottom-8 right-6 md:right-10 z-50 flex flex-col items-end gap-1.5 font-mono text-right select-none pointer-events-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">

              <div className="flex items-baseline gap-2 text-cyan-100 font-bold text-sm tracking-wider">
                <span className="text-[10px] text-cyan-400/70 font-semibold uppercase">DEPTH:</span>
                <span className="text-cyan-300 font-extrabold text-base">{stats.depth}</span>
                <span className="text-[10px] text-cyan-400/80">M</span>
              </div>

              <div className="flex items-baseline gap-2 text-cyan-100 font-bold text-sm tracking-wider">
                <span className="text-[10px] text-cyan-400/70 font-semibold uppercase">SPEED:</span>
                <span className="text-cyan-300 font-extrabold text-base">{stats.speed}</span>
                <span className="text-[10px] text-cyan-400/80">M/S</span>
              </div>
            </div>
          </div>

          {/* Minimal Top-Left Speaker Audio Toggle Icon */}
          <button
            onClick={toggleAudio}
            className={`fixed top-6 left-6 md:top-8 md:left-10 z-[80] p-1 text-cyan-300 hover:text-white transition-all duration-500 cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] ${scrollProgress >= 4 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
              }`}
            aria-label="Toggle Audio"
            title={isAudioPlaying ? "Mute Audio" : "Play Audio"}
          >
            {isAudioPlaying ? (
              <svg className="w-6 h-6 fill-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 fill-cyan-400/50 hover:fill-cyan-300" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            )}
          </button>

          {/* Interactive Event Detail Modal when clicking on any Event Portal, Pin, or 3D Banner */}
          {selectedEvent && (
            <EventInfoModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}

          {/* Final End Screen after the event scroll (Fades in at the very bottom) */}
          <div
            className={`fixed inset-0 bg-[#010a13] flex flex-col items-center justify-center z-[100] transition-opacity duration-1000 ${scrollProgress >= 99 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
          >
            {/* Subtle atmospheric lighting background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,180,255,0.15)_0%,_rgba(0,0,0,0)_60%)] -z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/textures/waternormals.jpg')] opacity-5 bg-cover bg-center mix-blend-overlay pointer-events-none" />

            {/* Semaphore Logo */}
            <div className="z-10 mb-12 relative flex items-center justify-center">
              <div className="absolute w-3/4 h-3/4 bg-cyan-400/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
              <img
  src="https://res.cloudinary.com/zuxdlzob/image/upload/v1787802540/semaphore_logo.png"
  alt="Semaphore 2026 Logo"
  className="w-[80vw] max-w-[600px] h-auto object-contain relative z-10 drop-shadow-[0_0_25px_rgba(0,255,255,0.4)] hover:scale-105 transition-transform duration-700"
/>
            </div>

            {/* Standalone Visual Register Button (No link) */}
            <button
              type="button"
              className="z-10 px-12 py-4 bg-cyan-600/80 hover:bg-cyan-500 text-white font-mono font-bold tracking-[0.2em] rounded-lg transition-all duration-500 shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:shadow-[0_0_50px_rgba(0,255,255,0.8)] hover:-translate-y-1 text-xl md:text-2xl border border-cyan-400/30 hover:border-cyan-300"
            >
              REGISTER
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
