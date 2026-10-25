import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** A URL is only accepted if it points at the caller's own folder in the expected public bucket. */
function assertOwnImageUrl(url: string, bucket: string, userId: string) {
  const base = process.env["SUPABASE_URL"];
  if (!base) throw new Error("Server is missing SUPABASE_URL.");
  const prefix = `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${userId}/`;
  if (!url.startsWith(prefix) || url.includes("..")) throw new Error("That image is not yours to use.");
}

/** Set or clear the signed-in user's profile picture (also shown on their author page). */
export const setMyAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string | null }) => ({ url: input?.url ?? null }))
  .handler(async ({ data, context }): Promise<{ avatarUrl: string | null }> => {
    const { userId } = context;
    if (data.url) assertOwnImageUrl(data.url, "avatars", userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: data.url })
      .eq("id", userId)
      .select("author_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (profile?.author_id) {
      await supabaseAdmin.from("authors").update({ avatar_url: data.url }).eq("id", profile.author_id);
    }
    return { avatarUrl: data.url };
  });

/** Set or clear a community's cover photo. Only the community's owner can do this. */
export const setCommunityCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { communityId: string; url: string | null }) => {
    if (!input?.communityId) throw new Error("Missing community");
    return { communityId: input.communityId, url: input.url ?? null };
  })
  .handler(async ({ data, context }): Promise<{ coverUrl: string | null }> => {
    const { userId } = context;
    if (data.url) assertOwnImageUrl(data.url, "community-covers", userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: community } = await supabaseAdmin
      .from("communities")
      .select("owner_id")
      .eq("id", data.communityId)
      .maybeSingle();
    if (!community || community.owner_id !== userId) {
      throw new Error("Only the community's owner can change its cover.");
    }
    const { error } = await supabaseAdmin
      .from("communities")
      .update({ cover_url: data.url })
      .eq("id", data.communityId);
    if (error) throw new Error(error.message);
    return { coverUrl: data.url };
  });
