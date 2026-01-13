import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    throw error(401, "Unauthorized");
  }

  const query = url.searchParams.get("q");
  const workspaceId = url.searchParams.get("workspaceId");

  if (!query || query.length < 2) {
    return json([]);
  }

  const supabase = locals.supabase;

  // Search users by email or name
  const { data: users, error: err } = await supabase
    .from("profiles")
    .select("id, email, full_name, display_name, avatar_url")
    .or(
      `email.ilike.%${query}%,full_name.ilike.%${query}%,display_name.ilike.%${query}%`
    )
    .limit(10);

  if (err) {
    console.error("Error searching users:", err);
    throw error(500, "Failed to search users");
  }

  // If workspaceId provided, check which users are already members
  if (workspaceId && users) {
    const userIds = users.map((u) => u.id);

    const { data: existingMembers } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .in("user_id", userIds);

    const memberIds = new Set(existingMembers?.map((m) => m.user_id) || []);

    // Add isMember flag to each user
    const usersWithMemberStatus = users.map((u) => ({
      ...u,
      isMember: memberIds.has(u.id),
    }));

    return json(usersWithMemberStatus);
  }

  return json(users || []);
};
