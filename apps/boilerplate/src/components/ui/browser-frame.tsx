import * as React from "react"

import { cn } from "@/lib/utils"

function BrowserFrame({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="browser-frame"
      className={cn(
        "overflow-hidden rounded-lg border bg-background shadow-lg",
        className
      )}
      {...props}
    >
      <div
        data-slot="browser-frame-titlebar"
        className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3"
      >
        <span className="size-3 rounded-full bg-red-400" />
        <span className="size-3 rounded-full bg-yellow-400" />
        <span className="size-3 rounded-full bg-green-400" />
      </div>
      <div data-slot="browser-frame-content">
        {children}
      </div>
    </div>
  )
}

export { BrowserFrame }
