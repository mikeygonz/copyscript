import * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  onKeyDown,
  ...props
}: React.ComponentProps<"input">) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow Cmd+A / Ctrl+A to select all text
    if ((e.metaKey || e.ctrlKey) && e.key === "a") {
      e.stopPropagation();
      // Ensure the input's select() method is called
      if (inputRef.current) {
        inputRef.current.select();
      }
      return;
    }
    // Call original onKeyDown if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input dark:border-border h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-layered transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm select-text",
        "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[2px] focus-visible:shadow-layered-md",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export { Input };
