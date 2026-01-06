// =====================================================
// UTILITY TYPES
// =====================================================

// UUID type alias
export type UUID = string;

// Helper to make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Helper to make all properties required recursively
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Helper to pick specific properties and make them required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Helper to omit properties
export type OmitFields<T, K extends keyof T> = Omit<T, K>;

// =====================================================
// VALIDATION TYPES
// =====================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =====================================================
// FILTER & SORT TYPES
// =====================================================

export type SortOrder = 'asc' | 'desc';

export interface SortOption<T> {
  field: keyof T;
  order: SortOrder;
}

export interface FilterOption<T> {
  field: keyof T;
  value: unknown;
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in';
}

// =====================================================
// WEBHOOK TYPES (for future use)
// =====================================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: unknown;
  created_at: string;
}

export interface StripeWebhookEvent extends WebhookEvent {
  type: 'stripe.subscription.created' | 'stripe.subscription.updated' | 'stripe.subscription.deleted';
  data: {
    subscription_id: string;
    customer_id: string;
    status: string;
  };
}

