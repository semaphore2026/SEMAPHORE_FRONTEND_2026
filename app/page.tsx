"use client";

import dynamic from "next/dynamic";
import Menu from "../components/Menu";

const Scene = dynamic(() => import("../components/Scene"), { ssr: false });

export default function Home() {
  return (
    <main className="bg-black min-h-screen relative">
      <Menu />
      <Scene />
    </main>
  );
}
