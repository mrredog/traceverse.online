import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Shelf = "saved" | "wishlist";

export interface LibraryProgress {
  bookId: string;
  chapterIdx: number;
  progress: number;
  updatedAt: string;
}

export interface LibraryShelfItem {
  bookId: string;
  shelf: Shelf;
}

const cleanId = (v: unknown): string => {
  const id = typeof v === "string" ? v.trim() : "";
  if (!id || id.length > 120) throw new Error("Missing book");
  return id;
};

const asShelf = (v: unknown): Shelf => (v === "wishlist" ? "wishlist" : "saved");

/** Everything on the signed-in reader's shelves: progress plus saved / wishlist books. */
export const getMyLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ progress: LibraryProgress[]; shelves: LibraryShelfItem[] }> => {
      const [prog, marks] = await Promise.all([
        context.supabase
          .from("reading_progress")
          .select("book_id, chapter_idx, progress, updated_at")
          .eq("user_id", context.userId)
          .order("updated_at", { ascending: false }),
        context.supabase
          .from("bookmarks")
          .select("book_id, shelf")
          .eq("user_id", context.userId)
          .order("created_at", { ascending: false }),
      ]);
      if (prog.error) throw new Error(prog.error.message);
      if (marks.error) throw new Error(marks.error.message);
      return {
        progress: (prog.data ?? []).map((r) => ({
          bookId: r.book_id,
          chapterIdx: r.chapter_idx ?? 1,
          progress: Number(r.progress ?? 0),
          updatedAt: r.updated_at,
        })),
        shelves: (marks.data ?? []).map((r) => ({ bookId: r.book_id, shelf: asShelf(r.shelf) })),
      };
    },
  );

/** One book's state for the signed-in reader: saved shelf and reading progress. */
export const getBookLibraryState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string }) => ({ bookId: cleanId(input?.bookId) }))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ shelf: Shelf | null; progress: number; chapterIdx: number }> => {
      const [mark, prog] = await Promise.all([
        context.supabase
          .from("bookmarks")
          .select("shelf")
          .eq("user_id", context.userId)
          .eq("book_id", data.bookId)
          .maybeSingle(),
        context.supabase
          .from("reading_progress")
          .select("progress, chapter_idx")
          .eq("user_id", context.userId)
          .eq("book_id", data.bookId)
          .maybeSingle(),
      ]);
      if (mark.error) throw new Error(mark.error.message);
      if (prog.error) throw new Error(prog.error.message);
      return {
        shelf: mark.data ? asShelf(mark.data.shelf) : null,
        progress: Number(prog.data?.progress ?? 0),
        chapterIdx: prog.data?.chapter_idx ?? 1,
      };
    },
  );

/** Put a book on a shelf, or take it off with `shelf: null`. */
export const setBookShelf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; shelf: Shelf | null }) => ({
    bookId: cleanId(input?.bookId),
    shelf: input?.shelf === null ? null : asShelf(input?.shelf),
  }))
  .handler(async ({ data, context }): Promise<{ shelf: Shelf | null }> => {
    const { supabase, userId } = context;
    const { error } = data.shelf
      ? await supabase
          .from("bookmarks")
          .upsert(
            { user_id: userId, book_id: data.bookId, shelf: data.shelf },
            { onConflict: "user_id,book_id" },
          )
      : await supabase.from("bookmarks").delete().eq("user_id", userId).eq("book_id", data.bookId);
    if (error) throw new Error(error.message);
    return { shelf: data.shelf };
  });

/** Remember how far the reader has got so they can pick up where they stopped. */
export const saveReadingProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookId: string; progress: number; chapterIdx: number }) => {
    const progress = Number(input?.progress);
    const chapterIdx = Math.floor(Number(input?.chapterIdx));
    return {
      bookId: cleanId(input?.bookId),
      progress: Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0,
      chapterIdx: Number.isFinite(chapterIdx) && chapterIdx >= 0 ? Math.min(chapterIdx, 10000) : 1,
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase.from("reading_progress").upsert(
      {
        user_id: context.userId,
        book_id: data.bookId,
        progress: Number(data.progress.toFixed(4)),
        chapter_idx: data.chapterIdx,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
