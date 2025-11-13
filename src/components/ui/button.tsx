import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium
        text-white bg-[#6366f1] hover:bg-[#5558e3] focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-[#6366f1] disabled:opacity-50 ${className}`}
      {...props}
    />
  )
)

Button.displayName = "Button"
