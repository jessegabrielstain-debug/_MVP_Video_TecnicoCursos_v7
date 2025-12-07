'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ className, ratio = 16 / 9, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative w-full", className)}
      style={{ paddingBottom: `${100 / ratio}%`, ...style }}
      {...props}
    >
      <div className="absolute inset-0">
        {props.children}
      </div>
    </div>
  )
)
AspectRatio.displayName = "AspectRatio"

export { AspectRatio }
