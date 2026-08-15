"use client";

const VARIANTS = {
  primary: "btn-primary",
  gold: "btn-gold",
  ghost: "btn-ghost",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button className={`${VARIANTS[variant] || VARIANTS.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
