/**
 * Validation utilities for API endpoints
 * Provides UUID validation, input sanitization, and common validators
 */

/**
 * UUID v4 validation regex
 * Matches standard UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID v4
 */
export function isValidUUID(value: string): boolean {
	return UUID_REGEX.test(value);
}

/**
 * Validate UUID and throw error if invalid
 */
export function validateUUID(value: string, paramName: string): void {
	if (!value || typeof value !== 'string') {
		throw new Error(`${paramName} is required`);
	}
	if (!isValidUUID(value)) {
		throw new Error(`Invalid ${paramName} format`);
	}
}

/**
 * Sanitize string input by trimming and limiting length
 */
export function sanitizeString(
	input: string | null | undefined,
	maxLength: number = 1000,
	trim: boolean = true
): string {
	if (input === null || input === undefined) {
		return '';
	}
	let sanitized = String(input);
	if (trim) {
		sanitized = sanitized.trim();
	}
	if (sanitized.length > maxLength) {
		sanitized = sanitized.substring(0, maxLength);
	}
	return sanitized;
}

/**
 * Sanitize text input (for longer content like descriptions)
 */
export function sanitizeText(
	input: string | null | undefined,
	maxLength: number = 10000
): string {
	return sanitizeString(input, maxLength, true);
}

/**
 * Validate and sanitize slug format
 */
export function validateSlug(slug: string): string {
	if (!slug || typeof slug !== 'string') {
		throw new Error('Slug is required');
	}
	const sanitized = slug.trim().toLowerCase();
	if (!/^[a-z0-9-]+$/.test(sanitized)) {
		throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
	}
	if (sanitized.length < 1 || sanitized.length > 100) {
		throw new Error('Slug must be between 1 and 100 characters');
	}
	return sanitized;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string {
	if (!email || typeof email !== 'string') {
		throw new Error('Email is required');
	}
	const sanitized = email.trim().toLowerCase();
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(sanitized)) {
		throw new Error('Invalid email format');
	}
	if (sanitized.length > 255) {
		throw new Error('Email is too long');
	}
	return sanitized;
}

/**
 * Validate string length
 * @param allowEmpty - If true, allows empty strings (for optional fields)
 */
export function validateLength(
	value: string,
	min: number,
	max: number,
	fieldName: string,
	allowEmpty: boolean = false
): string {
	if (value === null || value === undefined) {
		if (allowEmpty) {
			return '';
		}
		throw new Error(`${fieldName} is required`);
	}
	if (typeof value !== 'string') {
		throw new Error(`${fieldName} must be a string`);
	}
	const trimmed = value.trim();
	if (trimmed.length === 0 && allowEmpty) {
		return '';
	}
	if (trimmed.length < min) {
		throw new Error(`${fieldName} must be at least ${min} characters`);
	}
	if (trimmed.length > max) {
		throw new Error(`${fieldName} must be no more than ${max} characters`);
	}
	return trimmed;
}

/**
 * Validate URL format
 */
export function validateURL(url: string | null | undefined): string | null {
	if (!url) {
		return null;
	}
	const sanitized = url.trim();
	if (sanitized.length > 2048) {
		throw new Error('URL is too long');
	}
	try {
		new URL(sanitized);
		return sanitized;
	} catch {
		throw new Error('Invalid URL format');
	}
}

/**
 * Validate workspace role
 */
export function validateWorkspaceRole(role: string): 'owner' | 'admin' | 'member' | 'viewer' {
	const validRoles: Array<'owner' | 'admin' | 'member' | 'viewer'> = [
		'owner',
		'admin',
		'member',
		'viewer',
	];
	if (!validRoles.includes(role as any)) {
		throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
	}
	return role as 'owner' | 'admin' | 'member' | 'viewer';
}

