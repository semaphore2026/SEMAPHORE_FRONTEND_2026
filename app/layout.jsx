import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Menu from "@/components/Menu";
import SmoothScroll from "@/components/SmoothScroll";

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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Menu />
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}

