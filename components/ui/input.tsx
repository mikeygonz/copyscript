import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onKeyDown, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

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

    const hasFlex1 = className?.includes("flex-1");
    const inputClassName = className?.replace("flex-1", "").trim() || "";

    return (
      <div
        className={cn(
          "relative before:pointer-events-none focus-within:before:opacity-100 before:opacity-0 before:absolute before:-inset-0.5 before:rounded-[12.5px] before:border-[0.5px] before:border-white/20 dark:before:border-white/20 before:ring-[0.5px] before:ring-white/5 dark:before:ring-white/5 before:transition",
          hasFlex1 && "flex-1"
        )}
      >
        <div className="after:pointer-events-none after:absolute after:inset-[0.5px] after:rounded-[11.5px] after:shadow-highlight after:shadow-white/5 dark:focus-within:after:shadow-white/15 dark:after:shadow-white/5 after:transition">
          <input
            ref={combinedRef}
            type={type}
            data-slot="input"
            className={cn(
              "relative file:text-foreground placeholder:text-white/25 selection:bg-primary selection:text-primary-foreground h-[40px] w-full min-w-0 rounded-[12px] border-0 p-[12px] text-base input-figma-style transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm select-text flex items-center gap-[8px]",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/30 aria-invalid:border-destructive/50",
              inputClassName
            )}
            onKeyDown={handleKeyDown}
            {...props}
          />
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
