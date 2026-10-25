import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Shell } from "@/components/traceverse/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CommunityBanner } from "@/components/traceverse/CommunityBanner";
import { EmptyState } from "@/components/traceverse/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatCount } from "@/data/traceverse";
import { catalogueQueryOptions, useCatalogue } from "@/lib/catalogue-query";
import { createCommunity } from "@/lib/community.functions";
import { uploadPublicImage } from "@/lib/image-upload";
import { setCommunityCover } from "@/lib/images.functions";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Communities — TraceVerse" },
      {
        name: "description",
        content:
          "Book communities, author communities and reader circles. Discuss chapters, theories and quotes on TraceVerse.",
      },
      { property: "og:title", content: "Communities — TraceVerse" },
      {
        property: "og:description",
        content: "Join reader circles, discuss chapters and follow the conversation around books.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQueryOptions),
  component: CommunityIndex,
});

function CommunityIndex() {
  const { communities, feed } = useCatalogue();
  const { user, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"popular" | "active" | "official">("popular");
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createCommunity);
  const saveCover = useServerFn(setCommunityCover);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = communities.filter(
      (c) =>
        (!q || `${c.name} ${c.description}`.toLowerCase().includes(q)) &&
        (sort !== "official" || c.official),
    );
    return [...list].sort((a, b) => (sort === "active" ? b.posts - a.posts : b.members - a.members));
  }, [communities, query, sort]);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await create({ data: { name, description } });
      if (coverFile && user) {
        try {
          const url = await uploadPublicImage({
            bucket: "community-covers",
            userId: user.id,
            name: res.id,
            file: coverFile,
            resize: { maxSide: 1600 },
          });
          await saveCover({ data: { communityId: res.id, url } });
        } catch (coverErr) {
          setError(coverErr instanceof Error ? coverErr.message : "The cover could not be saved.");
        }
      }
      await qc.invalidateQueries({ queryKey: ["catalogue"] });
      setOpen(false);
      setName("");
      setDescription("");
      setCoverFile(null);
      navigate({ to: "/community/$communityId", params: { communityId: res.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the community.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Community">
      <section className="px-4 pt-5 lg:px-0">
        <h1 className="font-display text-2xl font-semibold">Where readers meet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Book communities, author circles and interest groups.
        </p>
        {!loading && !user ? (
          <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              You're browsing as a visitor. Read any community for free. Sign in to join, post and
              comment.
            </p>
            <Button className="shrink-0 rounded-2xl glow-hover" asChild>
              <Link to="/auth">Sign in or join</Link>
            </Button>
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search communities"
              aria-label="Search communities"
              className="rounded-2xl bg-secondary/50 pl-9"
            />
          </div>
          <Button
            variant="secondary"
            className="rounded-2xl"
            onClick={() => (user ? setOpen((v) => !v) : navigate({ to: "/auth" }))}
          >
            <Plus className="size-4" /> Create a community
          </Button>
        </div>
        <div className="mt-3 flex gap-2" role="group" aria-label="Sort communities">
          {(
            [
              ["popular", "Popular"],
              ["active", "Most active"],
              ["official", "Official"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                sort === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {open ? (
          <div className="glass mt-3 space-y-3 rounded-3xl p-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Community name"
              className="rounded-2xl bg-secondary/50"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this circle about?"
              className="min-h-20 rounded-2xl bg-secondary/50"
            />
            <div>
              <label htmlFor="community-cover" className="text-xs text-muted-foreground">
                Cover photo (optional, PNG, JPG or WEBP)
              </label>
              <Input
                id="community-cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="mt-1 rounded-2xl bg-secondary/50"
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button className="rounded-2xl" disabled={busy} onClick={() => void submit()}>
              {busy ? "Creating…" : "Create"}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-0">
        {visible.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={<Users className="size-6" />}
              line={
                query
                  ? `No communities match "${query}". Try another word, or start one yourself.`
                  : "No communities here yet. Start the first one."
              }
            />
          </div>
        ) : null}
        {visible.map((c) => (
          <Link
            key={c.id}
            to="/community/$communityId"
            params={{ communityId: c.id }}
            className="glass rounded-3xl p-4 transition-transform hover:-translate-y-0.5"
          >
            <CommunityBanner
              name={c.name}
              hue={c.hue}
              coverUrl={c.coverUrl}
              className="mb-3 h-20 rounded-2xl"
            />
            <p className="flex items-center gap-2 text-sm font-semibold">
              {c.name}
              {c.official ? (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                  Official
                </span>
              ) : null}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="size-3" /> {formatCount(c.members)} members ·{" "}
              {formatCount(c.posts)} posts
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-8 px-4 lg:px-0">
        <h2 className="mb-3 font-display text-lg font-semibold">Most discussed today</h2>
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {feed
            .filter((p) => p.kind === "discussion" || p.kind === "confession")
            .map((p) => (
              <div key={p.id} className="glass rounded-3xl p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {p.author}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {p.handle} · {p.time}
                    {p.bookTitle ? ` · ${p.bookTitle}` : ""}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MessageCircle className="size-3" /> {formatCount(p.comments)} replies
                </p>
              </div>
            ))}
        </div>
      </section>
    </Shell>
  );
}
