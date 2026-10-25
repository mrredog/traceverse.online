import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Flame, Sparkles, Compass, ChevronRight, MessageCircle, Heart, Star } from "lucide-react";

import { BookCard } from "@/components/traceverse/BookCard";
import { BookCover } from "@/components/traceverse/BookCover";
import { CommunityBanner } from "@/components/traceverse/CommunityBanner";
import { Rail } from "@/components/traceverse/Rail";
import { Shell } from "@/components/traceverse/Shell";
import { HomeSkeleton } from "@/components/traceverse/Skeletons";
import { TraceAIPanel } from "@/components/traceverse/TraceAI";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/data/traceverse";
import { catalogueQueryOptions, useCatalogue } from "@/lib/catalogue-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TraceVerse — Every Story Leaves a Trace" },
      {
        name: "description",
        content:
          "TraceVerse is the global social network for reading, publishing and discovering stories, powered by Trace AI.",
      },
      { property: "og:title", content: "TraceVerse — Every Story Leaves a Trace" },
      {
        property: "og:description",
        content:
          "Read, publish and discuss stories. Book pages, author pages, communities and Trace AI in one living universe.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQueryOptions),
  pendingComponent: HomeSkeleton,
  component: HomePage,
});

function HomePage() {
  const { books, authors, communities, feed } = useCatalogue();
  const continueReading = books.filter((b) => typeof b.progress === "number");
  const trending = [...books].sort((a, b) => b.readers - a.readers);
  const fresh = [...books].sort((a, b) => b.year - a.year);
  const hiddenGems = books.filter((b) => b.readers < 100_000);
  const featured = trending[0];
  const featuredAuthor = featured ? authors.find((a) => a.id === featured.authorId) : undefined;

  return (
    <Shell>
      <section className="animate-rise px-4 pt-6 pb-8 lg:px-0">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Welcome back
        </p>
        <h1 className="mt-2 text-2xl leading-tight font-semibold sm:text-3xl">
          Every story <span className="text-primary">leaves a trace.</span>
        </h1>

        {featured ? (
          <article className="mt-5 flex gap-4 rounded-3xl border border-border bg-surface p-4 sm:gap-6 sm:p-6">
            <Link
              to="/book/$bookId"
              params={{ bookId: featured.id }}
              className="w-28 shrink-0 sm:w-40 lg:w-48"
              aria-label={`Open ${featured.title}`}
            >
              <BookCover
                title={featured.title}
                hue={featured.hue}
                kind={featured.kind}
                coverUrl={featured.coverUrl}
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                Featured · {featured.genre}
              </p>
              <h2 className="mt-1.5 text-xl leading-tight font-semibold sm:text-2xl lg:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {featuredAuthor ? `by ${featuredAuthor.name}` : null}
              </p>
              {featured.summary ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80 sm:line-clamp-4">
                  {featured.summary}
                </p>
              ) : null}
              <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-current text-accent" aria-hidden />
                {featured.rating.toFixed(1)}
                <span className="opacity-50">·</span>
                {formatCount(featured.readers)} readers
                <span className="opacity-50">·</span>
                {featured.chapters.length} chapters
              </p>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-auto">
                <Button className="rounded-2xl glow-hover" asChild>
                  <Link to="/book/$bookId/read" params={{ bookId: featured.id }} search={{}}>
                    <BookOpen className="size-4" /> Start reading
                  </Link>
                </Button>
                <Button variant="secondary" className="rounded-2xl" asChild>
                  <Link to="/book/$bookId" params={{ bookId: featured.id }}>
                    Details
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <TraceAIPanel
            context="your reading profile"
            suggestions={[
              "Something emotional but not too long",
              "Mystery with a strong female lead",
              "African novels about identity",
            ]}
            trigger={
              <Button variant="secondary" className="rounded-2xl">
                <Sparkles className="size-4" /> Ask Trace AI
              </Button>
            }
          />
          <Button variant="ghost" className="rounded-2xl" asChild>
            <Link to="/search">
              <Compass className="size-4" /> Discover
            </Link>
          </Button>
        </div>
      </section>

      <div className="space-y-9">
        <Rail title="Continue reading" subtitle="Pick up where you stopped">
          {continueReading.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </Rail>

        <Rail
          title="For you"
          subtitle="Personalised by Trace AI from your reading behaviour"
          action={
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              Refresh <ChevronRight className="size-3" />
            </span>
          }
        >
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </Rail>

        <Rail title="Trending in Kenya" subtitle="Most read in the last 24 hours">
          {trending.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </Rail>

        <section className="animate-rise">
          <div className="mb-3 flex items-end justify-between px-4 lg:px-0">
            <div>
              <h2 className="font-display text-lg font-semibold">The feed</h2>
              <p className="text-xs text-muted-foreground">
                Excerpts, quotes, confessions and discussions
              </p>
            </div>
            <Flame className="size-4 text-accent" />
          </div>
          <div className="space-y-3 px-4 lg:grid lg:grid-cols-2 lg:space-y-0 lg:gap-4 lg:px-0">
            {feed.map((p) => (
              <article key={p.id} className="glass rounded-3xl p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-full text-xs font-semibold text-foreground"
                    style={{
                      backgroundImage: `linear-gradient(140deg, oklch(0.6 0.2 ${p.hue}), oklch(0.3 0.1 ${p.hue + 30}))`,
                    }}
                  >
                    {p.author.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.author}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {p.handle} · {p.time}
                      {p.bookTitle ? ` · ${p.bookTitle}` : ""}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {p.kind}
                  </span>
                </div>
                <p
                  className={
                    p.spoiler
                      ? "mt-3 rounded-2xl bg-secondary/40 p-3 text-sm blur-[5px] transition select-none hover:blur-none"
                      : "mt-3 text-sm leading-relaxed text-foreground/90"
                  }
                >
                  {p.body}
                </p>
                {p.spoiler ? (
                  <p className="mt-1 text-[11px] text-accent">
                    Spoiler up to Chapter 8 · tap to reveal
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="size-3.5" /> {formatCount(p.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="size-3.5" /> {formatCount(p.comments)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <Rail title="Recently published" subtitle="Fresh from the Import Studio">
          {fresh.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </Rail>

        <Rail title="Hidden gems" subtitle="New voices worth your evening">
          {hiddenGems.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </Rail>

        <section className="animate-rise px-4 lg:px-0">
          <h2 className="mb-3 font-display text-lg font-semibold">Recommended communities</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {communities.slice(0, 4).map((c) => (
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
                  className="mb-3 h-16 rounded-2xl"
                />
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {formatCount(c.members)} members
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
