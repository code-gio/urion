<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { MultiValueInput } from '$lib/modules/project/settings';
	import { toolsApi } from '$lib/api/tools-client.js';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';

	interface Props {
		workspace: any;
		project: any;
		tool: any;
		toolActivation: any;
		canEdit: boolean;
	}

	let { workspace, project, tool, toolActivation, canEdit }: Props = $props();

	// Default config structure
	const defaultConfig = {
		rubric: {
			visibility: {
				measure: "appearance_rate",
				serp_depth: 10,
				minimum_samples: 30
			},
			claim_quality: {
				disallow_legal_advice: true,
				disallow_personal_data: true,
				require_context_for_stats: true,
				disallow_unverifiable_superlatives: true
			},
			scoring_model: "geo_visibility",
			citation_integrity: {
				require_quote_snippet: true,
				min_citations_per_claim: 1,
				citation_must_match_chunk: true
			},
			competitor_comparison: {
				metrics: ["visibility_share", "citation_share"],
				tie_breaker: "citation_share",
				compute_closest_competitor: true
			}
		},
		refresh: {
			citation_days: 7,
			query_library_days: 14
		},
		retrieval: {
			top_k: 10,
			source_mode: "hybrid",
			source_quality: {
				prefer_domains: [],
				blocked_domains: [],
				allow_third_party: true
			},
			preferred_source_types: ["web"]
		},
		generation: {
			mode: "seed_plus_templates",
			locations: [],
			max_queries: 50,
			seed_queries: [],
			service_terms: [],
			intent_modifiers: {
				exclude: [],
				include: []
			}
		},
		query_keys: []
	};

	// Initialize config from toolActivation or use defaults
	const initialConfig = $derived(toolActivation?.config || defaultConfig);
	
	// Initialize state from config
	$effect(() => {
		const config = toolActivation?.config || defaultConfig;
		
		// Rubric settings
		visibilityMeasure = config.rubric?.visibility?.measure || "appearance_rate";
		serpDepth = config.rubric?.visibility?.serp_depth || 10;
		minimumSamples = config.rubric?.visibility?.minimum_samples || 30;
		disallowLegalAdvice = config.rubric?.claim_quality?.disallow_legal_advice ?? true;
		disallowPersonalData = config.rubric?.claim_quality?.disallow_personal_data ?? true;
		requireContextForStats = config.rubric?.claim_quality?.require_context_for_stats ?? true;
		disallowUnverifiableSuperlatives = config.rubric?.claim_quality?.disallow_unverifiable_superlatives ?? true;
		scoringModel = config.rubric?.scoring_model || "geo_visibility";
		requireQuoteSnippet = config.rubric?.citation_integrity?.require_quote_snippet ?? true;
		minCitationsPerClaim = config.rubric?.citation_integrity?.min_citations_per_claim || 1;
		citationMustMatchChunk = config.rubric?.citation_integrity?.citation_must_match_chunk ?? true;
		competitorMetrics = config.rubric?.competitor_comparison?.metrics || ["visibility_share", "citation_share"];
		tieBreaker = config.rubric?.competitor_comparison?.tie_breaker || "citation_share";
		computeClosestCompetitor = config.rubric?.competitor_comparison?.compute_closest_competitor ?? true;

		// Refresh settings
		citationDays = config.refresh?.citation_days || 7;
		queryLibraryDays = config.refresh?.query_library_days || 14;

		// Retrieval settings
		topK = config.retrieval?.top_k || 10;
		sourceMode = config.retrieval?.source_mode || "hybrid";
		preferDomains = config.retrieval?.source_quality?.prefer_domains || [];
		blockedDomains = config.retrieval?.source_quality?.blocked_domains || [];
		allowThirdParty = config.retrieval?.source_quality?.allow_third_party ?? true;
		preferredSourceTypes = config.retrieval?.preferred_source_types || ["web"];

		// Generation settings
		generationMode = config.generation?.mode || "seed_plus_templates";
		locations = config.generation?.locations || [];
		maxQueries = config.generation?.max_queries || 50;
		seedQueries = config.generation?.seed_queries || [];
		serviceTerms = config.generation?.service_terms || [];
		intentExclude = config.generation?.intent_modifiers?.exclude || [];
		intentInclude = config.generation?.intent_modifiers?.include || [];

		// Query keys
		queryKeys = config.query_keys || [];
	});

	// Rubric settings
	let visibilityMeasure = $state("appearance_rate");
	let serpDepth = $state(10);
	let minimumSamples = $state(30);
	let disallowLegalAdvice = $state(true);
	let disallowPersonalData = $state(true);
	let requireContextForStats = $state(true);
	let disallowUnverifiableSuperlatives = $state(true);
	let scoringModel = $state("geo_visibility");
	let requireQuoteSnippet = $state(true);
	let minCitationsPerClaim = $state(1);
	let citationMustMatchChunk = $state(true);
	let competitorMetrics = $state<string[]>(["visibility_share", "citation_share"]);
	let tieBreaker = $state("citation_share");
	let computeClosestCompetitor = $state(true);

	// Refresh settings
	let citationDays = $state(7);
	let queryLibraryDays = $state(14);

	// Retrieval settings
	let topK = $state(10);
	let sourceMode = $state("hybrid");
	let preferDomains = $state<string[]>([]);
	let blockedDomains = $state<string[]>([]);
	let allowThirdParty = $state(true);
	let preferredSourceTypes = $state<string[]>(["web"]);

	// Generation settings
	let generationMode = $state("seed_plus_templates");
	let locations = $state<Array<{ label: string; state: string; variants: string[] }>>([]);
	let maxQueries = $state(50);
	let seedQueries = $state<string[]>([]);
	let serviceTerms = $state<Array<{ terms: string[]; topic: string }>>([]);
	let intentExclude = $state<string[]>([]);
	let intentInclude = $state<string[]>([]);

	// Query keys
	let queryKeys = $state<string[]>([]);

	let isSaving = $state(false);

	const visibilityMeasureLabel = $derived(
		visibilityMeasure === "appearance_rate" ? "Appearance Rate" : "Other"
	);

	const scoringModelLabel = $derived(
		scoringModel === "geo_visibility" ? "Geo Visibility" : scoringModel === "citation_quality" ? "Citation Quality" : "Other"
	);

	const sourceModeLabel = $derived(
		sourceMode === "hybrid" ? "Hybrid" : sourceMode === "preferred" ? "Preferred Only" : "All Sources"
	);

	const generationModeLabel = $derived(
		generationMode === "seed_plus_templates" ? "Seed + Templates" : generationMode === "seed_only" ? "Seed Only" : "Templates Only"
	);

	const tieBreakerLabel = $derived(
		tieBreaker === "citation_share" ? "Citation Share" : "Visibility Share"
	);

	async function handleSave() {
		if (!tool || !canEdit) return;

		isSaving = true;
		try {
			const config = {
				rubric: {
					visibility: {
						measure: visibilityMeasure,
						serp_depth: serpDepth,
						minimum_samples: minimumSamples
					},
					claim_quality: {
						disallow_legal_advice: disallowLegalAdvice,
						disallow_personal_data: disallowPersonalData,
						require_context_for_stats: requireContextForStats,
						disallow_unverifiable_superlatives: disallowUnverifiableSuperlatives
					},
					scoring_model: scoringModel,
					citation_integrity: {
						require_quote_snippet: requireQuoteSnippet,
						min_citations_per_claim: minCitationsPerClaim,
						citation_must_match_chunk: citationMustMatchChunk
					},
					competitor_comparison: {
						metrics: competitorMetrics,
						tie_breaker: tieBreaker,
						compute_closest_competitor: computeClosestCompetitor
					}
				},
				refresh: {
					citation_days: citationDays,
					query_library_days: queryLibraryDays
				},
				retrieval: {
					top_k: topK,
					source_mode: sourceMode,
					source_quality: {
						prefer_domains: preferDomains,
						blocked_domains: blockedDomains,
						allow_third_party: allowThirdParty
					},
					preferred_source_types: preferredSourceTypes
				},
				generation: {
					mode: generationMode,
					locations: locations,
					max_queries: maxQueries,
					seed_queries: seedQueries,
					service_terms: serviceTerms,
					intent_modifiers: {
						exclude: intentExclude,
						include: intentInclude
					}
				},
				query_keys: queryKeys
			};

			await toolsApi.updateToolConfig(workspace.id, project.id, tool.id, config);
			toast.success('Settings saved successfully');
		} catch (error) {
			console.error('Error saving settings:', error);
			toast.error('Failed to save settings');
		} finally {
			isSaving = false;
		}
	}

	function addLocation() {
		locations = [...locations, { label: "", state: "", variants: [] }];
	}

	function removeLocation(index: number) {
		locations = locations.filter((_loc: { label: string; state: string; variants: string[] }, i: number) => i !== index);
	}

	function updateLocation(index: number, field: string, value: string) {
		locations = locations.map((loc: { label: string; state: string; variants: string[] }, i: number) => 
			i === index ? { ...loc, [field]: value } : loc
		);
	}

	function addLocationVariant(locationIndex: number) {
		locations = locations.map((loc: { label: string; state: string; variants: string[] }, i: number) => 
			i === locationIndex 
				? { ...loc, variants: [...(loc.variants || []), ""] }
				: loc
		);
	}

	function removeLocationVariant(locationIndex: number, variantIndex: number) {
		locations = locations.map((loc: { label: string; state: string; variants: string[] }, i: number) => 
			i === locationIndex 
				? { ...loc, variants: loc.variants.filter((_v: string, vi: number) => vi !== variantIndex) }
				: loc
		);
	}

	function addServiceTerm() {
		serviceTerms = [...serviceTerms, { terms: [], topic: "" }];
	}

	function removeServiceTerm(index: number) {
		serviceTerms = serviceTerms.filter((_term: { terms: string[]; topic: string }, i: number) => i !== index);
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
		<p class="text-muted-foreground">Configure AI Citations tracking preferences</p>
	</div>

	<!-- Rubric Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Rubric Settings</Card.Title>
			<Card.Description>Configure visibility, claim quality, and citation integrity rules</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<Field.Set>
				<Field.Legend>Visibility Settings</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="visibility-measure">Measure</Field.Label>
							<Field.Description>How visibility is measured</Field.Description>
						</Field.Content>
						<Select.Root type="single" bind:value={visibilityMeasure} disabled={!canEdit || isSaving}>
							<Select.Trigger id="visibility-measure" class="w-full">
								{visibilityMeasureLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="appearance_rate" label="Appearance Rate">Appearance Rate</Select.Item>
							</Select.Content>
						</Select.Root>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="serp-depth">SERP Depth</Field.Label>
							<Field.Description>Number of SERP results to analyze</Field.Description>
						</Field.Content>
						<Input
							id="serp-depth"
							type="number"
							bind:value={serpDepth}
							min="1"
							max="100"
							disabled={!canEdit || isSaving}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="minimum-samples">Minimum Samples</Field.Label>
							<Field.Description>Minimum number of samples required</Field.Description>
						</Field.Content>
						<Input
							id="minimum-samples"
							type="number"
							bind:value={minimumSamples}
							min="1"
							disabled={!canEdit || isSaving}
						/>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Claim Quality</Field.Legend>
				<Field.Description>Configure claim quality rules</Field.Description>
				<Field.Separator />
				<div class="space-y-4">
					<div class="flex items-center space-x-2">
						<Switch
							id="disallow-legal-advice"
							bind:checked={disallowLegalAdvice}
							disabled={!canEdit || isSaving}
						/>
						<Label for="disallow-legal-advice">Disallow Legal Advice</Label>
					</div>
					<p class="text-sm text-muted-foreground ml-8">Prevent claims that constitute legal advice</p>

					<div class="flex items-center space-x-2">
						<Switch
							id="disallow-personal-data"
							bind:checked={disallowPersonalData}
							disabled={!canEdit || isSaving}
						/>
						<Label for="disallow-personal-data">Disallow Personal Data</Label>
					</div>
					<p class="text-sm text-muted-foreground ml-8">Prevent claims containing personal data</p>

					<div class="flex items-center space-x-2">
						<Switch
							id="require-context-stats"
							bind:checked={requireContextForStats}
							disabled={!canEdit || isSaving}
						/>
						<Label for="require-context-stats">Require Context for Stats</Label>
					</div>
					<p class="text-sm text-muted-foreground ml-8">Require contextual information for statistical claims</p>

					<div class="flex items-center space-x-2">
						<Switch
							id="disallow-superlatives"
							bind:checked={disallowUnverifiableSuperlatives}
							disabled={!canEdit || isSaving}
						/>
						<Label for="disallow-superlatives">Disallow Unverifiable Superlatives</Label>
					</div>
					<p class="text-sm text-muted-foreground ml-8">Prevent unverifiable superlative claims</p>
				</div>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Scoring Model</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="scoring-model">Model</Field.Label>
							<Field.Description>Scoring model to use</Field.Description>
						</Field.Content>
						<Select.Root type="single" bind:value={scoringModel} disabled={!canEdit || isSaving}>
							<Select.Trigger id="scoring-model" class="w-full">
								{scoringModelLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="geo_visibility" label="Geo Visibility">Geo Visibility</Select.Item>
								<Select.Item value="citation_quality" label="Citation Quality">Citation Quality</Select.Item>
							</Select.Content>
						</Select.Root>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Citation Integrity</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="min-citations">Min Citations Per Claim</Field.Label>
							<Field.Description>Minimum number of citations required per claim</Field.Description>
						</Field.Content>
						<Input
							id="min-citations"
							type="number"
							bind:value={minCitationsPerClaim}
							min="1"
							disabled={!canEdit || isSaving}
						/>
					</Field.Field>
				</Field.Group>
				<div class="space-y-4 mt-4">
					<div class="flex items-center space-x-2">
						<Switch
							id="require-quote-snippet"
							bind:checked={requireQuoteSnippet}
							disabled={!canEdit || isSaving}
						/>
						<Label for="require-quote-snippet">Require Quote Snippet</Label>
					</div>
					<p class="text-sm text-muted-foreground ml-8">Require quote snippets for citations</p>

					<div class="flex items-center space-x-2">
						<Switch
							id="citation-match-chunk"
							bind:checked={citationMustMatchChunk}
							disabled={!canEdit || isSaving}
						/>
						<Label for="citation-match-chunk">Citation Must Match Chunk</Label>
					</div>
					<p class="text-sm text-muted-foreground ml-8">Require citations to match content chunks</p>
				</div>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Competitor Comparison</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label>Metrics</Field.Label>
							<Field.Description>Metrics to use for competitor comparison</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={competitorMetrics}
							placeholder="visibility_share"
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="tie-breaker">Tie Breaker</Field.Label>
							<Field.Description>Metric to use as tie breaker</Field.Description>
						</Field.Content>
						<Select.Root type="single" bind:value={tieBreaker} disabled={!canEdit || isSaving}>
							<Select.Trigger id="tie-breaker" class="w-full">
								{tieBreakerLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="citation_share" label="Citation Share">Citation Share</Select.Item>
								<Select.Item value="visibility_share" label="Visibility Share">Visibility Share</Select.Item>
							</Select.Content>
						</Select.Root>
					</Field.Field>
				</Field.Group>
				<div class="space-y-4 mt-4">
					<div class="flex items-center space-x-2">
						<Switch
							id="compute-closest"
							bind:checked={computeClosestCompetitor}
							disabled={!canEdit || isSaving}
						/>
						<Label for="compute-closest">Compute Closest Competitor</Label>
					</div>
					<p class="text-sm text-muted-foreground ml-8">Calculate closest competitor automatically</p>
				</div>
			</Field.Set>
		</Card.Content>
	</Card.Root>

	<!-- Refresh Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Refresh Settings</Card.Title>
			<Card.Description>Configure refresh intervals for citations and queries</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<Field.Set>
				<Field.Legend>Refresh Intervals</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="citation-days">Citation Days</Field.Label>
							<Field.Description>Number of days between citation refreshes</Field.Description>
						</Field.Content>
						<Input
							id="citation-days"
							type="number"
							bind:value={citationDays}
							min="1"
							disabled={!canEdit || isSaving}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="query-library-days">Query Library Days</Field.Label>
							<Field.Description>Number of days between query library refreshes</Field.Description>
						</Field.Content>
						<Input
							id="query-library-days"
							type="number"
							bind:value={queryLibraryDays}
							min="1"
							disabled={!canEdit || isSaving}
						/>
					</Field.Field>
				</Field.Group>
			</Field.Set>
		</Card.Content>
	</Card.Root>

	<!-- Retrieval Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Retrieval Settings</Card.Title>
			<Card.Description>Configure source retrieval and quality preferences</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<Field.Set>
				<Field.Legend>Retrieval Configuration</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="top-k">Top K</Field.Label>
							<Field.Description>Number of top results to retrieve</Field.Description>
						</Field.Content>
						<Input
							id="top-k"
							type="number"
							bind:value={topK}
							min="1"
							max="100"
							disabled={!canEdit || isSaving}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="source-mode">Source Mode</Field.Label>
							<Field.Description>How to select sources</Field.Description>
						</Field.Content>
						<Select.Root type="single" bind:value={sourceMode} disabled={!canEdit || isSaving}>
							<Select.Trigger id="source-mode" class="w-full">
								{sourceModeLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="hybrid" label="Hybrid">Hybrid</Select.Item>
								<Select.Item value="preferred" label="Preferred Only">Preferred Only</Select.Item>
								<Select.Item value="all" label="All Sources">All Sources</Select.Item>
							</Select.Content>
						</Select.Root>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Source Quality</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label>Prefer Domains</Field.Label>
							<Field.Description>Domains to prefer when retrieving sources</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={preferDomains}
							placeholder="example.com"
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label>Blocked Domains</Field.Label>
							<Field.Description>Domains to exclude from retrieval</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={blockedDomains}
							placeholder="spam.com"
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label>Preferred Source Types</Field.Label>
							<Field.Description>Types of sources to prefer</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={preferredSourceTypes}
							placeholder="web"
						/>
					</Field.Field>
				</Field.Group>
				<div class="space-y-4 mt-4">
					<div class="flex items-center space-x-2">
						<Switch
							id="allow-third-party"
							bind:checked={allowThirdParty}
							disabled={!canEdit || isSaving}
						/>
						<Label for="allow-third-party">Allow Third Party</Label>
					</div>
					<p class="text-sm text-muted-foreground ml-8">Allow third-party sources</p>
				</div>
			</Field.Set>
		</Card.Content>
	</Card.Root>

	<!-- Generation Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Generation Settings</Card.Title>
			<Card.Description>Configure query generation and location settings</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<Field.Set>
				<Field.Legend>Generation Configuration</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="generation-mode">Mode</Field.Label>
							<Field.Description>Query generation mode</Field.Description>
						</Field.Content>
						<Select.Root type="single" bind:value={generationMode} disabled={!canEdit || isSaving}>
							<Select.Trigger id="generation-mode" class="w-full">
								{generationModeLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="seed_plus_templates" label="Seed + Templates">Seed + Templates</Select.Item>
								<Select.Item value="seed_only" label="Seed Only">Seed Only</Select.Item>
								<Select.Item value="templates_only" label="Templates Only">Templates Only</Select.Item>
							</Select.Content>
						</Select.Root>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="max-queries">Max Queries</Field.Label>
							<Field.Description>Maximum number of queries to generate</Field.Description>
						</Field.Content>
						<Input
							id="max-queries"
							type="number"
							bind:value={maxQueries}
							min="1"
							disabled={!canEdit || isSaving}
						/>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Locations</Field.Legend>
				<Field.Description>Geographic locations for query generation</Field.Description>
				<Field.Separator />
				<div class="space-y-4">
					{#each locations as location, index}
						<div class="border rounded-lg p-4 space-y-4">
							<div class="flex justify-between items-center">
								<h4 class="font-medium">Location {index + 1}</h4>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onclick={() => removeLocation(index)}
									disabled={!canEdit || isSaving}
								>
									Remove
								</Button>
							</div>
							<Field.Group>
								<Field.Field orientation="responsive">
									<Field.Content>
										<Field.Label>Label</Field.Label>
									</Field.Content>
									<Input
										bind:value={location.label}
										placeholder="Las Vegas"
										disabled={!canEdit || isSaving}
									/>
								</Field.Field>
								<Field.Separator />
								<Field.Field orientation="responsive">
									<Field.Content>
										<Field.Label>State</Field.Label>
									</Field.Content>
									<Input
										bind:value={location.state}
										placeholder="NV"
										disabled={!canEdit || isSaving}
									/>
								</Field.Field>
							</Field.Group>
							<div class="space-y-2">
								<Label>Variants</Label>
								<MultiValueInput
									bind:values={location.variants}
									placeholder="Las Vegas NV"
								/>
							</div>
						</div>
					{/each}
					<Button
						type="button"
						variant="outline"
						onclick={addLocation}
						disabled={!canEdit || isSaving}
					>
						Add Location
					</Button>
				</div>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Seed Queries</Field.Legend>
				<Field.Description>Initial seed queries for generation</Field.Description>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label>Seed Queries</Field.Label>
						</Field.Content>
						<MultiValueInput
							bind:values={seedQueries}
							placeholder="criminal defense attorney las vegas"
						/>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Service Terms</Field.Legend>
				<Field.Description>Service terms and their associated topics</Field.Description>
				<Field.Separator />
				<div class="space-y-4">
					{#each serviceTerms as serviceTerm, index}
						<div class="border rounded-lg p-4 space-y-4">
							<div class="flex justify-between items-center">
								<h4 class="font-medium">Service Term {index + 1}</h4>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onclick={() => removeServiceTerm(index)}
									disabled={!canEdit || isSaving}
								>
									Remove
								</Button>
							</div>
							<Field.Group>
								<Field.Field orientation="responsive">
									<Field.Content>
										<Field.Label>Topic</Field.Label>
									</Field.Content>
									<Input
										bind:value={serviceTerm.topic}
										placeholder="criminal-defense"
										disabled={!canEdit || isSaving}
									/>
								</Field.Field>
								<Field.Separator />
								<Field.Field orientation="responsive">
									<Field.Content>
										<Field.Label>Terms</Field.Label>
									</Field.Content>
									<MultiValueInput
										bind:values={serviceTerm.terms}
										placeholder="criminal defense attorney"
									/>
								</Field.Field>
							</Field.Group>
						</div>
					{/each}
					<Button
						type="button"
						variant="outline"
						onclick={addServiceTerm}
						disabled={!canEdit || isSaving}
					>
						Add Service Term
					</Button>
				</div>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Intent Modifiers</Field.Legend>
				<Field.Description>Modifiers to include or exclude from queries</Field.Description>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label>Exclude</Field.Label>
							<Field.Description>Terms to exclude from queries</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={intentExclude}
							placeholder="pro bono"
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label>Include</Field.Label>
							<Field.Description>Terms to include in queries</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={intentInclude}
							placeholder="best"
						/>
					</Field.Field>
				</Field.Group>
			</Field.Set>
		</Card.Content>
	</Card.Root>

	<!-- Query Keys -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Query Keys</Card.Title>
			<Card.Description>Additional query keys for tracking</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<Field.Set>
				<Field.Legend>Query Keys</Field.Legend>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label>Keys</Field.Label>
							<Field.Description>Query keys to track</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={queryKeys}
							placeholder="geo_audit"
						/>
					</Field.Field>
				</Field.Group>
			</Field.Set>
		</Card.Content>
	</Card.Root>

	<div class="flex justify-end gap-2">
		<Button variant="outline" onclick={() => window.location.reload()} disabled={isSaving}>
			Cancel
		</Button>
		<Button onclick={handleSave} disabled={!canEdit || isSaving}>
			{isSaving ? 'Saving...' : 'Save Changes'}
		</Button>
	</div>
</div>
