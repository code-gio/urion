<script lang="ts">
	import type { BacklinkSubmissionWithSite } from '$lib/types';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let {
		submissions,
		limit = 10,
	}: {
		submissions: BacklinkSubmissionWithSite[];
		limit?: number;
	} = $props();

	const topPerformers = $derived(
		submissions
			.filter((s) => s.status === 'approved' && s.is_live)
			.sort((a, b) => (b.referral_traffic || 0) - (a.referral_traffic || 0))
			.slice(0, limit)
	);
</script>

<div class="rounded-md border">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Site</TableHead>
				<TableHead>DR</TableHead>
				<TableHead>Traffic</TableHead>
				<TableHead>Conversions</TableHead>
				<TableHead>Status</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if topPerformers.length === 0}
				<TableRow>
					<TableCell colspan="5" class="text-center text-muted-foreground py-8">
						No performance data available
					</TableCell>
				</TableRow>
			{:else}
				{#each topPerformers as submission}
					<TableRow>
						<TableCell class="font-medium">
							{submission.site?.name || 'Unknown'}
						</TableCell>
						<TableCell>
							{submission.site?.dr !== null ? submission.site.dr : 'N/A'}
						</TableCell>
						<TableCell>
							{(submission.referral_traffic || 0).toLocaleString()}
						</TableCell>
						<TableCell>
							{(submission.conversion_count || 0).toLocaleString()}
						</TableCell>
						<TableCell>
							<Badge variant={submission.is_live ? 'default' : 'secondary'}>
								{submission.is_live ? 'Live' : 'Approved'}
							</Badge>
						</TableCell>
					</TableRow>
				{/each}
			{/if}
		</TableBody>
	</Table>
</div>

