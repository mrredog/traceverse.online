import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to TraceVerse — Your reading universe" },
      {
        name: "description",
        content:
          "Sign in or create a TraceVerse account to save your library, follow authors, join communities and use Trace AI.",
      },
      { property: "og:title", content: "Sign in to TraceVerse" },
      {
        property: "og:description",
        content: "Save your library, follow authors and join reading communities on TraceVerse.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const [checkEmail, setCheckEmail] = useState(false);

  // Remember where the visitor came from so sign-in can send them back there.
  useEffect(() => {
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === window.location.origin && !ref.pathname.startsWith("/auth")) {
        sessionStorage.setItem("tv-after-auth", ref.pathname + ref.search);
      }
    } catch {
      /* referrer or storage unavailable: fall back to the home page */
    }
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    let target = "/";
    try {
      const saved = sessionStorage.getItem("tv-after-auth");
      sessionStorage.removeItem("tv-after-auth");
      // Only same-site paths, never "//evil.example" or full URLs.
      if (saved && /^\/(?!\/)/.test(saved)) target = saved;
    } catch {
      /* ignore */
    }
    if (target === "/") void navigate({ to: "/" });
    else window.location.replace(target);
  }, [loading, user, navigate]);

  const forgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Type your email above first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      toast.success("If that email has an account, a reset link is on its way.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the reset email");
    } finally {
      setBusy(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "github") => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) toast.error(`${provider === "github" ? "GitHub" : "Google"} sign-in failed. Please try again.`);
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is on: the account exists but cannot sign in until the link is opened.
          setCheckEmail(true);
          return;
        }
        toast.success("Welcome to TraceVerse");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back to TraceVerse");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-5 py-16">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl trace-gradient text-primary-foreground shadow-glow">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">TraceVerse</h1>
          <p className="text-sm text-muted-foreground">Every story leaves a trace.</p>
        </div>
      </div>

      {checkEmail ? (
        <div className="glass space-y-3 rounded-3xl p-5 text-center" role="status">
          <h2 className="font-display text-lg font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
            Open it to finish creating your account, then sign in.
          </p>
          <Button
            variant="secondary"
            className="w-full rounded-2xl"
            onClick={() => {
              setCheckEmail(false);
              setMode("signin");
            }}
          >
            Back to sign in
          </Button>
        </div>
      ) : (
      <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-5">
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amara Njoki"
              className="rounded-2xl bg-secondary/50"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-2xl bg-secondary/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="rounded-2xl bg-secondary/50"
          />
        </div>
        <Button type="submit" disabled={busy} className="w-full rounded-2xl">
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
        {mode === "signin" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void forgotPassword()}
            className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Forgot password?
          </button>
        ) : null}
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => signInWithProvider("google")}
          className="w-full rounded-2xl"
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => signInWithProvider("github")}
          className="w-full rounded-2xl"
        >
          Continue with GitHub
        </Button>
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New to TraceVerse? Create an account"}
        </button>
      </form>
      )}
    </main>
  );
}
