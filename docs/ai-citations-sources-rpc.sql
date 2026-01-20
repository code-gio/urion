-- ============================================================================
-- AI Citations Sources RPC Functions and Indexes
-- ============================================================================
-- This file contains RPC functions and indexes for the AI Citations Sources tab
-- ============================================================================

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================

-- Index for citation_jobs queries
CREATE INDEX IF NOT EXISTS idx_citation_jobs_project_status_finished
ON public.citation_jobs (project_id, status, run_finished_at DESC);

-- Partial index for succeeded jobs (more selective)
CREATE INDEX IF NOT EXISTS idx_citation_jobs_project_finished
ON public.citation_jobs (project_id, run_finished_at DESC)
WHERE status = 'succeeded';

-- Index for citation_answers job lookups
CREATE INDEX IF NOT EXISTS idx_citation_answers_job
ON public.citation_answers (job_id);

-- Index for citation_claims answer lookups
CREATE INDEX IF NOT EXISTS idx_citation_claims_answer
ON public.citation_claims (answer_id);

-- Index for citation_claim_citations claim_id lookups
CREATE INDEX IF NOT EXISTS idx_citation_claim_citations_claim_id
ON public.citation_claim_citations (claim_id);

-- Index for citation_claim_citations source_url lookups
CREATE INDEX IF NOT EXISTS idx_citation_claim_citations_source_url
ON public.citation_claim_citations (source_url);

-- Index for citation_claim_citations publisher lookups
CREATE INDEX IF NOT EXISTS idx_citation_claim_citations_publisher
ON public.citation_claim_citations (publisher);

