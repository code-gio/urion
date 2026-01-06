/**
 * Slug generation utility
 * Converts names to URL-friendly slugs
 */

/**
 * Generate a slug from a name
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Remove leading/trailing hyphens
 * - Collapse multiple hyphens
 */
export function generateSlug(name: string): string {
	if (!name || typeof name !== 'string') {
		return '';
	}

	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
		.replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
		.replace(/-+/g, '-') // Collapse multiple hyphens
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

