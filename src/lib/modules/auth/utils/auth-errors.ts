import { fail } from "sveltekit-superforms";
import { AuthError } from "@supabase/supabase-js";
import {
  AuthErrorMessages,
  type AuthErrorType,
  type AuthResult,
} from "$lib/modules/auth/types";

/**
 * Maps Supabase auth errors to user-friendly error messages
 * @param error - The Supabase AuthError
 * @returns Object with error type and message
 */
export function mapAuthError(error: AuthError): {
  type: AuthErrorType;
  message: string;
  statusCode: number;
} {
  let errorType: AuthErrorType = "SERVER_ERROR";
  let message: string = AuthErrorMessages.SERVER_ERROR;
  let statusCode = 500;

  switch (error.message) {
    case "Invalid login credentials":
      errorType = "INVALID_CREDENTIALS";
      message = AuthErrorMessages.INVALID_CREDENTIALS;
      statusCode = 400;
      break;
    case "Email not confirmed":
      errorType = "EMAIL_NOT_CONFIRMED";
      message = AuthErrorMessages.EMAIL_NOT_CONFIRMED;
      statusCode = 400;
      break;
    case "Email rate limit exceeded":
      errorType = "RATE_LIMITED";
      message = AuthErrorMessages.RATE_LIMITED;
      statusCode = 429;
      break;
    case "User not found":
      errorType = "INVALID_EMAIL";
      message = AuthErrorMessages.INVALID_EMAIL;
      statusCode = 400;
      break;
    case "Email already registered":
    case "Email already in use":
      errorType = "EMAIL_IN_USE";
      message = AuthErrorMessages.EMAIL_IN_USE;
      statusCode = 400;
      break;
    case "Signup disabled":
      errorType = "SIGNUP_DISABLED";
      message = AuthErrorMessages.SIGNUP_DISABLED;
      statusCode = 403;
      break;
    case "Invalid email":
      errorType = "INVALID_EMAIL";
      message = AuthErrorMessages.INVALID_EMAIL;
      statusCode = 400;
      break;
    case "Password is too weak":
      errorType = "WEAK_PASSWORD";
      message = AuthErrorMessages.WEAK_PASSWORD;
      statusCode = 400;
      break;
    default:
      errorType = "SERVER_ERROR";
      message = "An unexpected error occurred. Please try again.";
      statusCode = 500;
  }

  return { type: errorType, message, statusCode };
}

/**
 * Handles Supabase auth errors and returns a SvelteKit fail response
 * @param form - The superforms form object
 * @param error - The Supabase AuthError
 * @returns SvelteKit fail response
 */
export function handleAuthError(form: any, error: AuthError) {
  console.error("Auth error:", error);

  const { type, message, statusCode } = mapAuthError(error);

  return fail(statusCode, {
    form,
    type,
    message,
  });
}

/**
 * Creates a standardized AuthResult response
 */
export function createAuthResult(
  success: boolean,
  type: AuthErrorType | "success",
  message: string,
  data?: any
): AuthResult {
  return {
    success,
    type,
    message,
    data,
  };
}

/**
 * Handles unexpected errors (non-Supabase errors)
 */
export function handleUnexpectedError(form: any, error: any): AuthResult {
  console.error("Unexpected error:", error);

  return {
    success: false,
    type: "SERVER_ERROR",
    message: AuthErrorMessages.SERVER_ERROR,
  };
}

