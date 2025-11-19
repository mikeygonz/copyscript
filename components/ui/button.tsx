import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "text-white button-figma-style",
        destructive: "bg-destructive text-background hover:bg-destructive/90 whitespace-nowrap text-sm font-normal transition-colors cursor-pointer",
        outline:
          "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground rounded-md shadow-layered hover:shadow-layered-md transition-shadow whitespace-nowrap text-sm font-normal cursor-pointer",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap text-sm font-normal transition-colors cursor-pointer",
        ghost: "hover:bg-accent hover:text-accent-foreground whitespace-nowrap text-sm font-normal transition-colors cursor-pointer",
        link: "text-foreground underline-offset-4 hover:underline whitespace-nowrap text-sm font-normal transition-colors cursor-pointer",
      },
      size: {
        default: "has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {

  const Comp = asChild ? Slot : "button";

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