-- ============================================================================
-- HELPER FUNCTION: normalize_domain
-- ============================================================================
-- Normalizes publisher/domain to avoid fragmentation (http:// vs https://, www., etc.)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.normalize_domain(url TEXT, publisher TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
	SELECT NULLIF(
		REGEXP_REPLACE(
			LOWER(COALESCE(publisher,
				SPLIT_PART(
					REGEXP_REPLACE(COALESCE(url, ''), '^https?://', '', 'i'),
					'/', 1
				)
			)),
			'^www\.', ''
		),
		''
	);
$$;

-- ============================================================================
-- RPC FUNCTION: get_ai_citations_sources
-- ============================================================================
-- Returns aggregated sources list with citation, claim, and query counts
-- Parameters:
--   project_id: UUID of the project
--   days: Number of days to look back (default: 7)
--   query_key: Optional query key filter (e.g., 'geo_audit')
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ai_citations_sources(
	project_id_param UUID,
	days_param INTEGER DEFAULT 7,
	query_key_param TEXT DEFAULT NULL
)
RETURNS TABLE (
	publisher TEXT,
	citations_count BIGINT,
	claims_count BIGINT,
	queries_count BIGINT,
	last_seen_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
	RETURN QUERY
	WITH runs AS (
		SELECT
			cj.id,
			cj.query_key,
			cj.rendered_query,
			cj.run_finished_at
		FROM public.citation_jobs cj
		WHERE cj.project_id = project_id_param
			AND cj.status = 'succeeded'
			AND cj.run_finished_at IS NOT NULL
			AND cj.run_finished_at >= NOW() - MAKE_INTERVAL(days => days_param)
			AND (query_key_param IS NULL OR cj.query_key = query_key_param)
	),
	citations AS (
		SELECT
			cc.id AS claim_id,
			ca.job_id,
			public.normalize_domain(ccc.source_url, ccc.publisher) AS publisher_norm
		FROM public.citation_claim_citations ccc
		JOIN public.citation_claims cc ON cc.id = ccc.claim_id
		JOIN public.citation_answers ca ON ca.id = cc.answer_id
		JOIN runs r ON r.id = ca.job_id
		WHERE ccc.source_url IS NOT NULL
	)
	SELECT
		c.publisher_norm AS publisher,
		COUNT(*)::BIGINT AS citations_count,
		COUNT(DISTINCT c.claim_id)::BIGINT AS claims_count,
		COUNT(DISTINCT r.rendered_query)::BIGINT AS queries_count,
		MAX(r.run_finished_at) AS last_seen_at
	FROM citations c
	JOIN runs r ON r.id = c.job_id
	WHERE c.publisher_norm IS NOT NULL
	GROUP BY c.publisher_norm
	ORDER BY citations_count DESC, last_seen_at DESC;
END;
$$;

-- ============================================================================
-- RPC FUNCTION: get_ai_citations_source_citations
-- ============================================================================
-- Returns detailed citations list for a specific publisher/domain
-- Parameters:
--   project_id: UUID of the project
--   publisher_param: Publisher/domain name to filter by
--   days: Number of days to look back (default: 7)
--   query_key: Optional query key filter
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ai_citations_source_citations(
	project_id_param UUID,
	publisher_param TEXT,
	days_param INTEGER DEFAULT 7,
	query_key_param TEXT DEFAULT NULL
)
RETURNS TABLE (
	run_finished_at TIMESTAMPTZ,
	query_key TEXT,
	rendered_query TEXT,
	claim_id UUID,
	claim_text TEXT,
	source_url TEXT,
	publisher TEXT,
	snippet TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
	RETURN QUERY
	WITH runs AS (
		SELECT
			cj.id,
			cj.query_key,
			cj.rendered_query,
			cj.run_finished_at
		FROM public.citation_jobs cj
		WHERE cj.project_id = project_id_param
			AND cj.status = 'succeeded'
			AND cj.run_finished_at IS NOT NULL
			AND cj.run_finished_at >= NOW() - MAKE_INTERVAL(days => days_param)
			AND (query_key_param IS NULL OR cj.query_key = query_key_param)
	)
	SELECT
		r.run_finished_at,
		r.query_key,
		r.rendered_query,
		cc.id AS claim_id,
		cc.claim_text,
		ccc.source_url,
		public.normalize_domain(ccc.source_url, ccc.publisher) AS publisher,
		COALESCE(ccc.snippet, ccc.citation_snippet) AS snippet
	FROM public.citation_claim_citations ccc
	JOIN public.citation_claims cc ON cc.id = ccc.claim_id
	JOIN public.citation_answers ca ON ca.id = cc.answer_id
	JOIN runs r ON r.id = ca.job_id
	WHERE public.normalize_domain(ccc.source_url, ccc.publisher) = LOWER(REGEXP_REPLACE(publisher_param, '^www\.', ''))
	ORDER BY r.run_finished_at DESC
	LIMIT 200;
END;
$$;

-- ============================================================================
-- RPC FUNCTION: get_ai_citations_source_queries
-- ============================================================================
-- Returns query breakdown for a specific publisher/domain
-- Parameters:
--   project_id: UUID of the project
--   publisher_param: Publisher/domain name to filter by
--   days: Number of days to look back (default: 7)
--   query_key: Optional query key filter
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ai_citations_source_queries(
	project_id_param UUID,
	publisher_param TEXT,
	days_param INTEGER DEFAULT 7,
	query_key_param TEXT DEFAULT NULL
)
RETURNS TABLE (
	query_key TEXT,
	rendered_query TEXT,
	citations_count BIGINT,
	last_seen_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
	RETURN QUERY
	WITH runs AS (
		SELECT
			cj.id,
			cj.query_key,
			cj.rendered_query,
			cj.run_finished_at
		FROM public.citation_jobs cj
		WHERE cj.project_id = project_id_param
			AND cj.status = 'succeeded'
			AND cj.run_finished_at IS NOT NULL
			AND cj.run_finished_at >= NOW() - MAKE_INTERVAL(days => days_param)
			AND (query_key_param IS NULL OR cj.query_key = query_key_param)
	)
	SELECT
		r.query_key,
		r.rendered_query,
		COUNT(*)::BIGINT AS citations_count,
		MAX(r.run_finished_at) AS last_seen_at
	FROM public.citation_claim_citations ccc
	JOIN public.citation_claims cc ON cc.id = ccc.claim_id
	JOIN public.citation_answers ca ON ca.id = cc.answer_id
	JOIN runs r ON r.id = ca.job_id
	WHERE public.normalize_domain(ccc.source_url, ccc.publisher) = LOWER(REGEXP_REPLACE(publisher_param, '^www\.', ''))
	GROUP BY r.query_key, r.rendered_query
	ORDER BY citations_count DESC, last_seen_at DESC
	LIMIT 200;
END;
$$;
