<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select/index.js';

	let notificationsEnabled = $state(true);
	let emailNotifications = $state(true);
	let updateFrequency = $state('daily');

	const frequencyLabel = $derived(
		updateFrequency === 'realtime'
			? 'Real-time'
			: updateFrequency === 'hourly'
				? 'Hourly'
				: updateFrequency === 'daily'
					? 'Daily'
					: 'Weekly'
	);
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
		<p class="text-muted-foreground">Configure AI Citations tracking preferences</p>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Notifications</Card.Title>
			<Card.Description>Manage how you receive citation updates</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label for="notifications">Enable Notifications</Label>
					<p class="text-sm text-muted-foreground">
						Receive alerts about new citations and changes
					</p>
				</div>
				<Switch id="notifications" bind:checked={notificationsEnabled} />
			</div>

			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label for="email">Email Notifications</Label>
					<p class="text-sm text-muted-foreground">Get citation reports via email</p>
				</div>
				<Switch id="email" bind:checked={emailNotifications} disabled={!notificationsEnabled} />
			</div>

			<div class="space-y-2">
				<Label for="frequency">Update Frequency</Label>
				<Select.Root type="single" bind:value={updateFrequency}>
					<Select.Trigger id="frequency" class="w-full">
						{frequencyLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="realtime" label="Real-time">Real-time</Select.Item>
						<Select.Item value="hourly" label="Hourly">Hourly</Select.Item>
						<Select.Item value="daily" label="Daily">Daily</Select.Item>
						<Select.Item value="weekly" label="Weekly">Weekly</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Tracking</Card.Title>
			<Card.Description>Configure what gets tracked</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="keywords">Brand Keywords</Label>
				<Input
					id="keywords"
					placeholder="Enter keywords separated by commas"
					value="vercel, deployment, hosting"
				/>
				<p class="text-xs text-muted-foreground">
					These keywords will be tracked across AI platforms
				</p>
			</div>

			<div class="space-y-2">
				<Label for="competitors">Competitor Brands</Label>
				<Input
					id="competitors"
					placeholder="Enter competitor names separated by commas"
					value="netlify, aws amplify, render, heroku"
				/>
				<p class="text-xs text-muted-foreground">Monitor these competitors alongside your brand</p>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Data & Privacy</Card.Title>
			<Card.Description>Manage your data and privacy settings</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<Button variant="outline" class="w-full">Export All Data</Button>
			<Button variant="outline" class="w-full">Clear Cache</Button>
			<Button variant="destructive" class="w-full">Delete All Citation Data</Button>
		</Card.Content>
	</Card.Root>

	<div class="flex justify-end gap-2">
		<Button variant="outline">Cancel</Button>
		<Button>Save Changes</Button>
	</div>
</div>
