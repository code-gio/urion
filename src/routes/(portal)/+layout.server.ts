import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { Profile } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, url }) => {
	const { session, user } = await safeGetSession();

	// Redirect to sign-in if not authenticated
	if (!session || !user) {
		const currentPath = url.pathname + url.search;
		throw redirect(303, `/sign-in?redirect_to=${encodeURIComponent(currentPath)}`);
	}

	// Load user profile
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (profileError) {
		console.error('Failed to load profile:', profileError);
	}

	return {
		session,
		user,
		profile: (profile as Profile) || null,
	};
};

