import * as React from "react"
import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center rounded-md border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring overflow-hidden", className)}
      {...props}
    />
  )
)
InputGroup.displayName = "InputGroup"

const InputGroupInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-full w-full bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
InputGroupInput.displayName = "InputGroupInput"

const InputGroupAddon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-center px-3 text-muted-foreground bg-muted/50 h-full border-l", className)}
      {...props}
    />
  )
)
InputGroupAddon.displayName = "InputGroupAddon"

export { InputGroup, InputGroupInput, InputGroupAddon }
