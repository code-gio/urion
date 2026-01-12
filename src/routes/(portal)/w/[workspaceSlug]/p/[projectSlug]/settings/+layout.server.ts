import type { LayoutServerLoad } from './$types';
import { checkProjectAccess } from '$lib/server/tools.js';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ parent, locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const parentData = await parent();
	const { workspace, project } = parentData;

	if (!workspace || !project) {
		throw error(404, 'Workspace or project not found');
	}

	// Check access
	const { authorized } = await checkProjectAccess(
		locals.supabase,
		user.id,
		workspace.id,
		project.id
	);

	if (!authorized) {
		throw error(403, 'Forbidden');
	}

	// Determine if user can edit (admin/owner can edit, viewer is read-only)
	const canEdit = parentData.userRole === 'admin' || parentData.userRole === 'owner';

	return {
		workspace,
		project,
		userRole: parentData.userRole,
		canEdit
	};
};
