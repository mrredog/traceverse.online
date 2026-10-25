import { cn } from "@/lib/utils";

/** Community cover photo, or a colour gradient when the owner hasn't added one. */
export function CommunityBanner({
  name,
  hue,
  coverUrl,
  className,
}: {
  name: string;
  hue: number;
  coverUrl?: string | null | undefined;
  className?: string;
}) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={`Cover photo for ${name}`}
        loading="lazy"
        className={cn("w-full object-cover", className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn("w-full", className)}
      style={{
        backgroundImage: `linear-gradient(130deg, oklch(0.55 0.2 ${hue}), oklch(0.22 0.07 ${hue + 45}))`,
      }}
    />
  );
}
