import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leadingIcon, invalid, type = "text", ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-md border border-line bg-canvas px-2.5 text-body transition-colors focus-within:border-fg has-[input:disabled]:bg-subtle has-[input:disabled]:opacity-60",
        invalid && "border-danger-dot focus-within:border-danger-dot",
        className,
      )}
    >
      {leadingIcon ? (
        <span className="flex shrink-0 text-fg-secondary [&_svg]:size-4">{leadingIcon}</span>
      ) : null}
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-muted focus-visible:outline-none"
        {...props}
      />
    </div>
  );
});
