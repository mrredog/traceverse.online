import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset")({
  head: () => ({
    meta: [{ title: "Reset your password — TraceVerse" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});

/** Landing page for the link in the password-reset email. */
function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase turns the emailed link into a short recovery session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      await navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update your password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-5 py-16">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl trace-gradient text-primary-foreground">
          <Sparkles className="size-5" />
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reset password</h1>
      </div>

      {ready ? (
        <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-5">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-2xl bg-secondary/50"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-2xl">
            {busy ? "Saving…" : "Save new password"}
          </Button>
        </form>
      ) : (
        <div className="glass space-y-3 rounded-3xl p-5 text-center">
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or has expired. Request a new one from the sign-in page.
          </p>
          <Button asChild className="w-full rounded-2xl">
            <Link to="/auth">Back to sign in</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
