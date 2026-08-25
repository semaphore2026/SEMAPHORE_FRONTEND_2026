/**
 * Scene Camera Keyframe Animation Choreography
 * Populates the GSAP timeline with camera position, target vector, FOV, and fog density transitions.
 * 
 * STRICT NON-OVERLAPPING TIMELINE KEYFRAMES:
 * - Every transition is strictly contiguous to prevent GSAP property collision freezes.
 * - Pre-portal camera animations (Phase 1 to 4) remain 100% UNCHANGED in behavior.
 * - Post-portal event camera sequences (Events 01-10) use balanced focal targets between
 *   crystal shrines & title posters with tailored orbits for each event.
 */

export function buildSceneCameraTimeline(tl, camState) {
  if (!tl || !camState) return;

  // =========================================================================
  // PRE-PORTAL SYSTEM — STRICTLY UNCHANGED (Phase 1 to Phase 4)
  // =========================================================================

  // Phase 1: Surface Ocean View (0 - 1.5s) - Dive directly down into ocean
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

  // Phase 2: Align Camera with Deeper Submerged Main Portal Ring Center (1.5s - 4.0s)
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

  // Phase 3: Fly STRAIGHT THROUGH CENTER of Circular Portal Stargate (4.0s - 5.0s)
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

  // Phase 4: Clear Portal Area into Open Water (5.0s - 5.8s)
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

  // =========================================================================
  // POST-PORTAL CINEMATIC JOURNEY — CONTIGUOUS NON-OVERLAPPING KEYFRAMES
  // =========================================================================

  // EVENT 01 — CODING: Balanced Wide 3D Orbit -> Hero Reveal -> Inward Curve -> Exit (5.8s - 14.0s)
  // Balanced Target: (-19, -106, -315)
  tl.to(
    camState,
    {
      x: -18,
      y: -118,
      z: -265,
      targetX: -19,
      targetY: -106,
      targetZ: -315,
      fov: 64,
      fogDensity: 0.015,
      duration: 1.0,
      ease: "power2.inOut",
    },
    5.8
  );
  tl.to(
    camState,
    {
      x: -30,
      y: -99,
      z: -282,
      targetX: -19,
      targetY: -106,
      targetZ: -315,
      fov: 56,
      duration: 1.2,
      ease: "power2.out",
    },
    6.8
  );
  tl.to(
    camState,
    {
      x: -8,
      y: -91,
      z: -298,
      targetX: -19,
      targetY: -106,
      targetZ: -315,
      fov: 54,
      duration: 1.2,
      ease: "sine.inOut",
    },
    8.0
  );
  tl.to(
    camState,
    {
      x: 22,
      y: -86,
      z: -308,
      targetX: -19,
      targetY: -106,
      targetZ: -315,
      fov: 52,
      duration: 1.2,
      ease: "sine.inOut",
    },
    9.2
  );
  tl.to(
    camState,
    {
      x: 38,
      y: -94,
      z: -318,
      targetX: -19,
      targetY: -106,
      targetZ: -315,
      fov: 50,
      duration: 1.2,
      ease: "sine.inOut",
    },
    10.4
  );
  tl.to(
    camState,
    {
      x: 18,
      y: -104,
      z: -330,
      targetX: -19,
      targetY: -106,
      targetZ: -315,
      fov: 54,
      duration: 1.2,
      ease: "power2.inOut",
    },
    11.6
  );
  tl.to(
    camState,
    {
      x: 28,
      y: -124,
      z: -340,
      targetX: 19,
      targetY: -186,
      targetZ: -427,
      fov: 64,
      fogDensity: 0.016,
      duration: 1.2,
      ease: "power1.inOut",
    },
    12.8
  );

  // EVENT 02 — WEB DESIGN (14.0s - 20.0s)
  // Balanced Target: (19, -186, -427)
  tl.to(
    camState,
    {
      x: 42,
      y: -168,
      z: -350,
      targetX: 19,
      targetY: -186,
      targetZ: -427,
      fov: 68,
      fogDensity: 0.017,
      duration: 1.2,
      ease: "power2.out",
    },
    14.0
  );
  tl.to(
    camState,
    {
      x: 48,
      y: -176,
      z: -390,
      targetX: 19,
      targetY: -186,
      targetZ: -427,
      fov: 58,
      duration: 1.2,
      ease: "sine.inOut",
    },
    15.2
  );
  tl.to(
    camState,
    {
      x: 30,
      y: -174,
      z: -402,
      targetX: 19,
      targetY: -186,
      targetZ: -427,
      fov: 54,
      duration: 1.2,
      ease: "sine.inOut",
    },
    16.4
  );
  tl.to(
    camState,
    {
      x: 18,
      y: -176,
      z: -412,
      targetX: 19,
      targetY: -186,
      targetZ: -427,
      fov: 54,
      duration: 1.2,
      ease: "sine.inOut",
    },
    17.6
  );
  tl.to(
    camState,
    {
      x: -10,
      y: -195,
      z: -445,
      targetX: -29,
      targetY: -186,
      targetZ: -515,
      fov: 64,
      fogDensity: 0.018,
      duration: 1.2,
      ease: "power1.inOut",
    },
    18.8
  );

  // EVENT 03 — IT QUIZ (20.0s - 26.0s)
  // Balanced Target: (-29, -186, -515)
  tl.to(
    camState,
    {
      x: -18,
      y: -170,
      z: -442,
      targetX: -29,
      targetY: -186,
      targetZ: -515,
      fov: 70,
      fogDensity: 0.019,
      duration: 1.2,
      ease: "power2.out",
    },
    20.0
  );
  tl.to(
    camState,
    {
      x: -44,
      y: -176,
      z: -475,
      targetX: -29,
      targetY: -186,
      targetZ: -515,
      fov: 58,
      duration: 1.2,
      ease: "sine.inOut",
    },
    21.2
  );
  tl.to(
    camState,
    {
      x: -28,
      y: -174,
      z: -488,
      targetX: -29,
      targetY: -186,
      targetZ: -515,
      fov: 54,
      duration: 1.2,
      ease: "sine.inOut",
    },
    22.4
  );
  tl.to(
    camState,
    {
      x: -16,
      y: -176,
      z: -496,
      targetX: -29,
      targetY: -186,
      targetZ: -515,
      fov: 55,
      duration: 1.2,
      ease: "sine.inOut",
    },
    23.6
  );
  tl.to(
    camState,
    {
      x: 22,
      y: -200,
      z: -533,
      targetX: 29,
      targetY: -226,
      targetZ: -615,
      fov: 66,
      fogDensity: 0.020,
      duration: 1.2,
      ease: "power1.inOut",
    },
    24.8
  );

  // EVENT 04 — GAMING (26.0s - 30.8s)
  // Balanced Target: (29, -226, -615)
  tl.to(
    camState,
    {
      x: 18,
      y: -200,
      z: -528,
      targetX: 29,
      targetY: -226,
      targetZ: -615,
      fov: 72,
      fogDensity: 0.021,
      duration: 1.2,
      ease: "power2.out",
    },
    26.0
  );
  tl.to(
    camState,
    {
      x: 42,
      y: -218,
      z: -568,
      targetX: 29,
      targetY: -226,
      targetZ: -615,
      fov: 60,
      duration: 1.2,
      ease: "power1.inOut",
    },
    27.2
  );
  tl.to(
    camState,
    {
      x: 32,
      y: -216,
      z: -570,
      targetX: 29,
      targetY: -226,
      targetZ: -615,
      fov: 52,
      duration: 1.2,
      ease: "sine.inOut",
    },
    28.4
  );
  tl.to(
    camState,
    {
      x: -25,
      y: -216,
      z: -633,
      targetX: -32,
      targetY: -224,
      targetZ: -715,
      fov: 70,
      fogDensity: 0.0215,
      duration: 1.2,
      ease: "power1.inOut",
    },
    29.6
  );

  // EVENT 05 — TECH TALK (30.8s - 35.6s)
  // Balanced Target: (-32, -224, -715)
  tl.to(
    camState,
    {
      x: -15,
      y: -210,
      z: -628,
      targetX: -32,
      targetY: -224,
      targetZ: -715,
      fov: 64,
      fogDensity: 0.022,
      duration: 1.2,
      ease: "power1.out",
    },
    30.8
  );
  tl.to(
    camState,
    {
      x: -30,
      y: -222,
      z: -653,
      targetX: -32,
      targetY: -224,
      targetZ: -715,
      fov: 58,
      duration: 1.2,
      ease: "power1.inOut",
    },
    32.0
  );
  tl.to(
    camState,
    {
      x: -32,
      y: -220,
      z: -670,
      targetX: -32,
      targetY: -224,
      targetZ: -715,
      fov: 52,
      duration: 1.2,
      ease: "sine.inOut",
    },
    33.2
  );
  tl.to(
    camState,
    {
      x: 20,
      y: -260,
      z: -738,
      targetX: 29,
      targetY: -306,
      targetZ: -867,
      fov: 62,
      fogDensity: 0.023,
      duration: 1.2,
      ease: "power1.inOut",
    },
    34.4
  );

  // EVENT 06 — SURPRISE EVENT (35.6s - 42.8s)
  // Balanced Target: (29, -306, -867)
  tl.to(
    camState,
    {
      x: 14,
      y: -278,
      z: -785,
      targetX: 29,
      targetY: -306,
      targetZ: -867,
      fov: 66,
      fogDensity: 0.024,
      duration: 1.2,
      ease: "power2.out",
    },
    35.6
  );
  tl.to(
    camState,
    {
      x: 42,
      y: -292,
      z: -820,
      targetX: 29,
      targetY: -306,
      targetZ: -867,
      fov: 60,
      duration: 1.2,
      ease: "sine.inOut",
    },
    36.8
  );
  tl.to(
    camState,
    {
      x: 48,
      y: -298,
      z: -838,
      targetX: 29,
      targetY: -306,
      targetZ: -867,
      fov: 55,
      duration: 1.2,
      ease: "sine.inOut",
    },
    38.0
  );
  tl.to(
    camState,
    {
      x: 30,
      y: -294,
      z: -848,
      targetX: 29,
      targetY: -306,
      targetZ: -867,
      fov: 52,
      duration: 1.2,
      ease: "sine.inOut",
    },
    39.2
  );
  tl.to(
    camState,
    {
      x: 18,
      y: -296,
      z: -855,
      targetX: 29,
      targetY: -306,
      targetZ: -867,
      fov: 53,
      duration: 1.2,
      ease: "sine.inOut",
    },
    40.4
  );
  tl.to(
    camState,
    {
      x: -18,
      y: -315,
      z: -885,
      targetX: -29,
      targetY: -306,
      targetZ: -915,
      fov: 64,
      fogDensity: 0.0245,
      duration: 1.2,
      ease: "power1.inOut",
    },
    41.6
  );

  // EVENT 07 — IT MANAGER SPIRE (42.8s - 48.8s)
  // Balanced Target: (-29, -306, -915)
  tl.to(
    camState,
    {
      x: -10,
      y: -284,
      z: -876,
      targetX: -29,
      targetY: -306,
      targetZ: -915,
      fov: 64,
      fogDensity: 0.025,
      duration: 1.2,
      ease: "power2.out",
    },
    42.8
  );
  tl.to(
    camState,
    {
      x: -42,
      y: -286,
      z: -888,
      targetX: -29,
      targetY: -306,
      targetZ: -915,
      fov: 58,
      duration: 1.2,
      ease: "sine.inOut",
    },
    44.0
  );
  tl.to(
    camState,
    {
      x: -30,
      y: -287,
      z: -894,
      targetX: -29,
      targetY: -306,
      targetZ: -915,
      fov: 54,
      duration: 1.2,
      ease: "sine.inOut",
    },
    45.2
  );
  tl.to(
    camState,
    {
      x: -18,
      y: -288,
      z: -898,
      targetX: -29,
      targetY: -306,
      targetZ: -915,
      fov: 55,
      duration: 1.2,
      ease: "sine.inOut",
    },
    46.4
  );
  tl.to(
    camState,
    {
      x: 15,
      y: -350,
      z: -933,
      targetX: 29,
      targetY: -386,
      targetZ: -1015,
      fov: 64,
      fogDensity: 0.0255,
      duration: 1.2,
      ease: "power1.inOut",
    },
    47.6
  );

  // EVENT 08 — STARTUP (48.8s - 54.8s)
  // Balanced Target: (29, -386, -1015)
  tl.to(
    camState,
    {
      x: 18,
      y: -365,
      z: -970,
      targetX: 29,
      targetY: -386,
      targetZ: -1015,
      fov: 64,
      fogDensity: 0.026,
      duration: 1.2,
      ease: "power2.out",
    },
    48.8
  );
  tl.to(
    camState,
    {
      x: 48,
      y: -366,
      z: -995,
      targetX: 29,
      targetY: -386,
      targetZ: -1015,
      fov: 58,
      duration: 1.2,
      ease: "sine.inOut",
    },
    50.0
  );
  tl.to(
    camState,
    {
      x: 34,
      y: -367,
      z: -1002,
      targetX: 29,
      targetY: -386,
      targetZ: -1015,
      fov: 54,
      duration: 1.2,
      ease: "sine.inOut",
    },
    51.2
  );
  tl.to(
    camState,
    {
      x: 24,
      y: -368,
      z: -1004,
      targetX: 29,
      targetY: -386,
      targetZ: -1015,
      fov: 55,
      duration: 1.2,
      ease: "sine.inOut",
    },
    52.4
  );
  tl.to(
    camState,
    {
      x: -15,
      y: -405,
      z: -1045,
      targetX: -29,
      targetY: -426,
      targetZ: -1115,
      fov: 64,
      fogDensity: 0.0265,
      duration: 1.2,
      ease: "power1.inOut",
    },
    53.6
  );

  // EVENT 09 — DANCE (54.8s - 60.8s)
  // Balanced Target: (-29, -426, -1115)
  tl.to(
    camState,
    {
      x: -18,
      y: -405,
      z: -1080,
      targetX: -29,
      targetY: -426,
      targetZ: -1115,
      fov: 64,
      fogDensity: 0.027,
      duration: 1.2,
      ease: "power2.out",
    },
    54.8
  );
  tl.to(
    camState,
    {
      x: -48,
      y: -406,
      z: -1095,
      targetX: -29,
      targetY: -426,
      targetZ: -1115,
      fov: 58,
      duration: 1.2,
      ease: "sine.inOut",
    },
    56.0
  );
  tl.to(
    camState,
    {
      x: -34,
      y: -407,
      z: -1102,
      targetX: -29,
      targetY: -426,
      targetZ: -1115,
      fov: 54,
      duration: 1.2,
      ease: "sine.inOut",
    },
    57.2
  );
  tl.to(
    camState,
    {
      x: -24,
      y: -408,
      z: -1104,
      targetX: -29,
      targetY: -426,
      targetZ: -1115,
      fov: 55,
      duration: 1.2,
      ease: "sine.inOut",
    },
    58.4
  );
  tl.to(
    camState,
    {
      x: 10,
      y: -445,
      z: -1145,
      targetX: 8,
      targetY: -466,
      targetZ: -1215,
      fov: 64,
      fogDensity: 0.0275,
      duration: 1.2,
      ease: "power1.inOut",
    },
    59.6
  );

  // EVENT 10 — PHOTOGRAPHY (60.8s - 67.0s)
  // Balanced Target: (8, -466, -1215)
  tl.to(
    camState,
    {
      x: 16,
      y: -446,
      z: -1175,
      targetX: 8,
      targetY: -466,
      targetZ: -1215,
      fov: 64,
      fogDensity: 0.028,
      duration: 1.2,
      ease: "power2.out",
    },
    60.8
  );
  tl.to(
    camState,
    {
      x: 20,
      y: -447,
      z: -1190,
      targetX: 8,
      targetY: -466,
      targetZ: -1215,
      fov: 58,
      duration: 1.2,
      ease: "sine.inOut",
    },
    62.0
  );
  tl.to(
    camState,
    {
      x: 10,
      y: -448,
      z: -1198,
      targetX: 8,
      targetY: -466,
      targetZ: -1215,
      fov: 52,
      duration: 1.2,
      ease: "sine.inOut",
    },
    63.2
  );
  tl.to(
    camState,
    {
      x: 4,
      y: -449,
      z: -1200,
      targetX: 8,
      targetY: -466,
      targetZ: -1215,
      fov: 50,
      duration: 1.2,
      ease: "sine.inOut",
    },
    64.4
  );
  tl.to(
    camState,
    {
      x: 0,
      y: -450,
      z: -1202,
      targetX: 8,
      targetY: -466,
      targetZ: -1215,
      fov: 48,
      fogDensity: 0.029,
      duration: 1.4,
      ease: "power2.out",
    },
    65.6
  );

  tl.to({}, { duration: 2.0 });
}

export default buildSceneCameraTimeline;
