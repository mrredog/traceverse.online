import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { BookCard } from "@/components/traceverse/BookCard";
import { EmptyState } from "@/components/traceverse/EmptyState";
import { Shell } from "@/components/traceverse/Shell";
import { genres } from "@/data/traceverse";
import { catalogueQueryOptions, useCatalogue } from "@/lib/catalogue-query";
import { Button } from "@/components/ui/button";
import { useMyLibrary } from "@/lib/use-my-library";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Your Library — TraceVerse" },
      {
        name: "description",
        content:
          "Continue reading, saved stories, wishlist and every genre in the TraceVerse library.",
      },
      { property: "og:title", content: "Your Library — TraceVerse" },
      {
        property: "og:description",
        content: "Continue reading, saved stories, wishlist and every genre on TraceVerse.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQueryOptions),
  component: LibraryPage,
});

const shelves = ["Reading", "Saved", "Finished"] as const;

function LibraryPage() {
  const { books } = useCatalogue();
  const lib = useMyLibrary();
  const [shelf, setShelf] = useState<(typeof shelves)[number]>("Reading");
  const [genre, setGenre] = useState<string | null>(null);

  const shelfBooks =
    shelf === "Reading"
      ? lib.reading
      : shelf === "Saved"
        ? lib.saved
        : lib.finished;

  const catalogue = genre ? books.filter((b) => b.genre === genre) : books;

  return (
    <Shell title="Library">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-4">
        {shelves.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setShelf(s)}
            className={cn(
              "shrink-0 rounded-2xl px-3.5 py-2 text-xs font-medium transition-colors",
              shelf === s
                ? "trace-gradient text-primary-foreground shadow-glow"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <section className="px-4">
        {!lib.signedIn && !lib.loading ? (
          <EmptyState
            icon={<BookOpen className="size-6" />}
            line="Sign in to keep your place, save books and build your shelves."
            action={
              <Button asChild className="rounded-2xl">
                <Link to="/auth">Sign in</Link>
              </Button>
            }
          />
        ) : lib.loading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-secondary/50" />
            ))}
          </div>
        ) : shelfBooks.length ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {shelfBooks.map((b) => (
              <BookCard key={b.id} book={b} className="w-full" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="size-6" />}
            line={
              shelf === "Reading"
                ? "Open a book and your place is saved here."
                : shelf === "Finished"
                  ? "Books you finish will be listed here."
                  : "Tap Save on any book to keep it here."
            }
          />
        )}
      </section>

      <section className="mt-9">
        <h2 className="px-4 font-display text-lg font-semibold">Browse categories</h2>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
          <button
            type="button"
            onClick={() => setGenre(null)}
            className={cn(
              "shrink-0 rounded-2xl px-3.5 py-2 text-xs",
              genre === null ? "bg-foreground/90 text-background" : "bg-secondary/60 text-muted-foreground",
            )}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className={cn(
                "shrink-0 rounded-2xl px-3.5 py-2 text-xs transition-colors",
                genre === g
                  ? "bg-foreground/90 text-background"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 px-4 sm:grid-cols-5">
          {catalogue.map((b) => (
            <BookCard key={b.id} book={b} className="w-full" />
          ))}
        </div>
        {catalogue.length === 0 ? (
          <div className="px-4 pt-4">
            <EmptyState
              icon={<BookOpen className="size-6" />}
              line="Nothing here yet — this shelf is waiting for its first story."
            />
          </div>
        ) : null}
      </section>
    </Shell>
  );
}
