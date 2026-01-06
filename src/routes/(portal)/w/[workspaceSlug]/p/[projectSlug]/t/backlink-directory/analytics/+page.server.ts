import type { PageServerLoad } from './$types';
import type { ProjectPageData } from '$lib/types';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();

	return {
		workspace: parentData.workspace,
		project: parentData.project,
		userRole: parentData.userRole,
	} as ProjectPageData;
};

