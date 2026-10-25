import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";

import type { Book } from "@/data/traceverse";
import { useAuth } from "@/hooks/useAuth";
import { useCatalogue } from "@/lib/catalogue-query";
import { getMyLibrary } from "@/lib/library.functions";

/** The signed-in reader's real shelves, joined with the catalogue. */
export function useMyLibrary() {
  const { user, loading: authLoading } = useAuth();
  const { books } = useCatalogue();
  const fetchLibrary = useServerFn(getMyLibrary);
  const query = useQuery({
    queryKey: ["my-library", user?.id ?? "anon"],
    queryFn: () => fetchLibrary(),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const shelves = useMemo(() => {
    const byId = new Map(books.map((b) => [b.id, b]));
    const withProgress = (id: string, progress: number): Book | undefined => {
      const b = byId.get(id);
      return b ? { ...b, progress } : undefined;
    };
    const progress = query.data?.progress ?? [];
    const marks = query.data?.shelves ?? [];
    const pick = (list: (Book | undefined)[]) => list.filter((b): b is Book => Boolean(b));
    const progressOf = new Map(progress.map((p) => [p.bookId, p.progress]));
    return {
      reading: pick(progress.filter((p) => p.progress > 0 && p.progress < 0.98).map((p) => withProgress(p.bookId, p.progress))),
      finished: pick(progress.filter((p) => p.progress >= 0.98).map((p) => withProgress(p.bookId, 1))),
      saved: pick(marks.filter((m) => m.shelf === "saved").map((m) => {
        const p = progressOf.get(m.bookId);
        return p ? withProgress(m.bookId, p) : byId.get(m.bookId);
      })),
      wishlist: pick(marks.filter((m) => m.shelf === "wishlist").map((m) => byId.get(m.bookId))),
    };
  }, [books, query.data]);

  return {
    user,
    signedIn: Boolean(user),
    loading: authLoading || (Boolean(user) && query.isPending),
    error: query.error,
    ...shelves,
  };
}
