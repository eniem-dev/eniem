"use client";

import { useState, useRef, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <pre
        ref={preRef}
        className={cn(
          "overflow-x-auto rounded-lg border bg-muted p-4 my-4",
          className
        )}
      >
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className={cn(
          "absolute right-3 top-3 p-2 rounded-md",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-muted-foreground/10 hover:bg-muted-foreground/20",
          "text-muted-foreground"
        )}
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
