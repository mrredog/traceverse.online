import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { TraceAvatar } from "@/components/traceverse/Avatar";
import { uploadPublicImage } from "@/lib/image-upload";
import { setMyAvatar } from "@/lib/images.functions";

/** Big round profile picture with a camera button to change it. */
export function AvatarPicker({
  userId,
  name,
  url,
  onChange,
}: {
  userId: string;
  name: string;
  url: string | null | undefined;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(setMyAvatar);

  const pick = async (file: File) => {
    setBusy(true);
    try {
      const publicUrl = await uploadPublicImage({
        bucket: "avatars",
        userId,
        name: "avatar",
        file,
        resize: { maxSide: 512, square: true },
      });
      await save({ data: { url: publicUrl } });
      onChange(publicUrl);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update your picture");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await save({ data: { url: null } });
      onChange(null);
      toast.success("Profile picture removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove your picture");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <TraceAvatar name={name} url={url} className="size-20 text-2xl ring-2 ring-border" />
        <button
          type="button"
          aria-label="Change profile picture"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pick(f);
          }}
        />
      </div>
      {url ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}
