export function Figure({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  return <span className={className}>{value}</span>;
}

export default Figure;
