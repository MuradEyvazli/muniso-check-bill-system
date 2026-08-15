export default function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-white/10 text-white",
    success: "bg-emerald-500/20 text-emerald-300",
    warning: "bg-gold/20 text-gold",
    danger: "bg-red-500/20 text-red-300",
    burgundy: "bg-burgundy/30 text-burgundy-light",
  };
  return <span className={`badge ${tones[tone] || tones.neutral} ${className}`}>{children}</span>;
}
