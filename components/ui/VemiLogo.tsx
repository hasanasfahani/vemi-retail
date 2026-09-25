import Image from "next/image";

/* The wordmark, at its natural aspect ratio.

   The source files used to be the full 3508x2481 artboard with the
   wordmark floating in the middle, which forced a `scale(4.55)`
   transform to crop in. That was the pixelation: `sizes` described the
   little 80px box, so Next served a ~112px-wide rendition of the whole
   artboard — about 37px of actual wordmark — and CSS then blew it back
   up. The PNGs are now cropped to the wordmark (620x259), so the image
   is downscaled rather than upscaled and no transform is needed.

   Callers set the height and let the width follow, so the logo can
   never be stretched. */

const RATIO = 620 / 259;

export default function VemiLogo({
  className = "h-7 w-auto",
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
    <Image
      src={src}
      alt="Vemi"
      width={620}
      height={259}
      preload={preload}
      sizes="160px"
      className={`${className} shrink-0 object-contain`}
      style={{
        aspectRatio: RATIO,
        filter: inverted ? "brightness(0) invert(1)" : undefined,
      }}
    />
  );
}
