"use client";
import Footer from "@/components/Footer";
import Menu from "@/components/Menu";
import dynamic from "next/dynamic";
import FestDetails from "../components/FestDetails";

const Scene = dynamic(() => import("../components/Scene"), { ssr: false });

export default function Home() {
  return (
    <main className="bg-black min-h-screen relative selection:bg-cyan-500 selection:text-black">
      <Menu />
      <Scene />
        <Footer />
    </main>
  );
}
