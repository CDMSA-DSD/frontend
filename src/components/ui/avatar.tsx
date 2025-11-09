import * as React from "react"
import { cn } from "@/lib/utils"

type ClassValue =
  | string
  | number
  | null
  | undefined
  | Record<string, boolean>
  | ClassValue[]

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  src?: string
  alt?: string
}

export function Avatar({ className, src, alt, children, ...props }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ""}
        className={cn("inline-block rounded-full object-cover", className)}
        {...(props as any)}
      />
    )
  }
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type AvatarFallbackProps = React.HTMLAttributes<HTMLDivElement>

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <div className={cn("flex size-full items-center justify-center rounded-full", className)} {...props}>
      {children}
    </div>
  )
}
