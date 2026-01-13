<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Checkbox from '$lib/components/ui/checkbox/index.js';
	import type { ProjectLocation } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		location,
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		location?: ProjectLocation | null;
		workspaceId: string;
		projectId: string;
		onSave?: (location: ProjectLocation) => void;
	} = $props();

	let name = $state(location?.name || '');
	let isPrimary = $state(location?.is_primary || false);
	let addressLine1 = $state(location?.address_line1 || '');
	let addressLine2 = $state(location?.address_line2 || '');
	let city = $state(location?.city || '');
	let region = $state(location?.region || '');
	let postalCode = $state(location?.postal_code || '');
	let country = $state(location?.country || '');
	let phone = $state(location?.phone || '');
	let email = $state(location?.email || '');
	let lat = $state(location?.lat?.toString() || '');
	let lng = $state(location?.lng?.toString() || '');
	let isSaving = $state(false);

	$effect(() => {
		if (location) {
			name = location.name || '';
			isPrimary = location.is_primary || false;
			addressLine1 = location.address_line1 || '';
			addressLine2 = location.address_line2 || '';
			city = location.city || '';
			region = location.region || '';
			postalCode = location.postal_code || '';
			country = location.country || '';
			phone = location.phone || '';
			email = location.email || '';
			lat = location.lat?.toString() || '';
			lng = location.lng?.toString() || '';
		} else {
			name = '';
			isPrimary = false;
			addressLine1 = '';
			addressLine2 = '';
			city = '';
			region = '';
			postalCode = '';
			country = '';
			phone = '';
			email = '';
			lat = '';
			lng = '';
		}
	});

	async function handleSave() {
		isSaving = true;

		try {
			const urlToUse = location?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/locations?id=${location.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/locations`;

			const method = location?.id ? 'PATCH' : 'POST';

			const payload: any = {
				name: name.trim() || null,
				is_primary: isPrimary,
				address_line1: addressLine1.trim() || null,
				address_line2: addressLine2.trim() || null,
				city: city.trim() || null,
				region: region.trim() || null,
				postal_code: postalCode.trim() || null,
				country: country.trim() || null,
				phone: phone.trim() || null,
				email: email.trim() || null,
				hours: location?.hours || {}
			};

			if (lat.trim()) {
				const latNum = parseFloat(lat);
				if (!isNaN(latNum)) {
					payload.lat = latNum;
				}
			} else {
				payload.lat = null;
			}

			if (lng.trim()) {
				const lngNum = parseFloat(lng);
				if (!isNaN(lngNum)) {
					payload.lng = lngNum;
				}
			} else {
				payload.lng = null;
			}

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save location');
			}

			const savedLocation = await response.json();
			toast.success(location?.id ? 'Location updated' : 'Location created');
			open = false;

			if (onSave) {
				onSave(savedLocation);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save location');
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{location?.id ? 'Edit Location' : 'Add Location'}</Dialog.Title>
			<Dialog.Description>Add a physical business location</Dialog.Description>
		</Dialog.Header>

		<div class="w-full max-w-4xl">
			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
				<Field.Set>
					<Field.Legend>Location Information</Field.Legend>
					<Field.Description>Add a physical business location</Field.Description>
					<Field.Separator />
					<Field.Group>
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="location-name">Name</Field.Label>
								<Field.Description>Name of the location</Field.Description>
							</Field.Content>
							<Input id="location-name" bind:value={name} placeholder="e.g., Main Office" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="is-primary">Primary Location</Field.Label>
								<Field.Description>Mark this as the primary location</Field.Description>
							</Field.Content>
							<div class="flex items-center space-x-2">
								<Checkbox.Root id="is-primary" bind:checked={isPrimary} />
								<label for="is-primary" class="text-sm">Primary location</label>
							</div>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="address-line1">Address Line 1</Field.Label>
								<Field.Description>Street address</Field.Description>
							</Field.Content>
							<Input id="address-line1" bind:value={addressLine1} placeholder="123 Main St" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="address-line2">Address Line 2</Field.Label>
								<Field.Description>Apartment, suite, etc.</Field.Description>
							</Field.Content>
							<Input id="address-line2" bind:value={addressLine2} placeholder="Suite 100" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="city">City</Field.Label>
								<Field.Description>City name</Field.Description>
							</Field.Content>
							<Input id="city" bind:value={city} placeholder="New York" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="region">Region/State</Field.Label>
								<Field.Description>State or province</Field.Description>
							</Field.Content>
							<Input id="region" bind:value={region} placeholder="NY" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="postal-code">Postal Code</Field.Label>
								<Field.Description>ZIP or postal code</Field.Description>
							</Field.Content>
							<Input id="postal-code" bind:value={postalCode} placeholder="10001" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="country">Country</Field.Label>
								<Field.Description>Country name</Field.Description>
							</Field.Content>
							<Input id="country" bind:value={country} placeholder="United States" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="phone">Phone</Field.Label>
								<Field.Description>Phone number</Field.Description>
							</Field.Content>
							<Input id="phone" bind:value={phone} placeholder="+1 (555) 123-4567" type="tel" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="email">Email</Field.Label>
								<Field.Description>Email address</Field.Description>
							</Field.Content>
							<Input id="email" bind:value={email} placeholder="location@example.com" type="email" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="lat">Latitude</Field.Label>
								<Field.Description>Geographic latitude</Field.Description>
							</Field.Content>
							<Input id="lat" bind:value={lat} placeholder="40.7128" type="number" step="any" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="lng">Longitude</Field.Label>
								<Field.Description>Geographic longitude</Field.Description>
							</Field.Content>
							<Input id="lng" bind:value={lng} placeholder="-74.0060" type="number" step="any" />
						</Field.Field>
					</Field.Group>
				</Field.Set>
			</form>
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				<Button variant="outline" disabled={isSaving}>
					Cancel
				</Button>
			</Dialog.Close>
			<Button onclick={handleSave} disabled={isSaving}>
				{isSaving ? 'Saving...' : location?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
