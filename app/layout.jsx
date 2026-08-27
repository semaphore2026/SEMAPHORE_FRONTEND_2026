import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Menu from "@/components/Menu";
import SmoothScroll from "@/components/SmoothScroll";
import PreloadProvider from "@/components/preload/PreloadProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Semaphore 2026",
  description: "Semaphore 2026 - National Level IT Fest",
};

// Runs before anything below it is parsed, so the page is hidden and the scroll is
// locked from the very first paint — no flash of half-painted content while React
// hydrates. Deliberately NOT a server-rendered className: with JavaScript disabled
// this never runs, and the site stays fully readable instead of being stuck invisible.
const PRELOAD_BOOTSTRAP = `document.documentElement.classList.add('preloading');`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: PRELOAD_BOOTSTRAP }} />
        <PreloadProvider>
          <SmoothScroll>
            <Menu />
            {children}
          </SmoothScroll>
        </PreloadProvider>
      </body>
    </html>
  );
}
