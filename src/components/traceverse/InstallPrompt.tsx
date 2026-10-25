import { Download, Share, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "tv-install-dismissed";
const DISMISS_DAYS = 30;
const SHOW_AFTER_MS = 15_000;
/** Keep the prompt out of the way while someone is signing in or reading. */
const QUIET_PATHS = [/^\/auth/, /\/read$/];

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

/**
 * "Install TraceVerse" banner.
 * - Android / desktop Chrome and Edge: uses the browser's install prompt.
 * - iPhone / iPad Safari: shows the Add to Home Screen steps (iOS has no install API).
 * - Already installed, recently dismissed, or on sign-in and reader pages: stays hidden.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [path, setPath] = useState("");

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    setIos(isIosSafari());
    setPath(window.location.pathname);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setTimeout(() => setReady(true), SHOW_AFTER_MS);
    const onNav = () => setPath(window.location.pathname);
    const interval = window.setInterval(onNav, 2000);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode: dismissal lasts for this visit only */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") setOpen(false);
    else dismiss();
  };

  const canShow = ready && open && (deferred || ios) && !QUIET_PATHS.some((re) => re.test(path));
  if (!canShow) return null;

  return (
    <div
      role="dialog"
      aria-label="Install TraceVerse"
      className="fixed inset-x-3 z-50 mx-auto max-w-md rounded-3xl border border-border bg-popover p-4 shadow-float lg:inset-x-auto lg:right-6 lg:mx-0"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.25rem)" }}
    >
      <button
        type="button"
        aria-label="Not now"
        onClick={dismiss}
        className="absolute right-3 top-3 grid size-7 place-items-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl trace-gradient text-primary-foreground">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold">Get the TraceVerse app</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Open it from your home screen, read in full screen and pick up where you stopped.
          </p>
        </div>
      </div>

      {deferred ? (
        <div className="mt-3 flex gap-2">
          <Button className="flex-1 rounded-2xl" onClick={() => void install()}>
            <Download className="size-4" /> Install app
          </Button>
          <Button variant="ghost" className="rounded-2xl" onClick={dismiss}>
            Not now
          </Button>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-secondary/50 p-3 text-xs text-muted-foreground">
          <p className="flex flex-wrap items-center gap-1">
            Tap <Share className="inline size-3.5 text-foreground" />{" "}
            <strong className="text-foreground">Share</strong>, then{" "}
            <strong className="text-foreground">Add to Home Screen</strong>.
          </p>
          <Button variant="ghost" size="sm" className="mt-2 rounded-xl" onClick={dismiss}>
            Got it
          </Button>
        </div>
      )}
    </div>
  );
}
