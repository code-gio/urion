<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { toast } from 'svelte-sonner';
	import { profileUpdateSchema } from '../schemas/profile.js';
	import { useUser } from '$lib/stores/index.js';

	const userState = useUser();
	const profile = $derived(userState.profile);

	if (!profile) {
		return;
	}

	let fullName = $state(profile.full_name || '');
	let displayName = $state(profile.display_name || '');
	let bio = $state(profile.bio || '');
	let avatarUrl = $state(profile.avatar_url || '');
	let isSaving = $state(false);

	// Sync form fields when profile changes
	$effect(() => {
		if (profile) {
			fullName = profile.full_name || '';
			displayName = profile.display_name || '';
			bio = profile.bio || '';
			avatarUrl = profile.avatar_url || '';
		}
	});

	async function saveProfile() {
		// Validate with schema
		const validation = profileUpdateSchema.safeParse({
			full_name: fullName || null,
			display_name: displayName || null,
			bio: bio || null,
			avatar_url: avatarUrl || null,
		});

		if (!validation.success) {
			const firstError = validation.error.issues[0];
			toast.error(firstError.message);
			return;
		}

		isSaving = true;

		try {
			await userState.updateProfile({
				full_name: fullName || null,
				display_name: displayName || null,
				bio: bio || null,
				avatar_url: avatarUrl || null,
			});

			toast.success('Profile updated successfully');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update profile');
		} finally {
			isSaving = false;
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Personal Information</CardTitle>
		<CardDescription>Update your profile information</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<Label for="full-name">Full Name</Label>
			<Input id="full-name" bind:value={fullName} placeholder="John Doe" disabled={isSaving} />
		</div>

		<div class="space-y-2">
			<Label for="display-name">Display Name</Label>
			<Input
				id="display-name"
				bind:value={displayName}
				placeholder="John"
				disabled={isSaving}
			/>
		</div>

		<div class="space-y-2">
			<Label for="avatar-url">Avatar URL</Label>
			<Input
				id="avatar-url"
				bind:value={avatarUrl}
				placeholder="https://..."
				disabled={isSaving}
			/>
		</div>

		<div class="space-y-2">
			<Label for="bio">Bio</Label>
			<Textarea id="bio" bind:value={bio} placeholder="Tell us about yourself..." disabled={isSaving} />
		</div>

		<div class="flex justify-end gap-2">
			<Button onclick={saveProfile} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save Changes'}
			</Button>
		</div>
	</CardContent>
</Card>

