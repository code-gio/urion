// =====================================================
// PROJECT SETTINGS TYPES
// =====================================================
// TypeScript type system for project settings and related entities
// Maps 1:1 to database schema and UI components
// =====================================================

// =====================================================
// 1) SHARED PRIMITIVES & ENUMS
// =====================================================

import type { UUID } from './utils.js';

export type ISODateString = string; // timestamptz serialized

export type CrawlSourceType =
  | 'sitemap'
  | 'robots'
  | 'rss'
  | 'url_list'
  | 'docs'
  | 'api'
  | 'other';

export type KeywordIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational'
  | 'local'
  | 'unknown';

export type CompetitorType =
  | 'direct'
  | 'indirect'
  | 'serp'
  | 'content'
  | 'tool'
  | 'marketplace'
  | 'other';

export type IntegrationType =
  | 'analytics'
  | 'crm'
  | 'cms'
  | 'ads'
  | 'email'
  | 'payment'
  | 'support'
  | 'ab_testing'
  | 'other';

// =====================================================
// 2) PROJECT SETTINGS (JSONB-backed, 1:1)
// =====================================================

// 2.1 DB row
export interface ProjectSettingsRow {
  project_id: UUID;
  workspace_id: UUID;

  industry: string | null;
  primary_language: string | null;
  target_countries: string[];

  settings: ProjectSettings;

  created_by: UUID | null;
  updated_by: UUID | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// 2.2 Strongly typed JSONB structure

// Top-level settings document
export interface ProjectSettings {
  site?: SiteSettings;
  brand?: BrandSettings;
  seo?: SeoSettings;
  ai?: AiSettings;
  analytics?: AnalyticsSettings;
  tech?: TechSettings;
  legal?: LegalSettings;
  governance?: GovernanceSettings;
  performance?: PerformanceSettings;
}

// Site
export interface SiteSettings {
  description?: string;
  canonical_domain?: string;
  languages?: string[]; // ['en-US', 'es-ES']
  timezone?: string;
  currency?: string;
  measurement_system?: 'metric' | 'imperial';
  social_profiles?: Record<string, string>; // platform -> url
}

// Brand Voice (critical for AI)
export interface BrandSettings {
  brand_name?: string;
  voice_description?: string;
  tone_tags?: string[];
  reading_level?: 'general' | 'professional' | 'expert';
  point_of_view?: 'we' | 'they' | 'you';
  spelling_variant?: 'US' | 'UK' | 'AU' | 'CA';
  do_words?: string[];
  dont_words?: string[];
  required_phrases?: string[];
  prohibited_claims?: string[];
  formatting_rules?: {
    use_bullets_when_possible?: boolean;
    avoid_emojis?: boolean;
    max_sentence_length?: number;
  };
  examples?: {
    good?: string;
    bad?: string;
  };
}

// SEO strategy
export interface SeoSettings {
  canonical_strategy?: string;
  url_structure_rules?: string;
  schema_org_types?: string[];
  internal_linking_guidelines?: string;
  noindex_patterns?: string[];
  notes?: string;
}

// AI guardrails
export interface AiSettings {
  allowed_use_cases?: string[];
  disallowed_use_cases?: string[];
  require_human_review?: boolean;
  citation_expectations?: 'required' | 'optional' | 'none';
  approved_source_domains?: string[];
  blocked_source_domains?: string[];
  prompt_preamble?: string;
}

// Analytics
export interface AnalyticsSettings {
  ga4_measurement_id?: string;
  gtm_container_id?: string;
  gsc_property?: string;
  primary_kpis?: string[];
  secondary_kpis?: string[];
  reporting_cadence?: 'weekly' | 'monthly' | 'quarterly';
}

// Tech stack
export interface TechSettings {
  cms?: string;
  framework?: string | null;
  hosting?: string;
  cdn?: string;
  notes?: string;
}

// Legal & compliance
export interface LegalSettings {
  privacy_policy_url?: string;
  terms_url?: string;
  cookie_policy_url?: string;
  accessibility_statement_url?: string | null;
  compliance_frameworks?: string[];
  required_disclaimers?: string[];
}

// Governance
export interface GovernanceSettings {
  content_owner_name?: string;
  approval_workflow?: string[]; // ['draft','review','publish']
  freshness_sla_days?: number;
  notes?: string;
}

// Performance targets
export interface PerformanceSettings {
  cwv_targets?: {
    lcp_ms?: number;
    inp_ms?: number;
    cls?: number;
  };
  mobile_first?: boolean;
}

// =====================================================
// 3) 1:N TABLES (List-based editors)
// =====================================================

// Crawl Sources
export interface ProjectCrawlSource {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  source_type: CrawlSourceType;
  url: string;
  is_primary: boolean;

