"use client";

import dynamic from "next/dynamic";

// <Menu /> is rendered once, in app/layout.jsx — it used to be mounted here as well.
const Scene = dynamic(() => import("../components/Scene"), { ssr: false });

export default function Home() {
  return (
    <main className="bg-black min-h-screen relative selection:bg-cyan-500 selection:text-black">
      <Scene />
    </main>
  );
}
