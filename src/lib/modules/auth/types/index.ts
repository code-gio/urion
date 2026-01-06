import type { UUID } from "$lib/types/utils";

export const AuthErrorMessages = {
	INVALID_CREDENTIALS: "Invalid email or password",
	EMAIL_NOT_CONFIRMED: "Please verify your email before signing in",
	RATE_LIMITED: "Too many sign in attempts. Please try again later",
	ALREADY_LOGGED_IN: "You are already logged in",
	SERVER_ERROR: "An unexpected error occurred. Please try again",
	INVALID_EMAIL: "Please enter a valid email address",
	EMAIL_IN_USE: "This email is already registered",
	SIGNUP_DISABLED: "Signups are currently disabled",
	WEAK_PASSWORD: "Password is too weak. Please choose a stronger password",
} as const;

export type AuthErrorType = keyof typeof AuthErrorMessages;

export interface AuthResult {
	success: boolean;
	type: AuthErrorType | "success";
	message: string;
	data?: any;
}

// ============================================================================
// 15. Auth / Session Helpers
// ============================================================================

export interface AuthUser {
	id: UUID;
	email: string;
	role?: "admin" | "organizer" | "user";
}

