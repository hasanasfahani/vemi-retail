/* Signed movement against the previous visit. Direction is carried by
   the sign glyph as well as the status colour, never colour alone. */

export default function Delta({
  value,
  unit = "",
  goodDirection = "up",
}: {
  value: number;
  unit?: string;
  goodDirection?: "up" | "down";
}) {
  if (Math.abs(value) < 0.05) return <span className="text-ink-400">—</span>;
  const up = value > 0;
  const good = goodDirection === "up" ? up : !up;
  return (
    <span
      className="font-semibold"
      style={{ color: good ? "var(--color-good)" : "var(--color-critical)" }}
    >
      {up ? "+" : "−"}
      {Math.abs(value)}
      {unit}
    </span>
  );
}
