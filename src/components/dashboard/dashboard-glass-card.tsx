import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function DashboardGlassCard({
  children,
  className = "",
  hover = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
} & ComponentPropsWithoutRef<"article">) {
  return (
    <article
      {...props}
      className={[
        "glass rounded-2xl border border-white/10",
        hover ? "transition hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_0_42px_rgba(6,182,212,0.16)]" : "",
        className,
      ].join(" ")}
    >
      {children}
    </article>
  );
}
