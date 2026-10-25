import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

/** Bell button + notifications sheet. Signed-out visitors are sent to sign in. */
export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const key = ["notifications", user?.id ?? "anon"];

  const { data: items = [], isLoading } = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    refetchInterval: 60_000,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, kind, title, body, link, read, created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    qc.setQueryData<NotificationRow[]>(key, (old) => (old ?? []).map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        onClick={() => (user ? setOpen(true) : void navigate({ to: "/auth" }))}
        className="relative grid size-9 place-items-center rounded-xl bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border p-4 text-left">
            <SheetTitle className="font-display">Notifications</SheetTitle>
            <SheetDescription>
              {unread ? `${unread} unread` : "You're all caught up."}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nothing yet. Follow authors and join communities to hear about new chapters and
                replies.
              </p>
            ) : (
              <ul>
                {items.map((n) => {
                  const body = (
                    <>
                      <p className="text-sm font-semibold">{n.title}</p>
                      {n.body ? <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p> : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </>
                  );
                  const cls = cn(
                    "block border-b border-border px-4 py-3 transition-colors hover:bg-secondary/40",
                    !n.read && "bg-primary/5",
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <a href={n.link} className={cls} onClick={() => setOpen(false)}>
                          {body}
                        </a>
                      ) : (
                        <div className={cls}>{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="border-t border-border p-3">
            <Button
              variant="secondary"
              className="w-full rounded-2xl"
              disabled={unread === 0}
              onClick={() => void markAllRead()}
            >
              Mark all as read
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
