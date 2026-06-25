import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-sienna text-parchment hover:bg-sienna-deep active:bg-sienna-deep disabled:bg-ink-soft/40",
  secondary:
    "bg-transparent text-charcoal border border-charcoal/30 hover:border-charcoal hover:bg-charcoal/5 disabled:opacity-40",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 disabled:opacity-40",
  danger:
    "bg-clay-red text-parchment hover:bg-clay-red/85 disabled:bg-ink-soft/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide transition-colors duration-150 disabled:cursor-not-allowed cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
