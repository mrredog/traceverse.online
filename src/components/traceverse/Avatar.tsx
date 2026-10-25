import { cn } from "@/lib/utils";

/** Profile picture, or a coloured initial when none has been uploaded. */
export function TraceAvatar({
  name,
  hue = 300,
  url,
  className,
}: {
  name: string;
  hue?: number;
  url?: string | null | undefined;
  className?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={`${name}'s profile picture`}
        loading="lazy"
        className={cn("size-10 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-foreground",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(140deg, oklch(0.62 0.2 ${hue}), oklch(0.28 0.1 ${hue + 30}))`,
      }}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
