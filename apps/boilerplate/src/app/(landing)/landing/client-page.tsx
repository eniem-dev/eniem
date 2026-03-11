"use client";

import { Brand } from "@/components/brand";
import { NavBorder } from "@/components/navbar/nav-border";
import { ThemeSelector } from "@/components/theme-selector";
import { NewsletterForm } from "@/features/newsletter";
import { locales } from "@/locales";
import { motion, useInView } from "framer-motion";
import { Play, Sparkles, Users } from "lucide-react";
import { useRef, useEffect, useState } from "react";

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function Particles() {
  const { width, height } = useWindowSize();

  if (width === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-foreground/10 rounded-full"
          initial={{
            x: Math.random() * width,
            y: Math.random() * height,
            opacity: 0,
          }}
          animate={{
            y: -100,
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: Math.random() * 10 + 12,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export function LandingPageClient() {
  const videoRef = useRef<HTMLDivElement>(null);
  const videoInView = useInView(videoRef, { once: true, margin: "-40px" });
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <div>
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <nav className="container mx-auto flex items-center justify-between p-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Brand />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hidden xl:block"
          >
            <ThemeSelector />
          </motion.div>
        </nav>
        <NavBorder />
      </motion.header>

      <main className="relative">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

          <Particles />

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-muted/40 text-sm font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-foreground/50" />
                <span className="text-foreground/70 font-semibold tracking-wide text-xs uppercase">
                  {locales.LandingPage.hero.badge}
                </span>
              </motion.div>

              {/* Main Title */}
              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
              >
                {locales.LandingPage.hero.title}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                {locales.LandingPage.hero.subtitle}
              </motion.p>

              {/* Newsletter Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="pt-6"
              >
                <div className="max-w-md mx-auto">
                  <NewsletterForm />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground/50"
              >
                <Users className="h-3.5 w-3.5" />
                <span>{locales.LandingPage.hero.socialProof}</span>
              </motion.div>
            </div>

            <motion.div
              ref={videoRef}
              initial={{ opacity: 0, y: 40 }}
              animate={videoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.8, delay: 1.1, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="mt-16 max-w-4xl mx-auto"
            >
              <div className="relative">
                <div
                  className="absolute -inset-3 rounded-2xl opacity-60 blur-2xl"
                  style={{
                    background:
                      "conic-gradient(from 180deg, oklch(0.7 0.15 260), oklch(0.65 0.18 300), oklch(0.7 0.12 220), oklch(0.7 0.15 260))",
                  }}
                />
                <div className="relative rounded-xl overflow-hidden border border-border/40 bg-black shadow-2xl">
                  <div className="aspect-video">
                    {videoPlaying ? (
                      <iframe
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                        title="Demo video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      <button
                        onClick={() => setVideoPlaying(true)}
                        className="w-full h-full flex items-center justify-center bg-black cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                          <Play className="h-6 w-6 md:h-8 md:w-8 text-white fill-white ml-1" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
