import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();

	return {
		workspace: parentData.workspace,
		project: parentData.project,
		canEdit: parentData.canEdit
	};
};
