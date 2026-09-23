import Image from "next/image";

export default function VemiLogo({
  className = "h-7 w-24",
  src = "/vemi-logo.png",
  inverted = false,
  preload = false,
}: {
  className?: string;
  src?: string;
  inverted?: boolean;
  preload?: boolean;
}) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`}>
      <Image
        src={src}
        alt="Vemi"
        fill
        preload={preload}
        sizes="112px"
        className="object-contain"
        style={{
          transform: "scale(4.55)",
          transformOrigin: "52.3% 50%",
          filter: inverted ? "brightness(0) invert(1)" : undefined,
        }}
      />
    </span>
  );
}
