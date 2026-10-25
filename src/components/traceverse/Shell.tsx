import { Link, useRouterState } from "@tanstack/react-router";
import { LogoMark } from "@/components/traceverse/LogoMark";
import { Home, Library, Plus, Users, User, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { NotificationsBell } from "@/components/traceverse/Notifications";
import { TraceAIPanel } from "@/components/traceverse/TraceAI";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/library", label: "Library", icon: Library },
  { to: "/community", label: "Community", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

/**
 * Mobile-first shell: sticky header + bottom tab bar on phones,
 * left sidebar (navigation + Trace AI) from the `lg` breakpoint up.
 */
export function Shell({
  children,
  title,
  showSearch = true,
}: {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[88rem]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-border px-4 py-6 lg:flex">
        <Link to="/" className="flex items-center gap-2 px-2">
          <LogoMark className="size-9 rounded-xl" />
          <span className="font-display text-lg font-semibold tracking-tight">TraceVerse</span>
        </Link>

        <nav aria-label="Primary" className="flex flex-col gap-1">
          {tabs.map((t) => {
            const active = isActive(pathname, t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <t.icon className={cn("size-5", active && "text-primary")} />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <Button asChild className="rounded-2xl glow-hover">
          <Link to="/create">
            <Plus className="size-4" /> Create
          </Link>
        </Button>

        <div className="mt-auto rounded-3xl border border-border bg-surface p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" /> Trace AI
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Summaries, explanations and recommendations while you read.
          </p>
          <TraceAIPanel
            context="your reading profile"
            suggestions={[
              "Something emotional but not too long",
              "Mystery with a strong female lead",
              "African novels about identity",
            ]}
            trigger={
              <Button variant="secondary" className="mt-3 w-full rounded-2xl">
                Ask Trace AI
              </Button>
            }
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 glass">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <LogoMark className="size-8 rounded-xl" />
              <span className="font-display text-base font-semibold tracking-tight">
                {title ?? "TraceVerse"}
              </span>
            </Link>
            {title ? (
              <span className="hidden font-display text-base font-semibold lg:block">{title}</span>
            ) : null}
            <div className="ml-auto flex items-center gap-2">
              {showSearch ? (
                <Link
                  to="/search"
                  aria-label="Search TraceVerse"
                  className="grid size-9 place-items-center rounded-xl bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                >
                  <Search className="size-4" />
                </Link>
              ) : null}
              {showSearch ? (
                <Link
                  to="/search"
                  className="hidden h-9 w-72 items-center gap-2 rounded-xl bg-secondary/60 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
                >
                  <Search className="size-4" /> Search books, authors, communities
                </Link>
              ) : null}
              <NotificationsBell />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:px-4 lg:pb-16">
          {children}
        </main>

        {/* Mobile tab bar */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto flex w-full max-w-md items-center justify-between px-2 py-1.5">
            {tabs.slice(0, 2).map((t) => (
              <NavItem key={t.to} {...t} active={isActive(pathname, t.to)} />
            ))}
            <Link
              to="/create"
              aria-label="Create"
              className="grid size-12 place-items-center rounded-2xl trace-gradient text-primary-foreground transition-transform duration-300 hover:scale-105"
            >
              <Plus className="size-6" />
            </Link>
            {tabs.slice(2).map((t) => (
              <NavItem key={t.to} {...t} active={isActive(pathname, t.to)} />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-16 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("size-5", active && "text-primary")} />
      {label}
    </Link>
  );
}
