import type { PageServerLoad } from './$types';
import type { WorkspaceMemberWithProfile } from '$lib/types';

export const load: PageServerLoad = async ({
  locals: { safeGetSession, supabase },
  parent,
}) => {
  const { session, user } = await safeGetSession();

  if (!session || !user) {
    return {
      members: [],
      pendingInvites: [],
      workspaceOwner: null,
    };
  }

  const parentData = await parent();
  const workspace = parentData.workspace;

  if (!workspace) {
    return {
      members: [],
      pendingInvites: [],
      workspaceOwner: null,
    };
  }

  // Load workspace creator profile
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, display_name")
    .eq("id", workspace.created_by)
    .single();

  // Load active members
  const { data: membersData } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Load profiles for all members
  const memberUserIds =
    membersData?.filter((m) => m.user_id).map((m) => m.user_id) || [];
  const { data: profilesData } =
    memberUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, display_name")
          .in("id", memberUserIds)
      : { data: [] };

  // Combine members with their profiles
  const members: WorkspaceMemberWithProfile[] =
    membersData?.map((m) => ({
      ...m,
      profiles: profilesData?.find((p) => p.id === m.user_id) || null,
    })) || [];

  // Load pending invitations
  const { data: invitesData } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("status", "invited")
    .order("created_at", { ascending: false });

  // Load inviter profiles
  const inviterIds =
    invitesData?.filter((i) => i.invited_by).map((i) => i.invited_by) || [];
  const { data: invitersData } =
    inviterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, display_name")
          .in("id", inviterIds)
      : { data: [] };

  // Combine invites with inviter profiles
  const pendingInvites: WorkspaceMemberWithProfile[] =
    invitesData?.map((i) => ({
      ...i,
      profiles: invitersData?.find((p) => p.id === i.invited_by) || null,
    })) || [];

  return {
    members,
    pendingInvites,
    workspaceOwner: ownerProfile,
  };
};

