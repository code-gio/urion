import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { InviteMemberRequest, WorkspaceMemberInsert } from '$lib/types';
import { canManageMembers } from '$lib/types';
import type { WorkspaceRole, MemberStatus } from '$lib/types';
import { applySecurity, clearRateLimit } from '$lib/utils/api-security.js';
import { validateEmail, validateWorkspaceRole } from '$lib/utils/validation.js';

export const POST: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'invite',
		validateUUIDs: ['workspaceId'],
		maxBodySize: 1 * 1024, // 1KB
	});

	const { params, request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;
	const body: InviteMemberRequest & { userId?: string } = await request.json();

  // Validate and sanitize email
  try {
    body.email = validateEmail(body.email);
    if (body.role) {
      body.role = validateWorkspaceRole(body.role);
    }
  } catch (err) {
    throw error(400, err instanceof Error ? err.message : "Invalid input");
  }

  // Check if user is owner/admin
  const { data: inviter } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", params.workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!inviter || !canManageMembers(inviter.role as WorkspaceRole)) {
    throw error(403, "Insufficient permissions");
  }

  // Use provided userId or look up by email
  let targetUserId = body.userId;

  if (!targetUserId) {
    // Check if user already exists with this email
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", body.email)
      .single();

    targetUserId = existingUser?.id;
  }

  // Check if already a member
  if (targetUserId) {
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", params.workspaceId)
      .eq("user_id", targetUserId)
      .single();

    if (existingMember) {
      throw error(409, "User is already a member");
    }
  }

  // Create member entry
  const memberInsert: WorkspaceMemberInsert = {
    workspace_id: params.workspaceId,
    invited_email: targetUserId ? null : body.email,
    invited_by: targetUserId ? null : user.id,
    role: (body.role || "member") as WorkspaceRole,
    status: targetUserId
      ? ("active" as MemberStatus)
      : ("invited" as MemberStatus),
    user_id: targetUserId || null,
  };

  const { data: member, error: err } = await supabase
    .from("workspace_members")
    .insert(memberInsert)
    .select()
    .single();

  if (err) {
    console.error("Error creating member:", err);
    throw error(500, "Failed to add member");
  }

  // If user exists, member is added directly as active
  // If user doesn't exist, an invitation is created
  // TODO: Send invitation email for new users
  // if (!existingUser) {
  //   await sendInvitationEmail(body.email, workspace, inviter);
  // }

  // Clear rate limit on success
  await clearRateLimit(event, "invite");

  return json(member, { status: 201 });
};

