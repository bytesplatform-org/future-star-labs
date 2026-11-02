/**
 * An equation written plainly, with `_x` marking a subscript:
 * "V = α (T_h − T_c)". Unicode has no subscript c, so subscripts are real
 * <sub> elements rather than look-alike glyphs from a fallback font.
 */
export default function Expr({ children, className }: { children: string; className?: string }) {
  const parts = children.split(/_([A-Za-z0-9]+)/);
  return (
    <span className={className}>
      {parts.map((part, n) => (n % 2 ? <sub key={n} className="text-[0.6em]">{part}</sub> : part))}
    </span>
  );
}
