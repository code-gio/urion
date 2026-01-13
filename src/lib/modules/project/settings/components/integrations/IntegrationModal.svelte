<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { ProjectIntegration, IntegrationType } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		integration,
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		integration?: ProjectIntegration | null;
		workspaceId: string;
		projectId: string;
		onSave?: (integration: ProjectIntegration) => void;
	} = $props();

	let integrationType = $state<IntegrationType>(integration?.integration_type || 'other');
	let provider = $state(integration?.provider || '');
	let externalAccountId = $state(integration?.external_account_id || '');
	let status = $state<'active' | 'disabled' | 'error'>(integration?.status || 'active');
	let notes = $state(integration?.notes || '');
	let isSaving = $state(false);

	const integrationTypeLabel = $derived(
		integrationType === 'analytics'
			? 'Analytics'
			: integrationType === 'crm'
				? 'CRM'
				: integrationType === 'cms'
					? 'CMS'
					: integrationType === 'ads'
						? 'Ads'
						: integrationType === 'email'
							? 'Email'
							: integrationType === 'payment'
								? 'Payment'
								: integrationType === 'support'
									? 'Support'
									: integrationType === 'ab_testing'
										? 'A/B Testing'
										: 'Other'
	);

	const statusLabel = $derived(
		status === 'active' ? 'Active' : status === 'disabled' ? 'Disabled' : 'Error'
	);

	$effect(() => {
		if (integration) {
			integrationType = integration.integration_type;
			provider = integration.provider;
			externalAccountId = integration.external_account_id || '';
			status = integration.status;
			notes = integration.notes || '';
		} else {
			integrationType = 'other';
			provider = '';
			externalAccountId = '';
			status = 'active';
			notes = '';
		}
	});

	async function handleSave() {
		if (!provider.trim()) {
			toast.error('Provider is required');
			return;
		}

		isSaving = true;

		try {
			const urlToUse = integration?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/integrations?id=${integration.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/integrations`;

			const method = integration?.id ? 'PATCH' : 'POST';

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					integration_type: integrationType,
					provider: provider.trim(),
					external_account_id: externalAccountId.trim() || null,
					status,
					config: integration?.config || {},
					notes: notes.trim() || null
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save integration');
			}

			const savedIntegration = await response.json();
			toast.success(integration?.id ? 'Integration updated' : 'Integration created');
			open = false;

			if (onSave) {
				onSave(savedIntegration);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save integration');
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{integration?.id ? 'Edit Integration' : 'Add Integration'}</Dialog.Title>
			<Dialog.Description>Configure third-party integrations</Dialog.Description>
		</Dialog.Header>

		<div class="w-full max-w-4xl">
			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
				<Field.Set>
					<Field.Legend>Integration Information</Field.Legend>
					<Field.Description>Configure third-party integrations</Field.Description>
					<Field.Separator />
					<Field.Group>
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="provider">Provider *</Field.Label>
								<Field.Description>Name of the integration provider</Field.Description>
							</Field.Content>
							<Input id="provider" bind:value={provider} placeholder="e.g., Google Analytics, Stripe" required />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="integration-type">Integration Type</Field.Label>
								<Field.Description>Type of integration</Field.Description>
							</Field.Content>
							<Select.Root type="single" bind:value={integrationType}>
								<Select.Trigger id="integration-type">
									{integrationTypeLabel}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="analytics" label="Analytics">Analytics</Select.Item>
									<Select.Item value="crm" label="CRM">CRM</Select.Item>
									<Select.Item value="cms" label="CMS">CMS</Select.Item>
									<Select.Item value="ads" label="Ads">Ads</Select.Item>
									<Select.Item value="email" label="Email">Email</Select.Item>
									<Select.Item value="payment" label="Payment">Payment</Select.Item>
									<Select.Item value="support" label="Support">Support</Select.Item>
									<Select.Item value="ab_testing" label="A/B Testing">A/B Testing</Select.Item>
									<Select.Item value="other" label="Other">Other</Select.Item>
								</Select.Content>
							</Select.Root>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="external-account-id">External Account ID</Field.Label>
								<Field.Description>External account identifier (optional)</Field.Description>
							</Field.Content>
							<Input
								id="external-account-id"
								bind:value={externalAccountId}
								placeholder="e.g., UA-123456789-1"
							/>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="status">Status</Field.Label>
								<Field.Description>Integration status</Field.Description>
							</Field.Content>
							<Select.Root type="single" bind:value={status}>
								<Select.Trigger id="status">
									{statusLabel}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="active" label="Active">Active</Select.Item>
									<Select.Item value="disabled" label="Disabled">Disabled</Select.Item>
									<Select.Item value="error" label="Error">Error</Select.Item>
								</Select.Content>
							</Select.Root>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="integration-notes">Notes</Field.Label>
								<Field.Description>Additional notes about this integration</Field.Description>
							</Field.Content>
							<Textarea
								id="integration-notes"
								bind:value={notes}
								placeholder="Additional notes..."
								rows="3"
								class="min-h-[80px] resize-none"
							/>
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
			<Button onclick={handleSave} disabled={isSaving || !provider.trim()}>
				{isSaving ? 'Saving...' : integration?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
