export interface AICitationSource {
	publisher: string;
	citations_count: number;
	claims_count: number;
	queries_count: number;
	last_seen_at: string;
}

export interface AICitationDetail {
	run_finished_at: string;
	query_key: string;
	rendered_query: string;
	claim_id: string;
	claim_text: string;
	source_url: string;
	publisher: string;
	snippet: string;
}

export interface AICitationSourceQuery {
	query_key: string;
	rendered_query: string;
	citations_count: number;
	last_seen_at: string;
}

export interface AICitationSourceDetailHeader {
	publisher: string;
	citations_count: number;
	claims_count: number;
	queries_count: number;
	last_seen_at: string;
}
