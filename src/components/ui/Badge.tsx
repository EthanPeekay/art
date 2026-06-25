import { clsx } from "clsx";

type BadgeVariant = "neutral" | "live" | "sold" | "gold" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-charcoal/8 text-ink",
  live: "bg-olive text-parchment",
  sold: "bg-clay-red text-parchment",
  gold: "bg-gold/15 text-sienna-deep border border-gold/40",
  outline: "border border-current",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.08em]",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
