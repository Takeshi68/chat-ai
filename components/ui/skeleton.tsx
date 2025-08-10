import type React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md max-w-(--skeleton-width) flex-1", className)}
      {...props}
    />
  )
}

export { Skeleton }
