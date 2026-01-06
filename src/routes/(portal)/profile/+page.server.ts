import type { PageServerLoad } from './$types';
import type { Profile } from '$lib/types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const { data: profile, error: err } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (err) {
		throw error(404, 'Profile not found');
	}

	return {
		profile: profile as Profile,
	};
};

