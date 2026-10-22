import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-60",
  mint: "bg-mint-500 text-white hover:bg-mint-600 disabled:opacity-60",
  lime: "bg-lime-400 text-navy-950 hover:bg-lime-300 disabled:opacity-60",
  outline:
    "border border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60",
  ghost: "text-ink hover:bg-surface disabled:opacity-60",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-60",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
  icon: "h-10 w-10",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
