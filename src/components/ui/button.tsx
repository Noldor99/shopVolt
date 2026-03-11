import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center whitespace-nowrap",
    "t-sm1 font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50"
  ),
  {
    variants: {
      variant: {
        default: cn("bg-primary text-white shadow", "hover:opacity-[65%]"),
        default_out: cn(
          "border border-primary text-primary shadow",
          "hover:text-white hover:bg-primary"
        ),
        black: cn("bg-black text-white shadow  border border-black", "hover:opacity-[65%]"),
        black_out: cn(
          "bg-white text-black shadow  border border-black",
          "hover:text-white hover:bg-black"
        ),
        destructive: cn("bg-destructive text-white shadow-sm", "hover:opacity-[65%]"),
        destructive_out: cn(
          "bg-none text-destructive shadow  border border-destructive",
          "hover:text-white hover:bg-destructive"
        ),
        success: cn("bg-green-500 text-white shadow-sm", "hover:opacity-[65%]"),
        success_out: cn(
          "border border-green-500 text-green-500 shadow-sm",
          "hover:text-white hover:bg-green-500"
        ),
        ghost: "border border-white hover:border-black",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, disabled, loading, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {!loading ? children : <Loader2 className="w-5 h-5 animate-spin" />}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
