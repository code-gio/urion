import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UpdateProfileRequest, ProfileUpdate, Profile } from '$lib/types';
import { applySecurity } from '$lib/utils/api-security.js';
import { validateLength, sanitizeString, validateURL } from '$lib/utils/validation.js';

export const GET: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: false, // GET requests don't need CSRF
		rateLimit: 'general',
	});

	const { locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;

	const { data: profile, error: err } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (err) {
		throw error(404, 'Profile not found');
	}

	return json(profile as Profile, {
		headers: {
			'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
		},
	});
};

export const PATCH: RequestHandler = async (event) => {
	// Apply security checks
	await applySecurity(event, {
		csrf: true,
		rateLimit: 'update',
		maxBodySize: 10 * 1024, // 10KB
	});

	const { request, locals } = event;
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = locals.supabase;
	const body: UpdateProfileRequest = await request.json();

	// Validate and sanitize input
	const profileUpdate: ProfileUpdate = {};
	if (body.full_name !== undefined) {
		try {
			profileUpdate.full_name = validateLength(body.full_name, 0, 100, 'Full name', true) || null;
		} catch (err) {
			throw error(400, err instanceof Error ? err.message : 'Invalid full name');
		}
	}
	if (body.display_name !== undefined) {
		try {
			profileUpdate.display_name = validateLength(body.display_name, 0, 50, 'Display name', true) || null;
		} catch (err) {
			throw error(400, err instanceof Error ? err.message : 'Invalid display name');
		}
	}
	if (body.avatar_url !== undefined) {
		try {
			profileUpdate.avatar_url = validateURL(body.avatar_url);
		} catch (err) {
			throw error(400, err instanceof Error ? err.message : 'Invalid avatar URL');
		}
	}
	if (body.bio !== undefined) {
		profileUpdate.bio = sanitizeString(body.bio, 500);
	}

	const { data: profile, error: err } = await supabase
		.from('profiles')
		.update(profileUpdate)
		.eq('id', user.id)
		.select()
		.single();

	if (err) {
		throw error(500, 'Failed to update profile');
	}

	return json(profile as Profile, {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
};

