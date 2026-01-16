"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export function AppNavBorder(): React.ReactElement {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 h-px bg-border transition-opacity duration-300 ease-in-out",
        isScrolled ? "opacity-100" : "opacity-0"
      )}
    />
  );
}
