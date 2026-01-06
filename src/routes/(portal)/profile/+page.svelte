<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Profile } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { toast } from 'svelte-sonner';

	let { data }: { data: { profile: Profile } } = $props();

	let fullName = $state(data.profile.full_name || '');
	let displayName = $state(data.profile.display_name || '');
	let bio = $state(data.profile.bio || '');
	let avatarUrl = $state(data.profile.avatar_url || '');
	let isSaving = $state(false);

	async function saveProfile() {
		isSaving = true;

		try {
			const response = await fetch('/api/profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					full_name: fullName || null,
					display_name: displayName || null,
					bio: bio || null,
					avatar_url: avatarUrl || null,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update profile');
			}

			toast.success('Profile updated successfully');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update profile');
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="container mx-auto py-8 px-4 max-w-2xl">
	<h1 class="text-3xl font-bold mb-8">Profile Settings</h1>

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
</div>