  include_patterns: string[];
  exclude_patterns: string[];
  respect_robots: boolean;

  fetch_frequency_hours: number | null;
  last_fetched_at: ISODateString | null;
  last_fetch_status: string | null;
  last_http_status: number | null;
  last_etag: string | null;
  last_modified: string | null;

  notes: string | null;

  created_by: UUID | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Competitors
export interface ProjectCompetitor {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  name: string;
  website_url: string | null;
  competitor_type: CompetitorType;

  positioning: string | null;
  differentiators: string[];
  notes: string | null;
  priority: 1 | 2 | 3 | 4 | 5;

  created_by: UUID | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Topic Clusters
export interface ProjectTopicCluster {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  name: string;
  description: string | null;
  is_pillar: boolean;
  notes: string | null;

  created_at: ISODateString;
  updated_at: ISODateString;
}

// Keywords
export interface ProjectKeyword {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  keyword: string;
  locale: string | null;
  intent: KeywordIntent;
  priority: 1 | 2 | 3 | 4 | 5;

  cluster_id: UUID | null;
  target_page_url: string | null;
  notes: string | null;

  created_at: ISODateString;
  updated_at: ISODateString;
}

// Conversion Goals
export interface ProjectConversionGoal {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  name: string;
  goal_type: string | null;
  event_name: string | null;
  is_primary: boolean;
  value: number | null;
  notes: string | null;

  created_at: ISODateString;
  updated_at: ISODateString;
}

// Integrations (non-secret)
export interface ProjectIntegration {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  integration_type: IntegrationType;
  provider: string;
  external_account_id: string | null;
  status: 'active' | 'disabled' | 'error';
  config: Record<string, unknown>;
  notes: string | null;

  created_at: ISODateString;
  updated_at: ISODateString;
}

// Offerings (products / services)
export interface ProjectOffering {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  name: string;
  offering_type: 'service' | 'product' | 'plan' | string | null;
  description: string | null;
  pricing_notes: string | null;
  url: string | null;
  is_primary: boolean;

  created_at: ISODateString;
  updated_at: ISODateString;
}

// Personas
export interface ProjectPersona {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  name: string;
  description: string | null;
  pain_points: string[];
  desired_outcomes: string[];
  objections: string[];
  vocabulary: string[];

  created_at: ISODateString;
  updated_at: ISODateString;
}

// Locations
export interface ProjectLocation {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  name: string | null;
  is_primary: boolean;

  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;

  phone: string | null;
  email: string | null;
  hours: Record<string, unknown>;
  lat: number | null;
  lng: number | null;

  created_at: ISODateString;
  updated_at: ISODateString;
}

// Content Rules
export interface ProjectContentRule {
  id: UUID;
  workspace_id: UUID;
  project_id: UUID;

  rule_scope: 'path_prefix' | 'path_regex' | 'exact_url';
  pattern: string;

  allow_ai_edit: boolean | null;
  allow_ai_generate: boolean | null;
  allow_index: boolean | null;

  notes: string | null;

  created_at: ISODateString;
  updated_at: ISODateString;
}

// =====================================================
// 4) UI HELPER TYPES
// =====================================================

// Editable variants (forms)
export type Editable<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

// Partial settings updates per tab
export type ProjectSettingsPatch = Partial<ProjectSettings>;

// Tab-to-data mapping (useful for routing)
export type SettingsTab =
  | 'overview'
  | 'website'
  | 'brand'
  | 'seo'
  | 'competitors'
  | 'offerings'
  | 'personas'
  | 'keywords'
  | 'goals'
  | 'integrations'
  | 'content_rules'
  | 'locations';
